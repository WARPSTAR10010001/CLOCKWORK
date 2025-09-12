const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const sequelize = require('../db');
const { verifyToken, isMod } = require('../middleware');

const Plan = require('../models/Plan');
const Employee = require('../models/Employee');
const PlanEntry = require('../models/PlanEntry');
const Holiday = require('../models/Holiday');

function isValidISODate(d) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());
}

function isWeekend(dateStr) {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    return day === 0 || day === 6;
}
async function generateAndSaveHolidays(year, transaction) {
    console.log(`[Clockwork] Generiere Feiertage für das Jahr ${year}...`);
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

    let holidays = [
        { date: `${year}-01-01`, name: "Neujahr" },
        { date: `${year}-05-01`, name: "Tag der Arbeit" },
        { date: `${year}-10-03`, name: "Tag der Deutschen Einheit" },
        { date: `${year}-11-01`, name: "Allerheiligen" },
        { date: `${year}-12-25`, name: "1. Weihnachtstag" },
        { date: `${year}-12-26`, name: "2. Weihnachtstag" },
    ];
    
    const goodFriday = new Date(easter); goodFriday.setUTCDate(easter.getUTCDate() - 2);
    holidays.push({ date: getDateStr(goodFriday), name: "Karfreitag" });
    const easterMonday = new Date(easter); easterMonday.setUTCDate(easter.getUTCDate() + 1);
    holidays.push({ date: getDateStr(easterMonday), name: "Ostermontag" });
    const ascension = new Date(easter); ascension.setUTCDate(easter.getUTCDate() + 39);
    holidays.push({ date: getDateStr(ascension), name: "Christi Himmelfahrt" });
    const whitMonday = new Date(easter); whitMonday.setUTCDate(easter.getUTCDate() + 50);
    holidays.push({ date: getDateStr(whitMonday), name: "Pfingstmontag" });
    const corpusChristi = new Date(easter); corpusChristi.setUTCDate(easter.getUTCDate() + 60);
    holidays.push({ date: getDateStr(corpusChristi), name: "Fronleichnam" });

    const formattedHolidays = holidays.map(h => ({ holiday_date: h.date, name: h.name }));

    await Holiday.bulkCreate(formattedHolidays, { transaction, ignoreDuplicates: true });
    console.log(`[Clockwork] ${formattedHolidays.length} Feiertage für ${year} erfolgreich in die DB geschrieben.`);
}

router.post("/", verifyToken, isMod, async (req, res) => {
    const { year, employees } = req.body;
    const departmentIdFromToken = req.user.departmentId;

    if (!year || !Array.isArray(employees)) {
        return res.status(400).json({ error: "Jahr und eine Liste von Mitarbeitern sind erforderlich." });
    }

    try {
        const result = await sequelize.transaction(async (t) => {
            const holidaysExist = await Holiday.findOne({ where: { holiday_date: `${year}-01-01` }, transaction: t });

            if (!holidaysExist) {
                await generateAndSaveHolidays(year, t);
            }

            const newPlan = await Plan.create({
                year: year,
                department_id: departmentIdFromToken
            }, { transaction: t });

            for (const emp of employees) {
                await Employee.upsert({
                    id: emp.id,
                    name: emp.name,
                    department_id: departmentIdFromToken,
                    vacation_days_last_year: emp.vacation_days_last_year || 0,
                    vacation_days_current_year: emp.vacation_days_current_year || 0,
                    start_date: emp.start_date || null,
                    end_date: emp.end_date || null
                }, { transaction: t });
            }

            return newPlan;
        });

        res.status(201).json({ message: `Plan für Abteilung ${departmentIdFromToken} im Jahr ${year} erfolgreich angelegt.`, plan: result });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: `Ein Plan für das Jahr ${year} und diese Abteilung existiert bereits.` });
        }
        console.error("Fehler beim Erstellen des Plans:", error);
        res.status(500).json({ error: "Serverfehler beim Erstellen des Plans." });
    }
});

