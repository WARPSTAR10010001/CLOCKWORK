// src/routes/plans.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

// simple validator helpers (kein zod nötig)
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

/**
 * POST /api/plans/:id/plan-employees
 * Body: { employeeId, startMonth, endMonth }
 * Fügt einen Mitarbeiter in den Jahresplan ein (no-op wenn schon drin).
 */
// routes/plans.routes.js (Ausschnitt)
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
      // Urlaubskonto / Übertrag aus employees ziehen
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

/**
 * POST /api/plans/:id/sync-employees
 * Fügt alle aktiven Dept-Mitarbeitenden, die noch nicht im Plan sind, hinzu.
 */
router.post(
  '/plans/:id/sync-employees',
  requireAuth,
  requireRole('MOD', 'ADMIN'),
  async (req, res) => {
    const planId = Number(req.params.id);
    if (!planId) return res.status(400).json({ error: 'planId fehlt' });

    const client = await pool.connect();
    try {
      // Plan → Department + Jahr ermitteln
      const p = await client.query(
        `SELECT id, department_id, year
           FROM plans
          WHERE id = $1`,
        [planId]
      );
      if (p.rowCount === 0) {
        return res.status(404).json({ error: 'Plan nicht gefunden' });
      }
      const { department_id, year } = p.rows[0];

      // alle aktiven Mitarbeitenden, die noch NICHT im Plan sind
      const q = await client.query(
        `SELECT e.id, COALESCE(e.carryover_days, 0) AS carryover
           FROM employees e
          WHERE e.department_id = $1
            AND COALESCE(e.is_active, true) = true
            AND NOT EXISTS (
                  SELECT 1
                    FROM plan_employees pe
                   WHERE pe.plan_id = $2
                     AND pe.employee_id = e.id
                )`,
        [department_id, planId]
      );

      if (q.rowCount === 0) {
        return res.json({ added: 0 });
      }

      const start = `${year}-01-01`;

      // parametrisierter Multi-Insert
      const values = [];
      const chunks = [];
      let idx = 1;

      for (const row of q.rows) {
        chunks.push(
          `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`
        );
        values.push(
          planId,
          row.id,
          start,
          null,
          row.carryover ?? 0
        );
      }

      const sql = `
        INSERT INTO plan_employees (plan_id, employee_id, start_month, end_month, initial_balance)
        VALUES ${chunks.join(', ')}
      `;

      const ins = await client.query(sql, values);
      return res.json({ added: ins.rowCount });
    } catch (e) {
      console.error(e);
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
      // Plan + Department prüfen
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
  requireRole('MOD'), // USER verboten, MOD ok, ADMIN ok (im middleware-code)
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { departmentId, year, employees } = req.body || {};

    // Basic Validation
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

      // Prüfe Department existiert
      const dep = await client.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
      if (dep.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Fachbereich wurde nicht gefunden' });
      }

      // Unique constraint (department_id, year) beachten: prüfen, ob es schon existiert
      const existing = await client.query(
        'SELECT id FROM plans WHERE department_id = $1 AND year = $2',
        [departmentId, year]
      );
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ein Plan existiert bereits für das ausgewählte Jahr' });
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
          return res.status(400).json({ error: `Mitarbeiter ${e.employeeId} gehört nicht zum Fachbereich ${departmentId}` });
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
        return res.status(409).json({ error: 'Duplikat erkannt' });
      }
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;