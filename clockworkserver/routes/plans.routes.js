const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

router.get('/plans/:id/plan-employees', requireAuth, async (req, res) => {
  const planId = Number(req.params.id);
  if (!planId) return res.status(400).json({ error: 'planId fehlt' });

  try {
    const { rows } = await pool.query(
      `SELECT pe.employee_id, pe.start_month, pe.end_month
         FROM plan_employees pe
        WHERE pe.plan_id = $1
        ORDER BY pe.employee_id`,
      [planId]
    );
    return res.json({ items: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.post(
  '/plans/:id/plan-employees',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  async (req, res) => {
    const planId = Number(req.params.id);
    const { employeeId, startMonth, endMonth = null } = req.body || {};

    if (!planId || !employeeId || !startMonth) {
      return res.status(400).json({ error: 'planId, employeeId, startMonth erforderlich' });
    }

    const client = await pool.connect();
    try {
      const emp = await client.query(
        `SELECT carryover_days
           FROM employees
          WHERE id = $1`,
        [employeeId]
      );
      const initialBalance = emp.rows[0]?.carryover_days ?? 0;

      const ins = await client.query(
        `INSERT INTO plan_employees (plan_id, employee_id, start_month, end_month, initial_balance)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (plan_id, employee_id) DO NOTHING
         RETURNING plan_id, employee_id`,
        [planId, employeeId, startMonth, endMonth, initialBalance]
      );

      return res.status(201).json({ added: ins.rowCount > 0 });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/plans/:id/sync-employees',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  async (req, res) => {
    const planId = Number(req.params.id);
    if (!Number.isFinite(planId)) {
      return res.status(400).json({ error: 'Ungültige Plan-ID' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planRes = await client.query(
        'SELECT id, department_id, year FROM plans WHERE id = $1',
        [planId]
      );
      if (planRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan nicht gefunden' });
      }
      const plan = planRes.rows[0];

      if (
        req.user.role !== 'ADMIN' &&
        String(req.user.departmentId) !== String(plan.department_id)
      ) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      const year = plan.year;

      const { rows: toInsert } = await client.query(
        `
        WITH year_bounds AS (
          SELECT
            $1::int AS year,
            make_date($1::int, 1, 1) AS year_start,
            make_date($1::int, 12, 31) AS year_end
        )
        SELECT
          e.id AS employee_id,
          e.carryover_days,
          GREATEST(e.start_month, y.year_start) AS start_in_year,
          CASE
            WHEN e.end_month IS NULL OR e.end_month > y.year_end
              THEN NULL
            ELSE LEAST(e.end_month, y.year_end)
          END AS end_in_year
        FROM employees e
        CROSS JOIN year_bounds y
        WHERE
          e.department_id = $2
          AND e.is_active = TRUE
          AND e.start_month IS NOT NULL
          -- Overlap mit Planjahr
          AND e.start_month <= y.year_end
          AND (e.end_month IS NULL OR e.end_month >= y.year_start)
          -- noch kein Eintrag in plan_employees für diesen Plan
          AND NOT EXISTS (
            SELECT 1
            FROM plan_employees pe
            WHERE pe.plan_id = $3 AND pe.employee_id = e.id
          )
        `,
        [year, plan.department_id, planId]
      );

      let added = 0;
      for (const row of toInsert) {
        await client.query(
          `
          INSERT INTO plan_employees (plan_id, employee_id, start_month, end_month, initial_balance)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (plan_id, employee_id) DO NOTHING
          `,
          [
            planId,
            row.employee_id,
            row.start_in_year,
            row.end_in_year,
            row.carryover_days ?? 0
          ]
        );
        added++;
      }

      await client.query('COMMIT');
      return res.json({ added });
    } catch (err) {
      console.error(err);
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/plans/:id/sync-employee-dates',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  async (req, res) => {
    const planId = Number(req.params.id);
    if (!Number.isFinite(planId)) {
      return res.status(400).json({ error: 'Ungültige Plan-ID' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planRes = await client.query(
        'SELECT id, department_id, year FROM plans WHERE id = $1',
        [planId]
      );
      if (planRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan nicht gefunden' });
      }
      const plan = planRes.rows[0];

      if (
        req.user.role !== 'ADMIN' &&
        String(req.user.departmentId) !== String(plan.department_id)
      ) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      const year = plan.year;

      const updateRes = await client.query(
        `
        WITH year_bounds AS (
          SELECT
            $1::int AS year,
            make_date($1::int, 1, 1) AS year_start,
            make_date($1::int, 12, 31) AS year_end
        )
        UPDATE plan_employees pe
        SET
          start_month = GREATEST(e.start_month, y.year_start),
          end_month = CASE
            WHEN e.end_month IS NULL OR e.end_month > y.year_end
              THEN NULL
            ELSE LEAST(e.end_month, y.year_end)
          END
        FROM employees e
        CROSS JOIN year_bounds y
        WHERE
          pe.plan_id = $2
          AND e.id = pe.employee_id
          AND e.department_id = $3
          AND e.is_active = TRUE
          AND e.start_month IS NOT NULL
        `,
        [year, planId, plan.department_id]
      );

      await client.query('COMMIT');
      return res.json({ updated: updateRes.rowCount });
    } catch (err) {
      console.error(err);
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.get(
  '/plans/:id',
  requireAuth,
  async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      const planRes = await client.query(
        `SELECT p.id, p.department_id, p.year, p.created_at
         FROM plans p WHERE p.id = $1`,
        [id]
      );
      if (planRes.rowCount === 0) return res.status(404).json({ error: 'Plan wurde nicht gefunden' });

      const plan = planRes.rows[0];
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(plan.department_id)) {
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

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

      const vuRes = await client.query(
        `SELECT employee_id, used_days
           FROM v_vacation_usage
          WHERE plan_id = $1 AND year = $2`,
        [id, plan.year]
      );
      const usedByEmp = new Map(vuRes.rows.map(r => [String(r.employee_id), Number(r.used_days)]));

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
      return res.status(500).json({ error: 'Interner Serverfehler' });
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
    if (!departmentId) return res.status(400).json({ error: 'departmentId benötigt' });

    if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
      return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
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
      return res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
);

router.post(
  '/plans',
  requireAuth,
  requireRole('MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { departmentId, year, employees } = req.body || {};

    if (!departmentId || !year || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'departmentId, year und employees[] benötigt' });
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Ungültiges Jahr' });
    }
    for (const e of employees) {
      if (!e.employeeId || !e.startMonth || typeof e.initialBalance !== 'number') {
        return res.status(400).json({ error: 'employees[].employeeId, startMonth und initialBalance benötigt' });
      }
      if (!isIsoDate(e.startMonth)) {
        return res.status(400).json({ error: 'employees[].startMonth muss im Format YYYY-MM-DD sein' });
      }
      if (e.endMonth && !isIsoDate(e.endMonth)) {
        return res.status(400).json({ error: 'employees[].endMonth muss im Format YYYY-MM-DD sein oder null sein' });
      }
      if (e.initialBalance < 0) {
        return res.status(400).json({ error: 'employees[].initialBalance muss >= 0 sein' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dep = await client.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
      if (dep.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Fachbereich wurde nicht gefunden' });
      }

      const existing = await client.query(
        'SELECT id FROM plans WHERE department_id = $1 AND year = $2',
        [departmentId, year]
      );
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ein Plan existiert bereits für das ausgewählte Jahr' });
      }

      const planInsert = await client.query(
        `INSERT INTO plans (department_id, year, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, department_id, year, created_at`,
        [departmentId, year, req.user.sub || null]
      );
      const plan = planInsert.rows[0];

      const empIds = employees.map(e => e.employeeId);
      const empCheck = await client.query(
        `SELECT id FROM employees WHERE department_id = $1 AND id = ANY($2::int[])`,
        [departmentId, empIds]
      );
      const validIds = new Set(empCheck.rows.map(r => r.id));
      for (const e of employees) {
        if (!validIds.has(e.employeeId)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Mitarbeiter ${e.employeeId} gehört nicht zum Fachbereich ${departmentId}` });
        }
      }

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
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Duplikat erkannt' });
      }
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;