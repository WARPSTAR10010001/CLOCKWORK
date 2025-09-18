const express = require("express");
const router = express.Router();
const sequelize = require("../db");
const { verifyToken, isMod } = require("../middleware");
const Plan = require("../models/Plan");
const Employee = require("../models/Employee");
const PlanMembership = require("../models/PlanMembership");
const Holiday = require("../models/Holiday");
const { Op } = require("sequelize");

// --- Hilfsfunktionen ---

function isValidISODate(d) {
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());
}

function isWeekend(dateStr) {
    const d = new Date(dateStr);
    const day = d.getUTCDay(); // Use getUTCDay() to avoid timezone issues
    return day === 0 || day === 6;
}

function generateHolidays(year) {
    const fixed = [
        { month: 1, day: 1, name: "Neujahr" },
        { month: 5, day: 1, name: "Tag der Arbeit" },
        { month: 10, day: 3, name: "Tag der Deutschen Einheit" },
        { month: 11, day: 1, name: "Allerheiligen" },
        { month: 12, day: 25, name: "1. Weihnachtstag" },
        { month: 12, day: 26, name: "2. Weihnachtstag" },
    ];

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
    const easter = new Date(Date.UTC(year, month - 1, day));

    const getDateStr = d => d.toISOString().split("T")[0];

    const holidays = fixed.map(h => ({
        name: h.name,
        holiday_date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`
    }));

    const goodFriday = new Date(easter);
    goodFriday.setUTCDate(easter.getUTCDate() - 2);
    holidays.push({ name: "Karfreitag", holiday_date: getDateStr(goodFriday) });

    const easterMonday = new Date(easter);
    easterMonday.setUTCDate(easter.getUTCDate() + 1);
    holidays.push({ name: "Ostermontag", holiday_date: getDateStr(easterMonday) });

    const ascension = new Date(easter);
    ascension.setUTCDate(easter.getUTCDate() + 39);
    holidays.push({ name: "Christi Himmelfahrt", holiday_date: getDateStr(ascension) });

    const whitMonday = new Date(easter);
    whitMonday.setUTCDate(easter.getUTCDate() + 50);
    holidays.push({ name: "Pfingstmontag", holiday_date: getDateStr(whitMonday) });

    const corpusChristi = new Date(easter);
    corpusChristi.setUTCDate(easter.getUTCDate() + 60);
    holidays.push({ name: "Fronleichnam", holiday_date: getDateStr(corpusChristi) });
    
    return holidays;
}


/**
 * POST /api/plans
 * Erstellt einen neuen Jahresplan und die zugehörigen Plan-Mitgliedschaften.
 */
router.post("/", verifyToken, isMod, async (req, res) => {
    const { year, employees } = req.body;
    const { departmentId } = req.user;

    if (!year || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ error: "Jahr und eine Mitarbeiterliste sind erforderlich." });
    }

    const transaction = await sequelize.transaction();

    try {
        const [plan, planCreated] = await Plan.findOrCreate({
            where: { year, department_id: departmentId },
            transaction
        });

        if (!planCreated) {
            await transaction.rollback();
            return res.status(409).json({ error: `Ein Plan für das Jahr ${year} existiert bereits.` });
        }
        
        const holidayCount = await Holiday.count({ where: { holiday_date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] } } });
        if (holidayCount === 0) {
            const holidays = generateHolidays(year);
            await Holiday.bulkCreate(holidays, { transaction });
        }

        for (const empData of employees) {
            if (!empData.name || !empData.name.trim()) continue;

            const [employee] = await Employee.findOrCreate({
                where: { name: empData.name.trim(), department_id: departmentId },
                defaults: { name: empData.name.trim(), department_id: departmentId },
                transaction
            });

            await PlanMembership.create({
                plan_id: plan.id,
                employee_id: employee.id,
                start_date: empData.start_date || null,
                end_date: empData.end_date || null,
                vacation_days_carryover: empData.vacation_days_carryover,
                vacation_days_total: empData.vacation_days_total,
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json({ message: "Jahresplan erfolgreich erstellt.", plan });

    } catch (error) {
        await transaction.rollback();
        console.error("Fehler beim Erstellen des Plans:", error);
        res.status(500).json({ error: "Serverfehler beim Erstellen des Plans." });
    }
});


/**
 * GET /api/plans
 * Holt alle Pläne für eine Abteilung oder alle Pläne für einen Admin.
 */
router.get("/", verifyToken, async (req, res) => {
    try {
        const { departmentId, role } = req.user;
        const { year } = req.query;

        const whereClause = {};

        if (role !== 'admin') {
            whereClause.department_id = departmentId;
        }
        if (year) {
            whereClause.year = parseInt(year, 10);
        }

        const plans = await Plan.findAll({
            where: whereClause,
            order: [['year', 'DESC']]
        });
        res.status(200).json(plans);
    } catch (error) {
        console.error("Fehler beim Abrufen der Pläne:", error);
        res.status(500).json({ error: "Serverfehler beim Abrufen der Pläne." });
    }
});

module.exports = router;