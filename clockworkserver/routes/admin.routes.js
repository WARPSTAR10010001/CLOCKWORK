const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

/** Hilfsfunktionen */
function slugify(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function nextFreeUsername(client, base) {
  // versuche base, base-1, base-2, ...
  let candidate = base;
  let i = 1;
  while (true) {
    const q = await client.query('SELECT 1 FROM system_users WHERE username = $1', [candidate]);
    if (q.rowCount === 0) return candidate;
    i++;
    candidate = `${base}-${i}`;
  }
}

/**
 * POST /api/admin/departments
 * body: { name: string, usernames?: { user?: string, mod?: string } }
 * erstellt:
 *   - department
 *   - system_users: USER-{slug}, MOD-{slug} (oder custom), PW = bcrypt("init")
 * returns: { department: {id,name}, users: [{id,username,role}] }
 */
router.post(
  '/admin/departments',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const { name, usernames } = req.body || {};
    const trimmed = (name || '').trim();

    if (!trimmed) {
      return res.status(400).json({ error: 'Department name required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Department anlegen
      const depIns = await client.query(
        `INSERT INTO departments (name) VALUES ($1)
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [trimmed]
      );
      if (depIns.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Department name already exists' });
      }
      const department = depIns.rows[0];

      // Usernames vorbereiten
      const base = slugify(trimmed);
      const desiredUser = usernames?.user?.trim() || `user-${base}`;
      const desiredMod  = usernames?.mod?.trim()  || `mod-${base}`;

      const userUsername = await nextFreeUsername(client, desiredUser);
      const modUsername  = await nextFreeUsername(client, desiredMod);

      // Passwort-Hash ("init")
      const hash = await bcrypt.hash('init', SALT_ROUNDS);

      // USER anlegen
      const userIns = await client.query(
        `INSERT INTO system_users (username, password_hash, role, department_id, is_active)
         VALUES ($1, $2, 'USER', $3, true)
         RETURNING id, username, role, department_id`,
        [userUsername, hash, department.id]
      );

      // MOD anlegen
      const modIns = await client.query(
        `INSERT INTO system_users (username, password_hash, role, department_id, is_active)
         VALUES ($1, $2, 'MOD', $3, true)
         RETURNING id, username, role, department_id`,
        [modUsername, hash, department.id]
      );

      await client.query('COMMIT');
      return res.status(201).json({
        department,
        users: [userIns.rows[0], modIns.rows[0]],
        initialPassword: 'init' // reine Info; Passwort wird gehasht gespeichert
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/admin/departments
 * Admin: Liste aller Departments inkl. Rollen-Usernames (kurzer Überblick)
 */
router.get(
  '/admin/departments',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const deps = await client.query(
        `SELECT d.id, d.name
           FROM departments d
           ORDER BY d.name ASC`
      );

      // optional: die zugehörigen user zusammenfassen
      const users = await client.query(
        `SELECT id, username, role, department_id
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
      return res.status(500).json({ error: 'Internal error' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;