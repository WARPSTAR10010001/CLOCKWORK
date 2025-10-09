// src/routes/plans.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

// simple validator helpers (kein zod nötig)
function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

router.get(
  '/plans/:id',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      // Plan + Department prüfen
      const planRes = await client.query(
        `SELECT p.id, p.department_id, p.year, p.created_at
         FROM plans p WHERE p.id = $1`,
        [id]
      );
      if (planRes.rowCount === 0) return res.status(404).json({ error: 'Plan not found' });

      const plan = planRes.rows[0];
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(plan.department_id)) {
        return res.status(403).json({ error: 'Cross-department access denied' });
      }

      // Plan-Employees + Stammdaten
      const peRes = await client.query(
        `SELECT pe.id AS plan_employee_id,
                e.id AS employee_id,
                e.display_name,
                e.annual_leave_days,
                e.carryover_days,
                pe.start_month,
                pe.end_month,
                pe.initial_balance
         FROM plan_employees pe
         JOIN employees e ON e.id = pe.employee_id
         WHERE pe.plan_id = $1
         ORDER BY e.display_name ASC`,
        [id]
      );

      // Urlaubstage-Verbrauch (View)
      const vuRes = await client.query(
        `SELECT employee_id, used_days
           FROM v_vacation_usage
          WHERE plan_id = $1 AND year = $2`,
        [id, plan.year]
      );
      const usedByEmp = new Map(vuRes.rows.map(r => [String(r.employee_id), Number(r.used_days)]));

      // Aufbereiten
      const employees = peRes.rows.map(r => {
        const used = usedByEmp.get(String(r.employee_id)) || 0;
        const available = (r.initial_balance ?? 0) + (r.carryover_days ?? 0) + (r.annual_leave_days ?? 0);
        const remaining = available - used;
        return {
          planEmployeeId: r.plan_employee_id,
          employeeId: r.employee_id,
          displayName: r.display_name,
          startMonth: r.start_month,
          endMonth: r.end_month,
          annualLeaveDays: r.annual_leave_days,
          carryoverDays: r.carryover_days,
          initialBalance: r.initial_balance,
          usedVacationDays: used,
          availableVacationDays: available,
          remainingVacationDays: remaining
        };
      });

      return res.json({
        id: plan.id,
        departmentId: plan.department_id,
        year: plan.year,
        createdAt: plan.created_at,
        employees
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

router.get(
  '/plans',
  requireAuth,
  async (req, res) => {
    const { departmentId } = req.query || {};
    if (!departmentId) return res.status(400).json({ error: 'departmentId required' });

    if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
      return res.status(403).json({ error: 'Cross-department access denied' });
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, department_id, year, created_at
           FROM plans
          WHERE department_id = $1
          ORDER BY year DESC`,
        [departmentId]
      );
      return res.json({ plans: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }
);

router.post(
  '/plans',
  requireAuth,
  requireRole('MOD'), // USER verboten, MOD ok, ADMIN ok (im middleware-code)
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { departmentId, year, employees } = req.body || {};

    // Basic Validation
    if (!departmentId || !year || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'departmentId, year, employees[] required' });
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    for (const e of employees) {
      if (!e.employeeId || !e.startMonth || typeof e.initialBalance !== 'number') {
        return res.status(400).json({ error: 'employees[].employeeId, startMonth, initialBalance required' });
      }
      if (!isIsoDate(e.startMonth)) {
        return res.status(400).json({ error: 'employees[].startMonth must be YYYY-MM-DD' });
      }
      if (e.endMonth && !isIsoDate(e.endMonth)) {
        return res.status(400).json({ error: 'employees[].endMonth must be YYYY-MM-DD or null' });
      }
      if (e.initialBalance < 0) {
        return res.status(400).json({ error: 'employees[].initialBalance must be >= 0' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Prüfe Department existiert
      const dep = await client.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
      if (dep.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Department not found' });
      }

      // Unique constraint (department_id, year) beachten: prüfen, ob es schon existiert
      const existing = await client.query(
        'SELECT id FROM plans WHERE department_id = $1 AND year = $2',
        [departmentId, year]
      );
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Plan for this department and year already exists' });
      }

      // Plan anlegen
      const planInsert = await client.query(
        `INSERT INTO plans (department_id, year, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, department_id, year, created_at`,
        [departmentId, year, req.user.sub || null]
      );
      const plan = planInsert.rows[0];

      // employees prüfen: gehören alle zum Department?
      const empIds = employees.map(e => e.employeeId);
      const empCheck = await client.query(
        `SELECT id FROM employees WHERE department_id = $1 AND id = ANY($2::int[])`,
        [departmentId, empIds]
      );
      const validIds = new Set(empCheck.rows.map(r => r.id));
      for (const e of employees) {
        if (!validIds.has(e.employeeId)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Employee ${e.employeeId} does not belong to department ${departmentId}` });
        }
      }

      // plan_employees anlegen
      const insertPEText = `
        INSERT INTO plan_employees (plan_id, employee_id, start_month, end_month, initial_balance)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      for (const e of employees) {
        await client.query(insertPEText, [
          plan.id,
          e.employeeId,
          e.startMonth,
          e.endMonth || null,
          e.initialBalance
        ]);
      }

      await client.query('COMMIT');
      return res.status(201).json({
        id: plan.id,
        departmentId: plan.department_id,
        year: plan.year,
        createdAt: plan.created_at
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      // Unique-Constraint usw. nett abfangen
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Duplicate detected' });
      }
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;