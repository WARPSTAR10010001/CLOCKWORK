const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();

const { checkAuth, requireAdmin } = require("../middleware");

const DATA_DIR = path.join(__dirname, "../data");
const PLANS_DIR = path.join(DATA_DIR, "plans");
fs.ensureDirSync(PLANS_DIR);

function monthFilePath(year, month) {
  const m = String(month).padStart(2, "0");
  return path.join(PLANS_DIR, `${year}-${m}.json`);
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

async function createEmptyMonth(year, month, users, lastYearCarryOver = {}, totalVacation = {}) {
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
    remainingVacation: {},
    days
  };

  users.forEach(u => {
    skeleton.entries[u] = {};
    skeleton.remainingVacation[u] = lastYearCarryOver[u] ?? totalVacation[u] ?? 0;
  });

  await fs.writeJson(file, skeleton, { spaces: 2 });
  return skeleton;
}

function updateRemainingVacation(prevMonth, plan) {
  plan.users.forEach(u => {
    const prevRemaining = prevMonth?.remainingVacation?.[u] ?? 0;
    const usedThisMonth = Object.values(plan.entries[u] || {}).filter(e => e.type === "Urlaub").length;
    plan.remainingVacation[u] = prevRemaining - usedThisMonth;
    if (plan.remainingVacation[u] < 0) plan.remainingVacation[u] = 0;
  });
}

router.get("/:year/:month", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  if (!isValidYear(year) || !isValidMonth(month)) {
    return res.status(400).json({ error: "Ungültiges Jahr oder Monat." });
  }

  const file = monthFilePath(year, month);
  try {
    if (!(await fs.pathExists(file))) return res.status(404).json({ error: "Monatsplan nicht gefunden." });

    const plan = await fs.readJson(file);

    const prevFile = monthFilePath(year, month - 1);
    let prevMonth = null;
    if (month > 1 && (await fs.pathExists(prevFile))) prevMonth = await fs.readJson(prevFile);

    updateRemainingVacation(prevMonth, plan);

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});

