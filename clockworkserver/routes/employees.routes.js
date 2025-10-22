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

router.get('/employees', requireAuth, async (req, res) => {
  let { departmentId } = req.query || {};

  if (req.user.role !== 'ADMIN') {
    // erzwinge Scope
    departmentId = req.user.departmentId;
  }
  if (!departmentId) {
    return res.status(400).json({ error: 'departmentId required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, department_id, display_name, start_month, end_month, is_active
         FROM employees
        WHERE department_id = $1
        ORDER BY LOWER(display_name) ASC`,
      [departmentId]
    );

    // Client erwartet name statt display_name
    const mapped = rows.map(r => ({
      id: r.id,
      department_id: r.department_id,
      name: r.display_name,
      start_month: r.start_month ? r.start_month.toISOString().slice(0,10) : null,
      end_month: r.end_month ? r.end_month.toISOString().slice(0,10) : null,
      is_active: r.is_active,
    }));

    return res.json({ employees: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * PATCH /api/employees/:id
 * Body: { displayName?, startMonth? (YYYY-MM-01|null), endMonth? (YYYY-MM-01|null) }
 * - ADMIN: überall
 * - MOD/USER: nur im eigenen Department (USER brauchst du ggf. nicht; passe Rollen an)
 */
router.patch('/employees/:id', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const { id } = req.params;
  const { displayName, startMonth, endMonth } = req.body || {};

  const client = await pool.connect();
  try {
    // Scope prüfen
    const q = await client.query(
      `SELECT id, department_id FROM employees WHERE id = $1`,
      [id]
    );
    if (q.rowCount === 0) return res.status(404).json({ error: 'Employee not found' });
    const depId = q.rows[0].department_id;
    if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(depId)) {
      return res.status(403).json({ error: 'Cross-department access denied' });
    }

    // dynamisches Update
    const fields = [];
    const vals = [];
    let i = 1;

    if (typeof displayName === 'string') { fields.push(`display_name = $${i++}`); vals.push(displayName); }
    if (typeof startMonth !== 'undefined') { fields.push(`start_month = $${i++}`); vals.push(startMonth || null); }
    if (typeof endMonth !== 'undefined')   { fields.push(`end_month = $${i++}`);   vals.push(endMonth || null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    vals.push(id);
    const upd = await client.query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, department_id, display_name, start_month, end_month, is_active`,
      vals
    );

    const r = upd.rows[0];
    return res.json({
      id: r.id,
      department_id: r.department_id,
      name: r.display_name,
      start_month: r.start_month ? r.start_month.toISOString().slice(0,10) : null,
      end_month: r.end_month ? r.end_month.toISOString().slice(0,10) : null,
      is_active: r.is_active,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/employees/:id
 * - ADMIN: überall
 * - MOD  : nur eigenes Department
 * Hinweis: Falls FK-Verweise existieren, gibt PG 23503 → wir liefern 409.
 */
router.delete('/employees/:id', requireAuth, requireRole('ADMIN','MOD'), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    // Scope
    const q = await client.query(`SELECT department_id FROM employees WHERE id = $1`, [id]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'Employee not found' });
    const depId = q.rows[0].department_id;
    if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(depId)) {
      return res.status(403).json({ error: 'Cross-department access denied' });
    }

    try {
      await client.query(`DELETE FROM employees WHERE id = $1`, [id]);
    } catch (e) {
      if (e.code === '23503') {
        // FK-Verletzung: z. B. plan_employees oder plan_entries referenzieren noch
        return res.status(409).json({ error: 'Employee is referenced by other records and cannot be deleted.' });
      }
      throw e;
    }

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

module.exports = router;