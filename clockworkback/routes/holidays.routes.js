const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();

const DATA_DIR = path.join(__dirname, "../data");
const HOLIDAYS_DIR = path.join(DATA_DIR, "holidays");
fs.ensureDirSync(HOLIDAYS_DIR);

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
    const easter = new Date(year, month - 1, day);

    const getDateStr = d => d.toISOString().split("T")[0];

    const holidays = [...fixed];

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: getDateStr(goodFriday), name: "Karfreitag" });

    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({ date: getDateStr(easterMonday), name: "Ostermontag" });

    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays.push({ date: getDateStr(ascension), name: "Christi Himmelfahrt" });

    const whitMonday = new Date(easter);
    whitMonday.setDate(easter.getDate() + 50);
    holidays.push({ date: getDateStr(whitMonday), name: "Pfingstmontag" });

    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    holidays.push({ date: getDateStr(corpusChristi), name: "Fronleichnam" });

    holidays.forEach(h => {
        if (!h.date) {
            h.date = `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
        }
        delete h.month;
        delete h.day;
    });

    return holidays;
}

router.get("/:year", async (req, res) => {
    const year = parseInt(req.params.year, 10);
    if (isNaN(year)) {
        return res.status(400).json({ error: "Ungültiges Jahr." });
    }

    const filePath = path.join(HOLIDAYS_DIR, `${year}.json`);
    try {
        let holidays;
        if (await fs.pathExists(filePath)) {
            holidays = await fs.readJson(filePath);
        } else {
            holidays = generateHolidays(year);
            await fs.writeJson(filePath, holidays, { spaces: 2 });
        }
        res.json(holidays);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Serverseitiger Fehler." });
    }
});

module.exports = router;