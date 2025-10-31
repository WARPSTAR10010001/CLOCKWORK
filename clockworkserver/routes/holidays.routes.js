// routes/holidays.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ---------- Date helpers (UTC) ---------- */
function easterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day)); // Ostersonntag
}
function addDaysUTC(date, days) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
function fmt(d) {
  const y = d.getUTCFullYear(), m = String(d.getUTCMonth()+1).padStart(2,'0'), day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

/* ---------- Auto-Seed NRW, bundesweit + NRW-spezifisch ---------- */
async function ensureYearSeededNW(clientOrPool, year) {
  const c = clientOrPool.connect ? await clientOrPool.connect() : clientOrPool;
  const release = clientOrPool.connect ? () => c.release() : () => {};
  try {
    const exists = await c.query(
      `SELECT 1 FROM holidays WHERE year=$1 AND state_code='NW' LIMIT 1`,
      [year]
    );
    if (exists.rowCount > 0) return false;

    const y = Number(year);
    const e  = easterDate(y);
    const kf = addDaysUTC(e, -2); // Karfreitag
    const om = addDaysUTC(e,  1); // Ostermontag
    const hm = addDaysUTC(e, 39); // Christi Himmelfahrt
    const pm = addDaysUTC(e, 50); // Pfingstmontag
    const fr = addDaysUTC(e, 60); // Fronleichnam (NRW)

    const fixed = [
      { date: `${y}-01-01`, name: 'Neujahr' },
      { date: `${y}-05-01`, name: 'Tag der Arbeit' },
      { date: `${y}-10-03`, name: 'Tag der Deutschen Einheit' },
      { date: `${y}-11-01`, name: 'Allerheiligen' },     // NRW-spezifisch
      { date: `${y}-12-25`, name: '1. Weihnachtstag' },
      { date: `${y}-12-26`, name: '2. Weihnachtstag' }
    ];
    const movable = [
      { date: fmt(kf), name: 'Karfreitag' },
      { date: fmt(om), name: 'Ostermontag' },
      { date: fmt(hm), name: 'Christi Himmelfahrt' },
      { date: fmt(pm), name: 'Pfingstmontag' },
      { date: fmt(fr), name: 'Fronleichnam' }            // NRW-spezifisch
    ];
    const all = [...fixed, ...movable];

    await c.query('BEGIN');
    const ins = `
      INSERT INTO holidays (state_code, date, name, year)
      VALUES ('NW', $1::date, $2, $3)
      ON CONFLICT (state_code, date) DO NOTHING
    `;
    for (const h of all) await c.query(ins, [h.date, h.name, y]);
    await c.query('COMMIT');
    return true;
  } catch (err) {
    try { await c.query('ROLLBACK'); } catch {}
    console.error('ensureYearSeededNW:', err);
    throw err;
  } finally { release(); }
}

/* ---------- API ---------- */

/** GET /api/holidays?year=2026&stateCode=NW
 *  Auto-seeded falls Jahr noch fehlt.
 */
router.get('/holidays', requireAuth, async (req, res) => {
  const { year, stateCode } = req.query || {};
  const y = Number(year);
  if (!y || !Number.isInteger(y)) return res.status(400).json({ error: 'year (int) benötigt' });
  if (stateCode !== 'NW')        return res.status(400).json({ error: 'Nur stateCode=NW wird unterstützt' });

  try {
    await ensureYearSeededNW(pool, y);
    const { rows } = await pool.query(
      `SELECT id, state_code, date, name, year
         FROM holidays
        WHERE year=$1 AND state_code='NW'
        ORDER BY date ASC`,
      [y]
    );
    res.json({ holidays: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/** Optional: manuelles Seed (MOD/ADMIN) */
router.post('/holidays/seed', requireAuth, requireRole('MOD','ADMIN'), async (req, res) => {
  const { year, stateCode } = req.body || {};
  const y = Number(year);
  if (!y || !Number.isInteger(y)) return res.status(400).json({ error: 'year (int) benötigt' });
  if (stateCode !== 'NW')        return res.status(400).json({ error: 'Nur stateCode=NW wird unterstützt' });

  try {
    const seeded = await ensureYearSeededNW(pool, y);
    res.status(seeded ? 201 : 200).json({ ok: true, seeded, year: y, stateCode: 'NW' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;