router.get("/", verifyToken, async (req, res) => {
    const { role, departmentId } = req.user;
    try {
        const queryOptions = { order: [['year', 'DESC']] };
        if (role !== 'admin') {
            queryOptions.where = { department_id: departmentId };
        }
        const plans = await Plan.findAll(queryOptions);
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: "Serverfehler beim Abrufen der Pläne." });
    }
});

router.get("/:planId/entries", verifyToken, async (req, res) => {
    const { planId } = req.params;
    const { role, departmentId } = req.user;
    try {
        const plan = await Plan.findByPk(planId);
        if (!plan || (role !== 'admin' && plan.department_id !== departmentId)) {
            return res.status(403).json({ error: "Zugriff auf diesen Plan verweigert." });
        }
        const entries = await PlanEntry.findAll({ where: { plan_id: planId } });
        res.json(entries);
    } catch (error) {
        console.error("Fehler beim Abrufen der Einträge:", error);
        res.status(500).json({ error: "Serverfehler beim Abrufen der Einträge." });
    }
});

router.post("/:planId/entries/bulk-create", verifyToken, isMod, async (req, res) => {
    const { planId } = req.params;
    const { employee_id, dates, entry_type } = req.body;
    const { role, departmentId } = req.user;

    if (!employee_id || !Array.isArray(dates) || !entry_type) {
        return res.status(400).json({ error: "Mitarbeiter-ID, ein Array von Daten und ein Typ sind erforderlich." });
    }
    
    try {
        const plan = await Plan.findByPk(planId);
        if (!plan || (role !== 'admin' && plan.department_id !== departmentId)) {
            return res.status(403).json({ error: "Zugriff auf diesen Plan verweigert." });
        }
        const employee = await Employee.findByPk(employee_id);
        if (!employee || (role !== 'admin' && employee.department_id !== departmentId)) {
            return res.status(403).json({ error: "Zugriff auf diesen Mitarbeiter verweigert." });
        }

        const validDates = dates.filter(d => isValidISODate(d) && !isWeekend(d));

        if (validDates.length === 0) {
            return res.status(400).json({ message: "Keine gültigen Arbeitstage zum Eintragen gefunden.", count: 0 });
        }

        const entriesToCreate = validDates.map(d => ({
            plan_id: planId,
            employee_id,
            entry_date: d,
            entry_type
        }));

        const createdEntries = await PlanEntry.bulkCreate(entriesToCreate, { 
            ignoreDuplicates: true
        });
        res.status(201).json({ message: "Einträge erfolgreich erstellt/aktualisiert.", count: createdEntries.length, entries: createdEntries });

    } catch (error) {
        console.error("Fehler beim Bulk-Erstellen der Einträge:", error);
        res.status(500).json({ error: "Serverfehler beim Erstellen der Einträge." });
    }
});

router.post("/entries/bulk-delete", verifyToken, isMod, async (req, res) => {
    const { employee_id, dates } = req.body;
    const { role, departmentId } = req.user;

    if (!employee_id || !Array.isArray(dates)) {
        return res.status(400).json({ error: "Mitarbeiter-ID und ein Array von Daten sind erforderlich." });
    }

    try {
        const employee = await Employee.findByPk(employee_id);
        if (!employee || (role !== 'admin' && employee.department_id !== departmentId)) {
            return res.status(403).json({ error: "Keine Berechtigung, Einträge für diesen Mitarbeiter zu löschen." });
        }

        const deletedCount = await PlanEntry.destroy({
            where: {
                employee_id: employee_id,
                entry_date: {
                    [Op.in]: dates
                }
            }
        });
        
        res.status(200).json({ message: "Einträge erfolgreich gelöscht.", count: deletedCount });

    } catch (error) {
        console.error("Fehler beim Bulk-Löschen der Einträge:", error);
        res.status(500).json({ error: "Serverfehler beim Löschen der Einträge." });
    }
});

module.exports = router;