const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Hilfsfunktionen: Osterdatum (Anonymer Gregorianischer Algorithmus)
function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);     // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}
function addDaysUTC(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function fmt(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// GET /api/holidays?year=2025&stateCode=NW
// GET /api/holidays?year=2025&stateCode=NW
router.get('/holidays', requireAuth, async (req, res) => {
  const { year, stateCode } = req.query || {};
  if (!year || !stateCode) return res.status(400).json({ error: 'year und stateCode benötigt' });
  const y = Number(year);
  if (!Number.isInteger(y)) return res.status(400).json({ error: 'Ungültiges Jahr' });
  if (stateCode !== 'NW') return res.status(400).json({ error: 'Nur NW wird akzeptiert' });

  try {
    // Auto-seed, falls noch nichts für NW/y existiert
    await ensureYearSeededNW(pool, y);

    const { rows } = await pool.query(
      `SELECT id, state_code, date, name, year
         FROM holidays
        WHERE year = $1 AND state_code = $2
        ORDER BY date ASC`,
      [y, stateCode]
    );
    return res.json({ holidays: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// POST /api/holidays/seed  Body: { "year": 2025, "stateCode": "NW" }
router.post('/holidays/seed', requireAuth, requireRole('MOD'), async (req, res) => {
  const { year, stateCode } = req.body || {};
  const y = Number(year);
  if (!year || !stateCode || !Number.isInteger(y)) {
    return res.status(400).json({ error: 'year (int) und stateCode benötigt' });
  }
  if (stateCode !== 'NW') {
    // du kannst hier später mehrere Bundesländer ergänzen
    return res.status(400).json({ error: 'Nur NW wird akzeptiert' });
  }

  const e = easterDate(y); // Ostersonntag
  const kf = addDaysUTC(e, -2);  // Karfreitag
  const om = addDaysUTC(e, 1);   // Ostermontag
  const hm = addDaysUTC(e, 39);  // Himmelfahrt (Ostersonntag +39)
  const pm = addDaysUTC(e, 50);  // Pfingstmontag (Ostersonntag +50)
  const fr = addDaysUTC(e, 60);  // Fronleichnam (Ostersonntag +60)

  // Feste Feiertage (UTC, keine Zeitzonenprobleme)
  const fixed = [
    { date: `${y}-01-01`, name: 'Neujahr' },
    { date: `${y}-05-01`, name: 'Tag der Arbeit' },
    { date: `${y}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${y}-11-01`, name: 'Allerheiligen' },
    { date: `${y}-12-25`, name: '1. Weihnachtstag' },
    { date: `${y}-12-26`, name: '2. Weihnachtstag' }
  ];
  const movable = [
    { date: fmt(kf), name: 'Karfreitag' },
    { date: fmt(om), name: 'Ostermontag' },
    { date: fmt(hm), name: 'Christi Himmelfahrt' },
    { date: fmt(pm), name: 'Pfingstmontag' },
    { date: fmt(fr), name: 'Fronleichnam' }
  ];

  const all = [...fixed, ...movable];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertText = `
      INSERT INTO holidays (state_code, date, name, year)
      VALUES ($1, $2::date, $3, $4)
      ON CONFLICT (state_code, date) DO NOTHING
    `;
    for (const h of all) {
      await client.query(insertText, [stateCode, h.date, h.name, y]);
    }
    await client.query('COMMIT');
    return res.status(201).json({ seeded: all.length, stateCode, year: y });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
});

async function ensureYearSeededNW(clientOrPool, year) {
  // prüft, ob für NW bereits Einträge existieren – wenn nein, seedet es (identisch zu /holidays/seed)
  const c = clientOrPool.connect ? await clientOrPool.connect() : clientOrPool;
  const release = clientOrPool.connect ? () => c.release() : () => {};
  try {
    const chk = await c.query(
      `SELECT 1 FROM holidays WHERE year=$1 AND state_code='NW' LIMIT 1`,
      [year]
    );
    if (chk.rowCount > 0) return false; // schon vorhanden → nichts tun

    // === exakt deine Berechnung aus /holidays/seed ===
    const y = Number(year);
    const e  = easterDate(y);
    const kf = addDaysUTC(e, -2);
    const om = addDaysUTC(e,  1);
    const hm = addDaysUTC(e, 39);
    const pm = addDaysUTC(e, 50);
    const fr = addDaysUTC(e, 60);

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
    const insertText = `
      INSERT INTO holidays (state_code, date, name, year)
      VALUES ('NW', $1::date, $2, $3)
      ON CONFLICT (state_code, date) DO NOTHING
    `;
    for (const h of all) {
      await c.query(insertText, [h.date, h.name, y]);
    }
    await c.query('COMMIT');
    return true;
  } catch (err) {
    try { await c.query('ROLLBACK'); } catch {}
    console.error('ensureYearSeededNW failed:', err);
    throw err;
  } finally {
    release();
  }
}

module.exports = router;