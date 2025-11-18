// routes/employees.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

// --- Helpers -------------------------------------------------------------

function isValidYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toYmdLocal(d) {
  if (!d) return null;
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// --- POST /api/employees -------------------------------------------------
// Body: { departmentId, displayName, startMonth (YYYY-MM-DD), endMonth?, annualLeaveDays?, carryoverDays? }
router.post(
  '/employees',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const {
      departmentId,
      displayName,
      startMonth,
      endMonth,
      annualLeaveDays = 30,
      carryoverDays = 0,
    } = req.body || {};

    if (!departmentId || !displayName || !startMonth) {
      return res
        .status(400)
        .json({ error: 'departmentId, displayName und startMonth benötigt' });
    }
    if (!isValidYmd(startMonth)) {
      return res
        .status(400)
        .json({ error: 'startMonth muss im Format YYYY-MM-DD sein' });
    }
    if (endMonth && !isValidYmd(endMonth)) {
      return res
        .status(400)
        .json({ error: 'endMonth muss im Format YYYY-MM-DD sein' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO employees (department_id, display_name, start_month, end_month, annual_leave_days, carryover_days)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, department_id, display_name, start_month, end_month, annual_leave_days, carryover_days, is_active`,
        [departmentId, displayName, startMonth, endMonth || null, annualLeaveDays, carryoverDays]
      );

      const r = rows[0];
      return res.status(201).json({
        id: r.id,
        department_id: r.department_id,
        display_name: r.display_name,
        start_month: toYmdLocal(r.start_month),
        end_month: toYmdLocal(r.end_month),
        annual_leave_days: r.annual_leave_days,
        carryover_days: r.carryover_days,
        is_active: r.is_active,
      });
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Mitarbeiter existiert bereits' });
      }
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

// --- GET /api/employees --------------------------------------------------
// ?departmentId=…  (Admin darf alle, MOD nur eigenen FB)
router.get('/employees', requireAuth, async (req, res) => {
  let { departmentId } = req.query || {};

  if (req.user.role !== 'ADMIN') {
    departmentId = req.user.departmentId;
  }
  if (!departmentId) {
    return res.status(400).json({ error: 'departmentId benötigt' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id,
              department_id,
              display_name,
              start_month,
              end_month,
              annual_leave_days,
              carryover_days,
              is_active
         FROM employees
        WHERE department_id = $1
        ORDER BY LOWER(display_name) ASC`,
      [departmentId]
    );

    const mapped = rows.map((r) => ({
      id: r.id,
      department_id: r.department_id,
      name: r.display_name,
      start_month: toYmdLocal(r.start_month), // 👈 exakte YMD-Strings
      end_month: toYmdLocal(r.end_month),
      annual_leave_days: r.annual_leave_days,
      carryover_days: r.carryover_days,
      is_active: r.is_active,
    }));

    return res.json({ employees: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// --- PATCH /api/employees/:id -------------------------------------------
// Body: { displayName?, startMonth?, endMonth?, annualLeaveDays?, carryoverDays? }
router.patch(
  '/employees/:id',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  async (req, res) => {
    const id = Number(req.params.id);
    const {
      displayName,
      startMonth,
      endMonth,
      annualLeaveDays,
      carryoverDays,
    } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;

    if (displayName != null) {
      fields.push(`display_name = $${i++}`);
      values.push(displayName);
    }

    if (startMonth !== undefined) {
      if (startMonth !== null && !isValidYmd(startMonth)) {
        return res
          .status(400)
          .json({ error: 'startMonth muss im Format YYYY-MM-DD sein' });
      }
      fields.push(`start_month = $${i++}`);
      values.push(startMonth);
    }

    if (endMonth !== undefined) {
      if (endMonth !== null && !isValidYmd(endMonth)) {
        return res
          .status(400)
          .json({ error: 'endMonth muss im Format YYYY-MM-DD sein' });
      }
      fields.push(`end_month = $${i++}`);
      values.push(endMonth);
    }

    if (annualLeaveDays != null) {
      fields.push(`annual_leave_days = $${i++}`);
      values.push(annualLeaveDays);
    }

    if (carryoverDays != null) {
      fields.push(`carryover_days = $${i++}`);
      values.push(carryoverDays);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Keine Änderungen' });
    }

    values.push(id);
    const sql = `UPDATE employees
                    SET ${fields.join(', ')}
                  WHERE id = $${i}
              RETURNING id, department_id, display_name, start_month, end_month, annual_leave_days, carryover_days, is_active`;

    try {
      const up = await pool.query(sql, values);
      if (up.rowCount === 0) {
        return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
      }
      const r = up.rows[0];
      return res.json({
        id: r.id,
        department_id: r.department_id,
        name: r.display_name,
        start_month: toYmdLocal(r.start_month),
        end_month: toYmdLocal(r.end_month),
        annual_leave_days: r.annual_leave_days,
        carryover_days: r.carryover_days,
        is_active: r.is_active,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

// --- DELETE /api/employees/:id ------------------------------------------
router.delete(
  '/employees/:id',
  requireAuth,
  requireRole('ADMIN', 'MOD'),
  async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      const q = await client.query(
        `SELECT department_id FROM employees WHERE id = $1`,
        [id]
      );
      if (q.rowCount === 0) {
        return res.status(404).json({ error: 'Mitarbeiter wurde nicht gefunden' });
      }
      const depId = q.rows[0].department_id;

      if (
        req.user.role !== 'ADMIN' &&
        String(req.user.departmentId) !== String(depId)
      ) {
        return res
          .status(403)
          .json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      try {
        await client.query(`DELETE FROM employees WHERE id = $1`, [id]);
      } catch (e) {
        if (e.code === '23503') {
          return res
            .status(409)
            .json({ error: 'Mitarbeiter kann nicht gelöscht werden' });
        }
        throw e;
      }

      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;