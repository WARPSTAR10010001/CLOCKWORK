const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

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
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO system_users (department_id, username, password_hash, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, department_id, username, role, is_active, created_at`,
      [role === 'ADMIN' ? null : departmentId, username, hash, role]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'username already exists' });
    return res.status(500).json({ error: 'Internal error' });
  }
});

router.patch('/users/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword, targetUserId } = req.body || {};
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

  const client = await pool.connect();
  try {
    let userId = req.user.sub;
    if (targetUserId && (req.user.role === 'ADMIN' || req.user.role === 'MOD')) {
      userId = targetUserId;
    } else if (targetUserId && req.user.role === 'USER') {
      return res.status(403).json({ error: 'User cannot change other users passwords' });
    }

    const u = await client.query(
      'SELECT id, password_hash, department_id, role FROM system_users WHERE id=$1',
      [userId]
    );
    if (u.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const user = u.rows[0];

    if (!targetUserId || String(user.id) === String(req.user.sub)) {
      if (!oldPassword) return res.status(400).json({ error: 'oldPassword required' });
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Old password incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await client.query('UPDATE system_users SET password_hash=$1 WHERE id=$2', [hash, user.id]);

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

module.exports = router;