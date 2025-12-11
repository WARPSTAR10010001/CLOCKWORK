const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
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

function buildHolidaysForYear(year) {
  const y = Number(year);
  const easter = easterDate(y);
  const rm = addDaysUTC(easter, -48);
  const kf = addDaysUTC(easter, -2);
  const om = addDaysUTC(easter, 1);
  const hm = addDaysUTC(easter, 39);
  const pm = addDaysUTC(easter, 50);
  const fr = addDaysUTC(easter, 60);

  const fixed = [
    { date: `${y}-01-01`, name: 'Neujahr' },
    { date: `${y}-05-01`, name: 'Tag der Arbeit' },
    { date: `${y}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${y}-11-01`, name: 'Allerheiligen' },
    { date: `${y}-12-24`, name: 'Heiligabend' },
    { date: `${y}-12-25`, name: '1. Weihnachtstag' },
    { date: `${y}-12-26`, name: '2. Weihnachtstag' },
    { date: `${y}-12-31`, name: 'Silvester' }
  ];

  const movable = [
    { date: fmt(rm), name: 'Rosenmontag' },
    { date: fmt(kf), name: 'Karfreitag' },
    { date: fmt(om), name: 'Ostermontag' },
    { date: fmt(hm), name: 'Christi Himmelfahrt' },
    { date: fmt(pm), name: 'Pfingstmontag' },
    { date: fmt(fr), name: 'Fronleichnam' }
  ];

  return [...fixed, ...movable].map(h => ({ ...h, year: y }));
}

async function ensureHolidaysSeeded(year) {
  const y = Number(year);
  const client = await pool.connect();

  try {
    const holidays = buildHolidaysForYear(y);

    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO holidays (date, name, year)
      VALUES ($1::date, $2, $3)
      ON CONFLICT (date) DO NOTHING
    `;

    for (const h of holidays) {
      await client.query(insertSql, [h.date, h.name, h.year]);
    }

    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('ensureHolidaysSeeded failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

router.get('/holidays/:year', requireAuth, async (req, res) => {
  const yearParam = req.params.year;
  const y = Number(yearParam);

  if (!Number.isInteger(y)) {
    return res.status(400).json({ error: 'Ungültiges Jahr' });
  }

  try {
    await ensureHolidaysSeeded(y);

    const { rows } = await pool.query(
      `SELECT id, date, name, year
         FROM holidays
        WHERE year = $1
        ORDER BY date ASC`,
      [y]
    );

    return res.json({ holidays: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;