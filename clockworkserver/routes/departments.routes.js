const express = require('express');
const pool = require('../db');
const { requireAuth, getAccessibleDepartmentIds } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/departments',
  requireAuth,
  async (req, res) => {
    const client = await pool.connect();
    try {
      if (req.user.role === 'ADMIN') {
        const { rows } = await client.query(
          `SELECT id, name
             FROM departments
             ORDER BY name ASC`
        );
        return res.json(rows);
      }

      const departmentIds = getAccessibleDepartmentIds(req.user).map(Number);
      if (departmentIds.length === 0) {
        return res.json([]);
      }

      const { rows } = await client.query(
        `SELECT id, name
           FROM departments
          WHERE id = ANY($1::int[])
          ORDER BY name ASC`,
        [departmentIds]
      );
      return res.json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
