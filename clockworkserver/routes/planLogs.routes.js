// src/routes/planLogs.routes.js
const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/plans/:planId/logs
 * Body: {
 *   departmentId: number,
 *   employeeId:   number,
 *   actionType:   'SET' | 'DELETE',
 *   statusCode:   string | null,
 *   dateFrom:     'YYYY-MM-DD',
 *   dateTo:       'YYYY-MM-DD',
 *   dayCount:     number,
 *   dates:        string[]  // 'YYYY-MM-DD'
 * }
 */
router.post('/plans/:planId/logs', requireAuth, async (req, res) => {
  const planId = Number(req.params.planId);
  const {
    departmentId,
    employeeId,
    actionType,
    statusCode,
    dateFrom,
    dateTo,
    dayCount,
    dates
  } = req.body || {};

  if (!planId || !departmentId || !employeeId || !actionType || !dateFrom || !dateTo || !dayCount || !Array.isArray(dates)) {
    return res.status(400).json({ error: 'planId, departmentId, employeeId, actionType, dateFrom, dateTo, dayCount, dates benötigt' });
  }

  if (!['SET', 'DELETE'].includes(actionType)) {
    return res.status(400).json({ error: 'Ungültiger actionType' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO plan_logs (
        plan_id,
        department_id,
        employee_id,
        action_type,
        status_code,
        date_from,
        date_to,
        day_count,
        dates
      )
      VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9::date[])
      RETURNING
        id,
        plan_id,
        department_id,
        employee_id,
        action_type,
        status_code,
        date_from,
        date_to,
        day_count,
        dates,
        created_at
      `,
      [
        planId,
        departmentId,
        employeeId,
        actionType,
        statusCode,
        dateFrom,
        dateTo,
        dayCount,
        dates
      ]
    );

    return res.status(201).json({ log: rows[0] });
  } catch (err) {
    console.error('POST /plans/:planId/logs failed:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

/**
 * GET /api/plans/:planId/logs?year=YYYY&month=MM
 * zeigt alle Logs, deren betroffene Tage in diesem Monat liegen
 */
router.get('/plans/:planId/logs', requireAuth, async (req, res) => {
  const planId = Number(req.params.planId);
  const year = Number(req.query.year);
  const month = Number(req.query.month);

  if (!planId || !year || !month) {
    return res.status(400).json({ error: 'planId, year, month benötigt' });
  }

  const mStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${mStr}-01`;
  // JS: new Date(year, month, 0) => letzter Tag des Monats "month"
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        l.*,
        e.display_name AS employee_name
      FROM plan_logs l
      LEFT JOIN employees e ON e.id = l.employee_id
      WHERE
        l.plan_id = $1
        AND l.date_from <= $3::date
        AND l.date_to   >= $2::date
      ORDER BY l.created_at DESC, l.id DESC
      `,
      [planId, monthStart, monthEnd]
    );

    return res.json({ logs: rows });
  } catch (err) {
    console.error('GET /plans/:planId/logs failed:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;