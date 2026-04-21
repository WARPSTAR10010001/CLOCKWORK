const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth, requireRole, canAccessDepartment } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const MANAGER_ROLE = 'AREA_MANAGER';

function jwtCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!(process.env.COOKIE_SECURE === 'true'),
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  };
}

async function getAssignedDepartmentIds(client, userId) {
  const { rows } = await client.query(
    `SELECT department_id
       FROM user_department_access
      WHERE user_id = $1
      ORDER BY department_id ASC`,
    [userId]
  );

  return rows.map((row) => Number(row.department_id)).filter(Number.isFinite);
}

async function buildUserResponse(client, userRow) {
  const assignedDepartmentIds = await getAssignedDepartmentIds(client, userRow.id);
  const departmentIds = userRow.role === MANAGER_ROLE
    ? assignedDepartmentIds
    : (userRow.department_id != null ? [Number(userRow.department_id)] : []);

  return {
    id: userRow.id,
    username: userRow.username,
    role: userRow.role,
    departmentId: userRow.department_id,
    departmentIds,
    assignedDepartmentIds,
    passwordReset: !!userRow.password_reset,
    lastLoginAt: userRow.last_login_at
  };
}

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Nutzername und Passwort erforderlich' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
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

    const now = new Date();
    await client.query(
      `UPDATE system_users
          SET last_login_at = $1
        WHERE id = $2`,
      [now, user.id]
    );

    const assignedDepartmentIds = await getAssignedDepartmentIds(client, user.id);
    const departmentIds = user.role === MANAGER_ROLE
      ? assignedDepartmentIds
      : (user.department_id != null ? [Number(user.department_id)] : []);

    const payload = {
      sub: user.id,
      role: user.role,
      departmentId: user.department_id,
      departmentIds
    };
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
        departmentIds,
        assignedDepartmentIds,
        passwordReset: !!user.password_reset,
        lastLoginAt: user.last_login_at || now.toISOString()
      },
      expHours: 12
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Datenbankfehler' });
  } finally {
    client.release();
  }
});

router.post('/auth/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ loggedIn: false });
});

router.get('/auth/status', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, role, department_id, password_reset
         FROM system_users
        WHERE id = $1 AND is_active = TRUE`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.json({ loggedIn: false, user: null });

    const user = await buildUserResponse(client, rows[0]);
    return res.json({
      loggedIn: true,
      user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ loggedIn: false, user: null });
  } finally {
    client.release();
  }
});

router.post('/users', requireAuth, requireRole('ADMIN', 'MOD'), async (req, res) => {
  const { departmentId, departmentIds, username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Nutzername, Passwort und Rolle benoetigt' });
  }

  if (!['ADMIN', 'MOD', 'USER', MANAGER_ROLE].includes(role)) {
    return res.status(400).json({ error: 'Ungueltige Rolle' });
  }

  if (req.user.role === 'MOD' && role !== 'USER') {
    return res.status(403).json({ error: 'Moderatoren koennen nur USER-Konten erstellen' });
  }

  const cleanDepartmentIds = Array.isArray(departmentIds)
    ? Array.from(
      new Set(
        departmentIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    )
    : [];

  if (role === MANAGER_ROLE && cleanDepartmentIds.length === 0) {
    return res.status(400).json({ error: 'departmentIds benoetigt fuer Fachbereichsleiter' });
  }

  if (role !== 'ADMIN' && role !== MANAGER_ROLE && !departmentId) {
    return res.status(400).json({ error: 'departmentId benoetigt fuer Moderatoren und Nutzer' });
  }

  if (req.user.role === 'MOD' && !canAccessDepartment(req.user, departmentId)) {
    return res.status(403).json({ error: 'Moderatoren koennen nur fuer den eigenen Fachbereich Mitarbeiter erstellen' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const primaryDepartmentId = role === 'ADMIN'
        ? null
        : role === MANAGER_ROLE
          ? cleanDepartmentIds[0]
          : departmentId;

      const { rows } = await client.query(
        `INSERT INTO system_users (department_id, username, password_hash, role, password_reset, is_active)
         VALUES ($1,$2,$3,$4, TRUE, TRUE)
         RETURNING id, department_id, username, role, is_active, password_reset, created_at`,
        [primaryDepartmentId, username, hash, role]
      );

      const createdUser = rows[0];

      if (role === MANAGER_ROLE) {
        for (const depId of cleanDepartmentIds) {
          await client.query(
            `INSERT INTO user_department_access (user_id, department_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, department_id) DO NOTHING`,
            [createdUser.id, depId]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({
        ...createdUser,
        departmentIds: role === MANAGER_ROLE ? cleanDepartmentIds : (primaryDepartmentId ? [primaryDepartmentId] : [])
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Nutzername existiert bereits' });
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.patch('/users/password', requireAuth, async (req, res) => {
  const { newPassword, targetUserId } = req.body || {};
  if (!newPassword) return res.status(400).json({ error: 'Neues Passwort erforderlich' });

  const client = await pool.connect();
  try {
    let userId = req.user.sub;
    let isSelf = true;

    if (targetUserId && (req.user.role === 'ADMIN' || req.user.role === 'MOD' || req.user.role === MANAGER_ROLE)) {
      userId = targetUserId;
      isSelf = String(targetUserId) === String(req.user.sub);
    } else if (targetUserId && req.user.role === 'USER') {
      return res.status(403).json({ error: 'Nutzer kann nicht das Passwort eines anderen Nutzers aendern' });
    }

    const u = await client.query(
      'SELECT id, password_hash, department_id, role, password_reset FROM system_users WHERE id=$1',
      [userId]
    );
    if (u.rowCount === 0) return res.status(404).json({ error: 'Nutzer wurde nicht gefunden' });
    const user = u.rows[0];

    if (!isSelf && !canAccessDepartment(req.user, user.department_id)) {
      return res.status(403).json({ error: 'Zugriff auf diesen Fachbereich verweigert' });
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

router.post('/users/:id/reset-password', requireAuth, requireRole('ADMIN', 'MOD', MANAGER_ROLE), async (req, res) => {
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

    if (!canAccessDepartment(req.user, target.department_id)) {
      return res.status(403).json({ error: 'Zugriff auf diesen Fachbereich verweigert' });
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

router.post('/departments/:deptId/reset-user-password', requireAuth, requireRole('ADMIN', 'MOD', MANAGER_ROLE), async (req, res) => {
  const deptId = req.params.deptId;

  const client = await pool.connect();
  try {
    if (!canAccessDepartment(req.user, deptId)) {
      return res.status(403).json({ error: 'Zugriff auf diesen Fachbereich verweigert.' });
    }

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

router.post('/departments/:deptId/reset-mod-password', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const deptId = req.params.deptId;

  const client = await pool.connect();
  try {
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
