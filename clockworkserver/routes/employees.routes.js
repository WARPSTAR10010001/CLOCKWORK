const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

// POST /api/employees
// Body: { departmentId, displayName, startMonth (YYYY-MM-01), endMonth?, annualLeaveDays?, carryoverDays? }
router.post(
  '/employees',
  requireAuth,
  requireRole('MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { departmentId, displayName, startMonth, endMonth, annualLeaveDays = 30, carryoverDays = 0 } = req.body || {};
    if (!departmentId || !displayName || !startMonth) {
      return res.status(400).json({ error: 'departmentId, displayName, startMonth required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startMonth)) return res.status(400).json({ error: 'startMonth must be YYYY-MM-DD' });
    if (endMonth && !/^\d{4}-\d{2}-\d{2}$/.test(endMonth)) return res.status(400).json({ error: 'endMonth must be YYYY-MM-DD' });

    try {
      const { rows } = await pool.query(
        `INSERT INTO employees (department_id, display_name, start_month, end_month, annual_leave_days, carryover_days)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, department_id, display_name, start_month, end_month, annual_leave_days, carryover_days, is_active`,
        [departmentId, displayName, startMonth, endMonth || null, annualLeaveDays, carryoverDays]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === '23505') return res.status(409).json({ error: 'Employee already exists' });
      return res.status(500).json({ error: 'Internal error' });
    }
  }
);

// GET /api/employees?departmentId=1
router.get('/employees', requireAuth, async (req, res) => {
  const { departmentId } = req.query || {};
  if (!departmentId) return res.status(400).json({ error: 'departmentId required' });
  if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
    return res.status(403).json({ error: 'Cross-department access denied' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, display_name, start_month, end_month, annual_leave_days, carryover_days, is_active
         FROM employees
        WHERE department_id = $1
        ORDER BY display_name ASC`,
      [departmentId]
    );
    return res.json({ employees: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;