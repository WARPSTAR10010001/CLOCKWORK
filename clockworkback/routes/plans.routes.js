const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();

const { requireLogin, requireAdmin } = require("../actionHandler");

const DATA_DIR = path.join(__dirname, "../data");
const PLANS_DIR = path.join(DATA_DIR, "plans");
fs.ensureDirSync(PLANS_DIR);

function monthFilePath(year, month) {
    const m = String(month).padStart(2, "0");
    return path.join(PLANS_DIR, `${year}-${m}.json`);
}

function convertNumberToMonthName(m) {
    return [
        "/", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
    ][m] || "/";
}

function isValidYear(y) {
    return Number.isInteger(y) && y >= 2000 && y <= 2100;
}
function isValidMonth(m) {
    return Number.isInteger(m) && m >= 1 && m <= 12;
}
function isValidISODate(d) {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());
}

async function createEmptyMonth(year, month, users) {
    const file = monthFilePath(year, month);

    const days = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        const isoDate = date.toISOString().split("T")[0];
        const weekday = date.getDay() === 0 ? 7 : date.getDay();
        days.push({ date: isoDate, weekday });
        date.setDate(date.getDate() + 1);
    }

    const skeleton = {
        year: parseInt(year),
        month: parseInt(month),
        users: [...users],
        entries: {},
        days
    };
    users.forEach(u => skeleton.entries[u] = {});
    await fs.writeJson(file, skeleton, { spaces: 2 });
    return skeleton;
}

router.get("/:year/:month", requireLogin, async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    if (!isValidYear(year) || !isValidMonth(month)) {
        return res.status(400).json({ error: "Ungültiges Jahr oder Monat." });
    }

    const file = monthFilePath(year, month);
    try {
        if (await fs.pathExists(file)) {
            const json = await fs.readJson(file);
            return res.json(json);
        } else {
            return res.status(404).json({ error: "Monatsplan nicht gefunden." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Serverseitiger Fehler." });
    }
});

router.post("/new", requireLogin, requireAdmin, async (req, res) => {
    const year = parseInt(req.body.year, 10);
    const users = req.body.users;
    if (!isValidYear(year) || !Array.isArray(users)) {
        return res.status(400).json({ error: "Ungültige Parameter." });
    }

    try {
        const createdMonths = [];
        for (let m = 1; m <= 12; m++) {
            await createEmptyMonth(year, m, users);
            createdMonths.push({ month: m, file: monthFilePath(year, m) });
        }
        res.json({ message: `Jahresplan für ${year} erstellt.`, months: createdMonths });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Serverseitiger Fehler." });
    }
});

router.post("/:year/:month/entry", requireLogin, async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const { employee, date, type, note } = req.body;

    if (!isValidYear(year) || !isValidMonth(month) ||
        typeof employee !== "string" || !isValidISODate(date) || typeof type !== "string") {
        return res.status(400).json({ error: "Ungültige Felder." });
    }

    const file = monthFilePath(year, month);
    try {
        let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
        if (!plan.users.includes(employee)) plan.users.push(employee);
        if (!plan.entries[employee]) plan.entries[employee] = {};
        plan.entries[employee][date] = { type, note };

        await fs.writeJson(file, plan, { spaces: 2 });
        res.json({ message: "Tag eingetragen.", plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Serverseitiger Fehler." });
    }
});

router.post("/:year/:month/entries", requireLogin, async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const { employee, startDate, endDate, type, note } = req.body;

    if (!isValidYear(year) || !isValidMonth(month) ||
        typeof employee !== "string" || !isValidISODate(startDate) || !isValidISODate(endDate) || typeof type !== "string") {
        return res.status(400).json({ error: "Ungültige Felder." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
        return res.status(400).json({ error: "Startdatum darf nicht nach Enddatum liegen." });
    }

    const file = monthFilePath(year, month);
    try {
        let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
        if (!plan.users.includes(employee)) plan.users.push(employee);
        if (!plan.entries[employee]) plan.entries[employee] = {};

        let current = new Date(start);
        while (current <= end) {
            const iso = current.toISOString().split("T")[0];
            if (new Date(iso).getMonth() + 1 === month) {
                plan.entries[employee][iso] = { type, note };
            }
            current.setDate(current.getDate() + 1);
        }

        await fs.writeJson(file, plan, { spaces: 2 });
        res.json({ message: "Mehrere Tage eingetragen.", plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Serverseitiger Fehler." });
    }
});

module.exports = router;