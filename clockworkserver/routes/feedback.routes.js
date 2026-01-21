const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_CATEGORIES = new Set([
  'Verbesserungsvorschlag',
  'Featureanfrage',
  'Visuelle- und/oder Logikfehler',
  'Lob',
  'Anderes'
]);
const ALLOWED_STATUS = new Set(['neu', 'gelesen', 'bearbeitet']);

router.post('/feedback', requireAuth, async (req, res) => {
  const { category, content, appVersion } = req.body || {};
  if (!category || !content) {
    return res.status(400).json({ error: 'category and content required' });
  }
  if (!ALLOWED_CATEGORIES.has(String(category))) {
    return res.status(400).json({ error: 'invalid category' });
  }

  try {
    const userId = req.user?.sub ?? null;

    let authorUsername = '';
    if (userId !== null) {
      try {
        const uRes = await pool.query(
          'SELECT username FROM system_users WHERE id = $1',
          [userId]
        );
        authorUsername = uRes.rows[0]?.username || '';
      } catch (e) {
        console.error('Konnte author_username nicht auslesen:', e);
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO feedback (author_id, author_username, category, content, app_version, status)
       VALUES ($1, $2, $3, $4, $5, 'neu')
       RETURNING id, status, created_at`,
      [userId, authorUsername, category, content, appVersion || null]
    );

    return res.status(201).json({
      id: rows[0].id,
      status: rows[0].status,
      createdAt: rows[0].created_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

router.get('/feedback', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.query || {};
  let where = '';
  const params = [];
  if (status) {
    if (!ALLOWED_STATUS.has(String(status))) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    where = 'WHERE status = $1';
    params.push(status);
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, author_id, author_username, category, content, app_version, status, created_at
         FROM feedback
         ${where}
         ORDER BY created_at DESC`,
      params
    );
    return res.json({ feedback: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/feedback/:id/status', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.body || {};
  const id = Number(req.params.id);
  if (!ALLOWED_STATUS.has(String(status))) return res.status(400).json({ error: 'invalid status' });
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const { rowCount, rows } = await pool.query(
      `UPDATE feedback SET status=$1 WHERE id=$2
       RETURNING id, status`,
      [status, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ id: rows[0].id, status: rows[0].status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/feedback/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  try {
    const { rowCount } = await pool.query('DELETE FROM feedback WHERE id=$1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;