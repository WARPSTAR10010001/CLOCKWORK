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
    secure: !!(process.env.COOKIE_SECURE === 'true'),
    maxAge: 1000 * 60 * 60 * 12, // 12h
    path: '/',
  };
}

// POST /api/auth/login
// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Nutzername und Passwort erforderlich' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role, department_id, is_active, password_reset, last_login_at
         FROM system_users
        WHERE username = $1 AND is_active = TRUE`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Falscher Nutzername oder Passwort' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Falscher Nutzername oder Passwort' });
    }

    // === letzten Loginzeitpunkt setzen ===
    const now = new Date();
    await pool.query(
      `UPDATE system_users
          SET last_login_at = $1
        WHERE id = $2`,
      [now, user.id]
    );

    const payload = { sub: user.id, role: user.role, departmentId: user.department_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', token, jwtCookieOptions());

    return res.json({
      token,
      loggedIn: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        departmentId: user.department_id,
        passwordReset: !!user.password_reset,
        lastLoginAt: user.last_login_at || now.toISOString()
      },
      expHours: 12
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (_req, res) => {
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
        passwordReset: !!u.password_reset,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ loggedIn: false, user: null });
  }
});

router.post('/users', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const { departmentId, username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Nutzername, Passwort und Rolle benötigt' });
  }
  if (!['ADMIN','MOD','USER'].includes(role)) {
    return res.status(400).json({ error: 'Ungültige Rolle' });
  }
  if (role !== 'ADMIN' && !departmentId) {
    return res.status(400).json({ error: 'departmentId benötigt für alle Moderatoren und Nutzer' });
  }
  if (req.user.role === 'MOD' && String(req.user.departmentId) !== String(departmentId)) {
    return res.status(403).json({ error: 'Moderatoren können nur für eigenen Fachbereich Mitarbeiter erstellen' });
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
    if (err.code === '23505') return res.status(409).json({ error: 'Nutzername existiert bereits' });
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// PATCH /api/users/password
router.patch('/users/password', requireAuth, async (req, res) => {
  const { newPassword, targetUserId } = req.body || {};
  if (!newPassword) return res.status(400).json({ error: 'Neues Passwort erforderlich' });

  const client = await pool.connect();
  try {
    let userId = req.user.sub;
    let isSelf = true;

    if (targetUserId && (req.user.role === 'ADMIN' || req.user.role === 'MOD')) {
      userId = targetUserId;
      isSelf = String(targetUserId) === String(req.user.sub);
    } else if (targetUserId && req.user.role === 'USER') {
      return res.status(403).json({ error: 'Nutzer kann nicht das Passwort eines anderen Nutzers ändern' });
    }

    // password_reset mit auslesen
    const u = await client.query(
      'SELECT id, password_hash, department_id, role, password_reset FROM system_users WHERE id=$1',
      [userId]
    );
    if (u.rowCount === 0) return res.status(404).json({ error: 'Nutzer wurde nicht gefunden' });
    const user = u.rows[0];

    // MOD darf nur im eigenen Department
    if (!isSelf && req.user.role === 'MOD' &&
        String(req.user.departmentId) !== String(user.department_id)) {
      return res.status(403).json({ error: 'Moderator kann nur die Passwörter aus dem eigenen Fachbereich ändern' });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

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
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
});

// POST /api/users/:id/reset-password
router.post('/users/:id/reset-password', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const targetUserId = req.params.id;
  const { newPassword } = req.body || {};
  const tempPw = newPassword && String(newPassword).length >= 4 ? String(newPassword) : 'reset';

  const client = await pool.connect();
  try {
    const q = await client.query(
      `SELECT id, department_id FROM system_users WHERE id=$1`,
      [targetUserId]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'Nutzer wurde nicht gefunden' });

    const target = q.rows[0];

    if (req.user.role === 'MOD' &&
        String(req.user.departmentId) !== String(target.department_id)) {
      return res.status(403).json({ error: 'Moderator kann nur die Passwörter aus dem eigenen Fachbereich ändern' });
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
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
});

// =========================
// PASSWORT-RESETS NACH ROLLE & DEPARTMENT
// =========================

// POST /api/departments/:deptId/reset-user-password
// Erlaubt: ADMIN und MOD
// MOD darf nur im eigenen Department.
// Setzt das Passwort des *USER*-Kontos dieses Fachbereichs auf 'reset' und aktiviert password_reset.
router.post('/departments/:deptId/reset-user-password', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const deptId = req.params.deptId;

  const client = await pool.connect();
  try {
    // MOD darf nur im eigenen Dept
    if (req.user.role === 'MOD' && String(req.user.departmentId) !== String(deptId)) {
      return res.status(403).json({ error: 'Moderator darf nur im eigenen Fachbereich zurücksetzen.' });
    }

    // Ziel-User (role USER) im Dept finden
    const q = await client.query(
      `SELECT id, username, role, department_id
         FROM system_users
        WHERE role = 'USER' AND department_id = $1 AND is_active = TRUE
        LIMIT 1`,
      [deptId]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'Kein USER-Konto in diesem Fachbereich gefunden.' });

    const target = q.rows[0];
    const hash = await bcrypt.hash('reset', SALT_ROUNDS);

    const upd = await client.query(
      `UPDATE system_users
          SET password_hash = $1,
              password_reset = TRUE
        WHERE id = $2
        RETURNING id, username, role, department_id, password_reset`,
      [hash, target.id]
    );

    return res.json({ success: true, user: upd.rows[0], initialPassword: 'reset' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
});


// POST /api/departments/:deptId/reset-mod-password
// Erlaubt: nur ADMIN
// Setzt das Passwort des *MOD*-Kontos dieses Fachbereichs auf 'reset' und aktiviert password_reset.
router.post('/departments/:deptId/reset-mod-password', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const deptId = req.params.deptId;

  const client = await pool.connect();
  try {
    // Ziel-User (role MOD) im Dept finden
    const q = await client.query(
      `SELECT id, username, role, department_id
         FROM system_users
        WHERE role = 'MOD' AND department_id = $1 AND is_active = TRUE
        LIMIT 1`,
      [deptId]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'Kein MOD-Konto in diesem Fachbereich gefunden.' });

    const target = q.rows[0];
    const hash = await bcrypt.hash('reset', SALT_ROUNDS);

    const upd = await client.query(
      `UPDATE system_users
          SET password_hash = $1,
              password_reset = TRUE
        WHERE id = $2
        RETURNING id, username, role, department_id, password_reset`,
      [hash, target.id]
    );

    return res.json({ success: true, user: upd.rows[0], initialPassword: 'reset' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
});

module.exports = router;