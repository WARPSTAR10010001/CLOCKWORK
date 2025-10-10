const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/departments
 * - Admins: sehen alle Fachbereiche
 * - Mods/Users: sehen nur ihren eigenen (aus JWT)
 */
router.get(
  '/departments',
  requireAuth,
  async (req, res) => {
    const client = await pool.connect();
    try {
      if (req.user.role === 'ADMIN') {
        // Admin → alle Fachbereiche
        const { rows } = await client.query(
          `SELECT id, name
             FROM departments
             ORDER BY name ASC`
        );
        return res.json(rows);
      } else {
        // Mod/User → nur eigener Fachbereich
        const { rows } = await client.query(
          `SELECT id, name
             FROM departments
             WHERE id = $1`,
          [req.user.departmentId]
        );
        return res.json(rows);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;