router.post("/new", checkAuth, requireAdmin, async (req, res) => {
  const year = parseInt(req.body.year, 10);
  const users = req.body.users;
  const lastYearCarryOver = req.body.lastYearCarryOver || {};
  const totalVacation = req.body.totalVacation || {};

  if (!isValidYear(year) || !Array.isArray(users)) {
    return res.status(400).json({ error: "Ungültige Parameter." });
  }

  try {
    const createdMonths = [];
    for (let m = 1; m <= 12; m++) {
      const prevMonth = m === 1 ? null : await fs.readJson(monthFilePath(year, m - 1)).catch(() => null);
      const monthPlan = await createEmptyMonth(year, m, users, m === 1 ? lastYearCarryOver : prevMonth?.remainingVacation, totalVacation);
      if (prevMonth) updateRemainingVacation(prevMonth, monthPlan);
      await fs.writeJson(monthFilePath(year, m), monthPlan, { spaces: 2 });
      createdMonths.push({ month: m, file: monthFilePath(year, m) });
    }
    res.json({ message: `Jahresplan für ${year} erstellt.`, months: createdMonths });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});

router.post("/:year/:month/entry/delete", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const { employee, date } = req.body;

  if (!isValidYear(year) || !isValidMonth(month) ||
    typeof employee !== "string" || !isValidISODate(date)) {
    return res.status(400).json({ error: "Ungültige Felder." });
  }

  const file = monthFilePath(year, month);
  try {
    let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
    if (plan.entries[employee] && plan.entries[employee][date]) {
      delete plan.entries[employee][date];
      await fs.writeJson(file, plan, { spaces: 2 });
    }
    res.json({ message: "Eintrag gelöscht.", plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});


router.get("/years", checkAuth, async (req, res) => {
  try {
    const files = await fs.readdir(PLANS_DIR);
    const years = new Set();
    files.forEach(file => {
      const match = file.match(/^(\d{4})-\d{2}\.json$/);
      if (match) {
        const year = parseInt(match[1], 10);
        if (isValidYear(year)) {
          years.add(year);
        }
      }
    });
    res.json({ years: Array.from(years).sort((a, b) => a - b) });
  } catch (err) {
    console.error("Fehler beim Laden der Jahre:", err);
    res.status(500).json({ error: "Serverseitiger Fehler beim Laden der Jahre." });
  }
});

router.post("/:year/:month/entry", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const { employee, date, type } = req.body;

  if (!isValidYear(year) || !isValidMonth(month) || typeof employee !== "string" || !isValidISODate(date) || typeof type !== "string") {
    return res.status(400).json({ error: "Ungültige Felder." });
  }

  const file = monthFilePath(year, month);
  try {
    let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
    if (!plan.users.includes(employee)) plan.users.push(employee);
    if (!plan.entries[employee]) plan.entries[employee] = {};
    plan.entries[employee][date] = { type };

    const prevMonth = month > 1 ? await fs.readJson(monthFilePath(year, month - 1)).catch(() => null) : null;
    updateRemainingVacation(prevMonth, plan);

    await fs.writeJson(file, plan, { spaces: 2 });
    res.json({ message: "Tag eingetragen.", plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});

router.post("/:year/:month/entries", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const { employee, startDate, endDate, type } = req.body;

  if (!isValidYear(year) || !isValidMonth(month) || typeof employee !== "string" || !isValidISODate(startDate) || !isValidISODate(endDate) || typeof type !== "string") {
    return res.status(400).json({ error: "Ungültige Felder." });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return res.status(400).json({ error: "Startdatum darf nicht nach Enddatum liegen." });

  const file = monthFilePath(year, month);
  try {
    let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
    if (!plan.users.includes(employee)) plan.users.push(employee);
    if (!plan.entries[employee]) plan.entries[employee] = {};

    let current = new Date(start);
    while (current <= end) {
      const iso = current.toISOString().split("T")[0];
      if (new Date(iso).getMonth() + 1 === month) plan.entries[employee][iso] = { type };
      current.setDate(current.getDate() + 1);
    }

    const prevMonth = month > 1 ? await fs.readJson(monthFilePath(year, month - 1)).catch(() => null) : null;
    updateRemainingVacation(prevMonth, plan);

    await fs.writeJson(file, plan, { spaces: 2 });
    res.json({ message: "Mehrere Tage eingetragen.", plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});

router.get("/:year/:month/entries", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const { employee, date } = req.body;

  if (!isValidYear(year) || !isValidMonth(month) ||
    typeof employee !== "string" || !isValidISODate(date)) {
    return res.status(400).json({ error: "Ungültige Felder." });
  }

  const file = monthFilePath(year, month);
  try {
    let plan = (await fs.pathExists(file)) ? await fs.readJson(file) : await createEmptyMonth(year, month, []);
    if (plan.entries[employee] && plan.entries[employee][date]) {
      entry = plan.entries[employee][date];
    }
    res.json({ message: "Eintrag versendet.", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler." });
  }
});

router.delete("/:year/:month/entries/delete", checkAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);
  const { employee, startDate, endDate } = req.body;
  if (!isValidYear(year) || !isValidMonth(month) ||
      typeof employee !== "string" ||
      !isValidISODate(startDate) || !isValidISODate(endDate)) {
    return res.status(400).json({ error: "Ungültige Felder." });
  }
  const file = monthFilePath(year, month);
  try {
    let plan = (await fs.pathExists(file)) 
      ? await fs.readJson(file) 
      : await createEmptyMonth(year, month, []);

    if (!plan.entries[employee]) {
      return res.status(404).json({ error: "Keine Einträge für diesen Nutzer vorhanden." });
    }
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const iso = current.toISOString().split("T")[0];
      if (plan.entries[employee][iso]) {
        delete plan.entries[employee][iso];
      }
      current.setDate(current.getDate() + 1);
    }
    await fs.writeJson(file, plan, { spaces: 2 });
    res.json({ message: "Bulk Delete erfolgreich." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverseitiger Fehler beim Bulk Delete." });
  }
});

module.exports = router;