const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await pool.query(
      'SELECT id, username, password_hash, role, department_id FROM system_users WHERE username = $1 AND is_active = TRUE',
      [username]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      { sub: user.id, role: user.role, departmentId: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, role: user.role, departmentId: user.department_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;