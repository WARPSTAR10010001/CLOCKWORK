// src/routes/authUsers.routes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

function jwtCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!(process.env.COOKIE_SECURE === 'true'), // setze in PROD auf true
    maxAge: 1000 * 60 * 60 * 12, // 12h
    path: '/',
  };
}

/* =========================
   AUTH: LOGIN / LOGOUT / STATUS
   ========================= */

// POST /api/login
// Body: { username, password }
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role, department_id, is_active, password_reset
         FROM system_users
        WHERE username = $1 AND is_active = TRUE`,
      [username]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    const payload = { sub: user.id, role: user.role, departmentId: user.department_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Cookie + JSON zurückgeben (Frontend nutzt withCredentials)
    res.cookie('token', token, jwtCookieOptions());

    return res.json({
      token, // optional; Cookie reicht, aber lassen wir zur Kompatibilität drin
      loggedIn: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.department_id,
        passwordReset: !!user.password_reset, // 👈 wichtig fürs Overlay im FE
      },
      expHours: 12,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ loggedIn: false });
});

// GET /api/auth/status
router.get('/auth/status', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, role, department_id, password_reset
         FROM system_users
        WHERE id = $1 AND is_active = TRUE`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.json({ loggedIn: false, user: null });

    const u = rows[0];
    return res.json({
      loggedIn: true,
      user: {
        id: u.id,
        username: u.username,
        role: u.role,
        departmentId: u.department_id,
        passwordReset: !!u.password_reset, // 👈 mitgeben
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ loggedIn: false, user: null });
  }
});

/* =========================
   USER MANAGEMENT
   ========================= */

// POST /api/users
// Body: { departmentId (nullable for ADMIN), username, password, role: 'ADMIN'|'MOD'|'USER' }
router.post('/users', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const { departmentId, username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, role required' });
  }
  if (!['ADMIN','MOD','USER'].includes(role)) {
    return res.status(400).json({ error: 'invalid role' });
  }
  if (role !== 'ADMIN' && !departmentId) {
    return res.status(400).json({ error: 'departmentId required for non-ADMIN users' });
  }
  // MOD darf nur im eigenen Department anlegen
  if (req.user.role === 'MOD' && String(req.user.departmentId) !== String(departmentId)) {
    return res.status(403).json({ error: 'MOD can only create users in own department' });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO system_users (department_id, username, password_hash, role, password_reset, is_active)
       VALUES ($1,$2,$3,$4, TRUE, TRUE)
       RETURNING id, department_id, username, role, is_active, password_reset, created_at`,
      [role === 'ADMIN' ? null : departmentId, username, hash, role]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'username already exists' });
    return res.status(500).json({ error: 'Internal error' });
  }
});

// PATCH /api/users/password
// Self-change ODER Admin/Mod für targetUserId
// - Self-change: oldPassword required; setzt password_reset = FALSE
// - Admin/Mod  : darf targetUserId ändern (MOD nur im eigenen Department); setzt password_reset = TRUE (Reset-Flow)
router.patch('/users/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword, targetUserId } = req.body || {};
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

  const client = await pool.connect();
  try {
    let userId = req.user.sub;
    let isSelf = true;

    if (targetUserId && (req.user.role === 'ADMIN' || req.user.role === 'MOD')) {
      userId = targetUserId;
      isSelf = String(targetUserId) === String(req.user.sub);
    } else if (targetUserId && req.user.role === 'USER') {
      return res.status(403).json({ error: 'User cannot change other users passwords' });
    }

    const u = await client.query(
      'SELECT id, password_hash, department_id, role FROM system_users WHERE id=$1',
      [userId]
    );
    if (u.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const user = u.rows[0];

    // MOD darf nur innerhalb seines Departments an anderen Nutzern agieren
    if (!isSelf && req.user.role === 'MOD' &&
        String(req.user.departmentId) !== String(user.department_id)) {
      return res.status(403).json({ error: 'MOD can only change passwords in own department' });
    }

    // Self-change: oldPassword prüfen
    if (isSelf) {
      if (!oldPassword) return res.status(400).json({ error: 'oldPassword required for self change' });
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Old password incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    // isSelf → password_reset FALSE (erledigt), sonst TRUE (Reset erzwingen)
    const resetFlag = isSelf ? false : true;

    const upd = await client.query(
      `UPDATE system_users
          SET password_hash = $1,
              password_reset = $2
        WHERE id = $3
        RETURNING id, username, role, department_id, password_reset`,
      [hash, resetFlag, user.id]
    );

    return res.json({ success: true, user: upd.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// POST /api/users/:id/reset-password
// Admin überall; Mod nur im eigenen Department.
// Body: { newPassword? } – optional, default 'init'.
// Setzt password_reset = TRUE.
router.post('/users/:id/reset-password', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const targetUserId = req.params.id;
  const { newPassword } = req.body || {};
  const tempPw = newPassword && String(newPassword).length >= 4 ? String(newPassword) : 'init';

  const client = await pool.connect();
  try {
    const q = await client.query(
      `SELECT id, department_id FROM system_users WHERE id=$1`,
      [targetUserId]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const target = q.rows[0];

    if (req.user.role === 'MOD' &&
        String(req.user.departmentId) !== String(target.department_id)) {
      return res.status(403).json({ error: 'MOD can only reset passwords in own department' });
    }

    const hash = await bcrypt.hash(tempPw, SALT_ROUNDS);
    const upd = await client.query(
      `UPDATE system_users
          SET password_hash = $1,
              password_reset = TRUE
        WHERE id = $2
        RETURNING id, username, role, department_id, password_reset`,
      [hash, target.id]
    );

    return res.json({
      success: true,
      user: upd.rows[0],
      initialPassword: tempPw === 'init' ? 'init' : undefined
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

module.exports = router;