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
router.get('/holidays', requireAuth, async (req, res) => {
  const { year, stateCode } = req.query || {};
  if (!year || !stateCode) return res.status(400).json({ error: 'year and stateCode required' });
  const y = Number(year);
  if (!Number.isInteger(y)) return res.status(400).json({ error: 'invalid year' });

  try {
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
    return res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/holidays/seed  Body: { "year": 2025, "stateCode": "NW" }
router.post('/holidays/seed', requireAuth, requireRole('MOD'), async (req, res) => {
  const { year, stateCode } = req.body || {};
  const y = Number(year);
  if (!year || !stateCode || !Number.isInteger(y)) {
    return res.status(400).json({ error: 'year (int) and stateCode required' });
  }
  if (stateCode !== 'NW') {
    // du kannst hier später mehrere Bundesländer ergänzen
    return res.status(400).json({ error: 'Only NW supported in this seed' });
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
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

module.exports = router;