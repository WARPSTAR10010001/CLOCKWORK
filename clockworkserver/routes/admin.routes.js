const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const MANAGER_ROLE = 'AREA_MANAGER';

function slugify(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function nextFreeUsername(client, base) {
  let candidate = base;
  let i = 1;
  while (true) {
    const q = await client.query('SELECT 1 FROM system_users WHERE username = $1', [candidate]);
    if (q.rowCount === 0) return candidate;
    i++;
    candidate = `${base}-${i}`;
  }
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listManagerAssignments(client, userId) {
  const { rows } = await client.query(
    `SELECT d.id, d.name
       FROM user_department_access uda
       JOIN departments d ON d.id = uda.department_id
      WHERE uda.user_id = $1
      ORDER BY d.name ASC`,
    [userId]
  );
  return rows;
}

router.post(
  '/admin/departments',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const { name, usernames } = req.body || {};
    const trimmed = (name || '').trim();

    if (!trimmed) {
      return res.status(400).json({ error: 'Fachbereichsname erforderlich' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const depIns = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [trimmed]
      );
      if (depIns.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Fachbereichsname existiert bereits' });
      }
      const department = depIns.rows[0];

      const base = slugify(trimmed);
      const desiredUser = usernames?.user?.trim() || `user-${base}`;
      const desiredMod = usernames?.mod?.trim() || `mod-${base}`;

      const userUsername = await nextFreeUsername(client, desiredUser);
      const modUsername = await nextFreeUsername(client, desiredMod);

      const hash = await bcrypt.hash('init', SALT_ROUNDS);

      const userIns = await client.query(
        `INSERT INTO system_users (username, password_hash, role, department_id, is_active)
         VALUES ($1, $2, 'USER', $3, true)
         RETURNING id, username, role, department_id, last_login_at`,
        [userUsername, hash, department.id]
      );

      const modIns = await client.query(
        `INSERT INTO system_users (username, password_hash, role, department_id, is_active)
         VALUES ($1, $2, 'MOD', $3, true)
         RETURNING id, username, role, department_id, last_login_at`,
        [modUsername, hash, department.id]
      );

      await client.query('COMMIT');
      return res.status(201).json({
        department,
        users: [userIns.rows[0], modIns.rows[0]],
        initialPassword: 'init'
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
  '/admin/departments',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res) => {
    const client = await pool.connect();
    try {
      const deps = await client.query(
        `SELECT d.id, d.name
           FROM departments d
           ORDER BY d.name ASC`
      );

      const users = await client.query(
        `SELECT id, username, role, department_id, last_login_at
           FROM system_users
           WHERE role IN ('USER','MOD')`
      );

      const byDep = new Map();
      for (const d of deps.rows) {
        byDep.set(d.id, { ...d, users: [] });
      }
      for (const u of users.rows) {
        const bucket = byDep.get(u.department_id);
        if (bucket) bucket.users.push(u);
      }

      return res.json(Array.from(byDep.values()));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.get(
  '/admin/area-managers',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res) => {
    const client = await pool.connect();
    try {
      const managers = await client.query(
        `SELECT id, username, role, department_id, last_login_at
           FROM system_users
          WHERE role = $1 AND is_active = TRUE
          ORDER BY LOWER(username) ASC`,
        [MANAGER_ROLE]
      );

      const result = [];
      for (const manager of managers.rows) {
        const departments = await listManagerAssignments(client, manager.id);
        result.push({
          ...manager,
          departments,
          departmentIds: departments.map((department) => department.id)
        });
      }

      return res.json({ managers: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/admin/area-managers',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const { username, departmentIds } = req.body || {};
    const cleanUsername = normalizeUsername(username);
    const cleanDepartmentIds = Array.isArray(departmentIds)
      ? Array.from(
        new Set(
          departmentIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        )
      )
      : [];

    if (!cleanUsername) {
      return res.status(400).json({ error: 'Benutzername erforderlich' });
    }
    if (cleanDepartmentIds.length === 0) {
      return res.status(400).json({ error: 'Mindestens ein Fachbereich muss zugewiesen werden' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const depCheck = await client.query(
        'SELECT id FROM departments WHERE id = ANY($1::int[])',
        [cleanDepartmentIds]
      );
      if (depCheck.rowCount !== cleanDepartmentIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mindestens ein ausgewählter Fachbereich existiert nicht' });
      }

      const hash = await bcrypt.hash('init', SALT_ROUNDS);
      const created = await client.query(
        `INSERT INTO system_users (username, password_hash, role, department_id, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, username, role, department_id, last_login_at`,
        [cleanUsername, hash, MANAGER_ROLE, cleanDepartmentIds[0]]
      );

      const manager = created.rows[0];

      for (const depId of cleanDepartmentIds) {
        await client.query(
          `INSERT INTO user_department_access (user_id, department_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, department_id) DO NOTHING`,
          [manager.id, depId]
        );
      }

      await client.query('COMMIT');

      const departments = await listManagerAssignments(client, manager.id);
      return res.status(201).json({
        manager: {
          ...manager,
          departments,
          departmentIds: departments.map((department) => department.id)
        },
        initialPassword: 'init'
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      console.error(err);
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Benutzername existiert bereits' });
      }
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.patch(
  '/admin/area-managers/:id/departments',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const managerId = Number(req.params.id);
    const cleanDepartmentIds = Array.isArray(req.body?.departmentIds)
      ? Array.from(
        new Set(
          req.body.departmentIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        )
      )
      : [];

    if (!Number.isInteger(managerId) || managerId <= 0) {
      return res.status(400).json({ error: 'Ungültige Nutzer-ID' });
    }
    if (cleanDepartmentIds.length === 0) {
      return res.status(400).json({ error: 'Mindestens ein Fachbereich muss zugewiesen werden' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const managerRes = await client.query(
        `SELECT id, username, role, department_id, last_login_at
           FROM system_users
          WHERE id = $1 AND role = $2 AND is_active = TRUE`,
        [managerId, MANAGER_ROLE]
      );
      if (managerRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Fachbereichsleiter nicht gefunden' });
      }

      const depCheck = await client.query(
        'SELECT id FROM departments WHERE id = ANY($1::int[])',
        [cleanDepartmentIds]
      );
      if (depCheck.rowCount !== cleanDepartmentIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mindestens ein ausgewählter Fachbereich existiert nicht' });
      }

      await client.query('DELETE FROM user_department_access WHERE user_id = $1', [managerId]);
      for (const depId of cleanDepartmentIds) {
        await client.query(
          `INSERT INTO user_department_access (user_id, department_id)
           VALUES ($1, $2)`,
          [managerId, depId]
        );
      }

      await client.query(
        `UPDATE system_users
            SET department_id = $1
          WHERE id = $2`,
        [cleanDepartmentIds[0], managerId]
      );

      await client.query('COMMIT');

      const refreshedManager = managerRes.rows[0];
      const departments = await listManagerAssignments(client, managerId);
      return res.json({
        manager: {
          ...refreshedManager,
          department_id: cleanDepartmentIds[0],
          departments,
          departmentIds: departments.map((department) => department.id)
        }
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

router.delete(
  '/admin/departments/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const depId = Number(req.params.id);
    if (!Number.isInteger(depId) || depId <= 0) {
      return res.status(400).json({ error: 'Ungültige Fachbereichs-ID' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dep = await client.query(
        'SELECT id, name FROM departments WHERE id = $1',
        [depId]
      );
      if (dep.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Fachbereich nicht gefunden' });
      }

      const empCheck = await client.query(
        'SELECT 1 FROM employees WHERE department_id = $1 LIMIT 1',
        [depId]
      );
      if (empCheck.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Der Fachbereich kann nicht gelöscht werden, da noch Mitarbeitende vorhanden sind.'
        });
      }

      const planCheck = await client.query(
        'SELECT 1 FROM plans WHERE department_id = $1 LIMIT 1',
        [depId]
      );
      if (planCheck.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Der Fachbereich kann nicht gelöscht werden, da noch Dienstpläne vorhanden sind.'
        });
      }

      await client.query('DELETE FROM user_department_access WHERE department_id = $1', [depId]);
      await client.query(
        `DELETE FROM system_users
          WHERE department_id = $1`,
        [depId]
      );

      const delDep = await client.query(
        'DELETE FROM departments WHERE id = $1 RETURNING id, name',
        [depId]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        department: delDep.rows[0]
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      console.error(err);
      return res.status(500).json({ error: 'Interner Serverfehler' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
