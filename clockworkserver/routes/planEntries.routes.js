const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, enforceDepartmentScope } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUS = new Set([
  'PRESENCE',
  'HOME',
  'VACATION',
  'SICK',
  'TRAINING',
  'FLEXTIME',
  'OTHER',
  'APPOINTMENT'
]);

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isYearMonth(s) {
  return /^\d{4}-\d{2}$/.test(s);
}

router.post(
  '/plan-entries',
  requireAuth,
  requireRole('USER', 'MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { planId, departmentId, employeeId, date, status, notes } = req.body || {};

    if (!planId || !departmentId || !employeeId || !date || !status) {
      return res.status(400).json({ error: 'planId, departmentId, employeeId, date, status benötigt' });
    }
    if (!isIsoDate(date)) return res.status(400).json({ error: 'Datum muss im Format YYYY-MM-DD sein' });
    if (!VALID_STATUS.has(status)) return res.status(400).json({ error: 'Ungültiger Status' });

    let cleanNotes = null;
    if (typeof notes === 'string') {
      const trimmed = notes.trim();
      cleanNotes = trimmed.length > 0 ? trimmed : null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planQ = await client.query(
        'SELECT id, department_id, year FROM plans WHERE id=$1 AND department_id=$2',
        [planId, departmentId]
      );
      if (planQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan wurde nicht im Fachbereich gefunden' });
      }
      const plan = planQ.rows[0];
      if (parseInt(date.slice(0, 4), 10) !== plan.year) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Datum muss im folgenden Jahr liegen: ${plan.year}` });
      }

      const dowQ = await client.query('SELECT EXTRACT(ISODOW FROM $1::date) AS dow', [date]);
      if (Number(dowQ.rows[0].dow) >= 6) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Einträge am Wochenende nicht zugelassen' });
      }

      const empQ = await client.query(
        'SELECT id FROM employees WHERE id=$1 AND department_id=$2',
        [employeeId, departmentId]
      );
      if (empQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mitarbeiter gehört nicht zum Fachbereich' });
      }

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
        return res.status(400).json({ error: 'Mitarbeiter gehört nicht zum Plan' });
      }
      const { start_m, end_m } = peQ.rows[0];

      const entryMonthQ = await client.query(
        'SELECT date_trunc(\'month\', $1::date)::date AS entry_month',
        [date]
      );
      const entry_month = entryMonthQ.rows[0].entry_month;

      if (entry_month < start_m || (end_m && entry_month > end_m)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Datum liegt außerhalb der aktiven Monate des Mitarbeiters' });
      }

      const upsert = await client.query(
        `INSERT INTO plan_entries
           (plan_id, department_id, employee_id, entry_date, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (employee_id, entry_date)
         DO UPDATE SET
           plan_id       = EXCLUDED.plan_id,
           department_id = EXCLUDED.department_id,
           status        = EXCLUDED.status,
           notes         = EXCLUDED.notes,
           updated_at    = NOW()
         RETURNING
           id, plan_id, department_id, employee_id,
           entry_date, status, notes, created_at, updated_at`,
        [planId, departmentId, employeeId, date, status, cleanNotes, req.user.sub || null]
      );

      await client.query('COMMIT');
      const updated =
        upsert.rows[0].updated_at !== null &&
        upsert.rows[0].updated_at !== upsert.rows[0].created_at;
      return res.status(updated ? 200 : 201).json(upsert.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/plan-entries/batch',
  requireAuth,
  requireRole('USER', 'MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { planId, departmentId, employeeId, status, dates, notes } = req.body || {};
    if (!planId || !departmentId || !employeeId || !status || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'planId, departmentId, employeeId, status und dates[] benötigt' });
    }
    if (!VALID_STATUS.has(status)) return res.status(400).json({ error: 'Ungültiger Status' });

    let cleanNotes = null;
    if (typeof notes === 'string') {
      const trimmed = notes.trim();
      cleanNotes = trimmed.length > 0 ? trimmed : null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planQ = await client.query(
        'SELECT id, department_id, year FROM plans WHERE id=$1 AND department_id=$2',
        [planId, departmentId]
      );
      if (planQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan konnte nicht im Fachbereich gefunden werden' });
      }
      const plan = planQ.rows[0];

      const empQ = await client.query(
        'SELECT id FROM employees WHERE id=$1 AND department_id=$2',
        [employeeId, departmentId]
      );
      if (empQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mitarbeiter nicht im Fachbereich' });
      }

      const peQ = await client.query(
        `SELECT
           date_trunc('month', start_month)::date AS start_m,
           CASE WHEN end_month IS NULL THEN NULL ELSE date_trunc('month', end_month)::date END AS end_m
         FROM plan_employees
         WHERE plan_id=$1 AND employee_id=$2`,
        [planId, employeeId]
      );
      if (peQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mitarbeiter ist nicht Teil dieses Plans' });
      }
      const { start_m, end_m } = peQ.rows[0];

      const skipped = { weekend: 0, outOfYear: 0, outOfWindow: 0, invalid: 0 };
      const eligible = [];

      for (const d of dates) {
        if (!isIsoDate(d)) { skipped.invalid++; continue; }

        if (parseInt(d.slice(0, 4), 10) !== plan.year) { skipped.outOfYear++; continue; }

        const { rows: [r] } = await client.query(
          `SELECT EXTRACT(ISODOW FROM $1::date) AS dow,
                  date_trunc('month', $1::date)::date AS entry_month`,
          [d]
        );
        if (Number(r.dow) >= 6) { skipped.weekend++; continue; }

        if (r.entry_month < start_m || (end_m && r.entry_month > end_m)) {
          skipped.outOfWindow++; continue;
        }

        eligible.push(d);
      }

      if (eligible.length === 0) {
        await client.query('ROLLBACK');
        return res.status(200).json({ updated: 0, skipped, entries: [] });
      }

      const n = eligible.length;
      const values = eligible.map((_, i) =>
        `($1,$2,$3,$${4 + i},$${4 + n},$${5 + n},$${6 + n})`
      ).join(', ');

      const params = [
        planId,
        departmentId,
        employeeId,
        ...eligible,
        status,
        cleanNotes,
        req.user.sub || null
      ];

      const upsertSql = `
        INSERT INTO plan_entries
          (plan_id, department_id, employee_id, entry_date, status, notes, created_by)
        VALUES ${values}
        ON CONFLICT (employee_id, entry_date)
        DO UPDATE SET
          plan_id       = EXCLUDED.plan_id,
          department_id = EXCLUDED.department_id,
          status        = EXCLUDED.status,
          notes         = EXCLUDED.notes,
          updated_at    = NOW()
        RETURNING
          id,
          employee_id,
          to_char(entry_date,'YYYY-MM-DD') AS entry_date,
          status,
          notes
      `;

      const up = await client.query(upsertSql, params);
      await client.query('COMMIT');

      return res.status(200).json({
        updated: up.rowCount,
        skipped,
        entries: up.rows
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.get(
  '/plan-entries',
  requireAuth,
  async (req, res) => {
    const { planId, month } = req.query || {};
    if (!planId || !month) return res.status(400).json({ error: 'planId und month=YYYY-MM benötigt' });
    if (!isYearMonth(month)) return res.status(400).json({ error: 'month muss im Format YYYY-MM sein' });

    const client = await pool.connect();
    try {
      const plan = await client.query('SELECT id, department_id FROM plans WHERE id=$1', [planId]);
      if (plan.rowCount === 0) return res.status(404).json({ error: 'Plan wurde nicht gefunden' });

      const departmentId = plan.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      const start = `${month}-01`;
      const query = `
  SELECT 
    pe.id,
    pe.employee_id,
    e.display_name,
    to_char(pe.entry_date, 'YYYY-MM-DD') AS entry_date,
    pe.status,
    pe.notes,
    pe.created_at
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
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.patch(
  '/plan-entries/:id',
  requireAuth,
  requireRole('USER', 'MOD'),
  async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    if (!status && typeof notes === 'undefined') {
      return res.status(400).json({ error: 'Status oder Notes benötigt' });
    }
    if (status && !VALID_STATUS.has(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }

    let cleanNotes;
    if (typeof notes !== 'undefined') {
      if (typeof notes === 'string') {
        const trimmed = notes.trim();
        cleanNotes = trimmed.length > 0 ? trimmed : null;
      } else if (notes === null) {
        cleanNotes = null;
      } else {
        return res.status(400).json({ error: 'notes muss String oder null sein' });
      }
    }

    const client = await pool.connect();
    try {
      const q = await client.query(
        `SELECT pe.id, pe.department_id FROM plan_entries pe WHERE pe.id=$1`,
        [id]
      );
      if (q.rowCount === 0) return res.status(404).json({ error: 'Eintrag wurde nicht gefunden' });

      const departmentId = q.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      const fields = [];
      const vals = [];
      let idx = 1;

      if (status) {
        fields.push(`status = $${idx++}`);
        vals.push(status);
      }
      if (typeof cleanNotes !== 'undefined') {
        fields.push(`notes = $${idx++}`);
        vals.push(cleanNotes);
      }

      vals.push(id);
      const sql = `
        UPDATE plan_entries
        SET ${fields.join(', ')},
            updated_at = NOW()
        WHERE id = $${idx}
        RETURNING id, status, notes
      `;
      const upd = await client.query(sql, vals);
      return res.json(upd.rows[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.delete(
  '/plan-entries/:id',
  requireAuth,
  requireRole('USER', 'MOD'),
  async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
      const q = await client.query('SELECT department_id FROM plan_entries WHERE id=$1', [id]);
      if (q.rowCount === 0) return res.status(404).json({ error: 'Entry wurde nicht gefunden' });
      const departmentId = q.rows[0].department_id;
      if (req.user.role !== 'ADMIN' && String(req.user.departmentId) !== String(departmentId)) {
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }

      await client.query('DELETE FROM plan_entries WHERE id=$1', [id]);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/plan-entries/delete-batch',
  requireAuth,
  requireRole('USER', 'MOD'),
  enforceDepartmentScope((req) => req.body?.departmentId),
  async (req, res) => {
    const { planId, departmentId, employeeId, dates } = req.body || {};
    if (!planId || !departmentId || !employeeId || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'planId, departmentId, employeeId und dates[] benötigt' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const planQ = await client.query(
        'SELECT id FROM plans WHERE id=$1 AND department_id=$2',
        [planId, departmentId]
      );
      if (planQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Plan wurde nicht im Fachbereich gefunden' });
      }

      const empQ = await client.query(
        'SELECT id FROM employees WHERE id=$1 AND department_id=$2',
        [employeeId, departmentId]
      );
      if (empQ.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mitarbeiter nicht im Fachbereich gefunden' });
      }

      const filtered = dates.filter(isIsoDate);
      if (filtered.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Keine gültigen Daten' });
      }

      const del = await client.query(
        `DELETE FROM plan_entries
         WHERE plan_id=$1 AND department_id=$2 AND employee_id=$3
           AND entry_date = ANY($4::date[])`,
        [planId, departmentId, employeeId, filtered]
      );

      await client.query('COMMIT');
      return res.status(200).json({ deleted: del.rowCount });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;