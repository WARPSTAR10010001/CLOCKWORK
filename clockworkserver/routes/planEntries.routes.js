// src/routes/planEntries.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUS = new Set(['PRESENCE','HOME','MEETING','FLEXTIME','TRAINING','VACATION','SICK','OTHER']);

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isYearMonth(s) {
  return /^\d{4}-\d{2}$/.test(s);
}

router.post(
  '/plan-entries',
  requireAuth,
  requireRole('USER','MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { planId, departmentId, employeeId, date, status, description } = req.body || {};

    if (!planId || !departmentId || !employeeId || !date || !status) {
      return res.status(400).json({ error: 'planId, departmentId, employeeId, date, status required' });
    }
    if (!isIsoDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    if (!VALID_STATUS.has(status)) return res.status(400).json({ error: 'invalid status' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Plan & Jahr
      const planQ = await client.query(
        'SELECT id, department_id, year FROM plans WHERE id=$1 AND department_id=$2',
        [planId, departmentId]
      );
      if (planQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan not found in department' });
      }
      const plan = planQ.rows[0];
      if (parseInt(date.slice(0,4), 10) !== plan.year) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `date must be within plan year ${plan.year}` });
      }

      // Wochenende blockieren
      const dowQ = await client.query('SELECT EXTRACT(ISODOW FROM $1::date) AS dow', [date]);
      if (Number(dowQ.rows[0].dow) >= 6) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Weekend entries are not allowed' });
      }

      // Employee & Department
      const empQ = await client.query(
        'SELECT id FROM employees WHERE id=$1 AND department_id=$2',
        [employeeId, departmentId]
      );
      if (empQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Employee not in department' });
      }

      // plan_employees Fenster (Monat-basiert)
      const peQ = await client.query(
        `SELECT
           date_trunc('month', start_month)::date AS start_m,
           CASE WHEN end_month IS NULL THEN NULL
                ELSE date_trunc('month', end_month)::date
           END AS end_m
         FROM plan_employees
         WHERE plan_id=$1 AND employee_id=$2`,
        [planId, employeeId]
      );
      if (peQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Employee is not part of this plan' });
      }
      const { start_m, end_m } = peQ.rows[0];
      const entryMonthQ = await client.query(
        'SELECT date_trunc(\'month\', $1::date)::date AS entry_month', [date]
      );
      const entry_month = entryMonthQ.rows[0].entry_month;

      if (entry_month < start_m || (end_m && entry_month > end_m)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'date is outside employee active months for this plan' });
      }

      // UPSERT: existierenden Eintrag ersetzen statt 409
      const upsert = await client.query(
        `INSERT INTO plan_entries
           (plan_id, department_id, employee_id, entry_date, status, description, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (employee_id, entry_date)
         DO UPDATE SET
           plan_id      = EXCLUDED.plan_id,
           department_id= EXCLUDED.department_id,
           status       = EXCLUDED.status,
           description  = EXCLUDED.description,
           updated_at   = NOW()
         RETURNING id, plan_id, department_id, employee_id, entry_date, status, description, created_at, updated_at`,
        [planId, departmentId, employeeId, date, status, description || null, req.user.sub || null]
      );

      await client.query('COMMIT');
      // optional: 200 wenn updated, 201 wenn neu
      const updated = upsert.rows[0].updated_at !== null;
      return res.status(updated ? 200 : 201).json(upsert.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

// --- GET /api/plan-entries?planId=1&month=2025-10 --------------------------
router.get(
  '/plan-entries',
  requireAuth,
  async (req, res) => {
    const { planId, month } = req.query || {};
    if (!planId || !month) return res.status(400).json({ error: 'planId and month=YYYY-MM required' });
    if (!isYearMonth(month)) return res.status(400).json({ error: 'month must be YYYY-MM' });

    const client = await pool.connect();
    try {
      // Plan → Department ermitteln und Scope prüfen
      const plan = await client.query('SELECT id, department_id FROM plans WHERE id=$1', [planId]);
      if (plan.rowCount === 0) return res.status(404).json({ error: 'Plan not found' });

      const departmentId = plan.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Cross-department access denied' });
      }

      // Monatsrange [month-01, next-month)
      const start = `${month}-01`;
      const query = `
        SELECT pe.id, pe.employee_id, e.display_name, pe.entry_date, pe.status, pe.description, pe.created_at
        FROM plan_entries pe
        JOIN employees e ON e.id = pe.employee_id
        WHERE pe.plan_id = $1
          AND pe.entry_date >= $2::date
          AND pe.entry_date < (date_trunc('month', $2::date) + INTERVAL '1 month')
        ORDER BY pe.entry_date ASC, e.display_name ASC
      `;
      const { rows } = await client.query(query, [planId, start]);
      return res.json({ entries: rows, departmentId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

// --- PATCH /api/plan-entries/:id -------------------------------------------
router.patch(
  '/plan-entries/:id',
  requireAuth,
  requireRole('USER','MOD'),
  async (req, res) => {
    const { id } = req.params;
    const { status, description } = req.body || {};
    if (!status && typeof description === 'undefined') {
      return res.status(400).json({ error: 'status or description required' });
    }
    if (status && !VALID_STATUS.has(status)) return res.status(400).json({ error: 'invalid status' });

    const client = await pool.connect();
    try {
      // hole entry + department für Scope
      const q = await client.query(
        `SELECT pe.id, pe.department_id FROM plan_entries pe WHERE pe.id=$1`,
        [id]
      );
      if (q.rowCount === 0) return res.status(404).json({ error: 'Entry not found' });

      const departmentId = q.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Cross-department access denied' });
      }

      const fields = [];
      const vals = [];
      let idx = 1;

      if (status) { fields.push(`status = $${idx++}`); vals.push(status); }
      if (typeof description !== 'undefined') { fields.push(`description = $${idx++}`); vals.push(description); }

      vals.push(id);
      const sql = `UPDATE plan_entries SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, status, description`;
      const upd = await client.query(sql, vals);
      return res.json(upd.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

// --- DELETE /api/plan-entries/:id ------------------------------------------
router.delete(
  '/plan-entries/:id',
  requireAuth,
  requireRole('USER','MOD'),
  async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      // Scope check
      const q = await client.query('SELECT department_id FROM plan_entries WHERE id=$1', [id]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Entry not found' });
      const departmentId = q.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Cross-department access denied' });
      }

      await client.query('DELETE FROM plan_entries WHERE id=$1', [id]);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;