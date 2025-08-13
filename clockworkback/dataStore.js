const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const PLANS_DIR = path.join(DATA_DIR, "plans");
const HOLIDAYS_DIR = path.join(DATA_DIR, "holidays");

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PLANS_DIR, { recursive: true });
  await fs.mkdir(HOLIDAYS_DIR, { recursive: true });
}
ensureDirs();

async function writeJsonAtomic(filePath, obj) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = filePath + "." + crypto.randomBytes(6).toString("hex") + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

const usersFile = path.join(DATA_DIR, "users.json");

async function readUsers() {
  try {
    const txt = await fs.readFile(usersFile, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    const initial = { users: [] };
    await writeJsonAtomic(usersFile, initial);
    return initial;
  }
}

async function writeUsers(obj) {
  await writeJsonAtomic(usersFile, obj);
}

function monthFile(year, month) {
  const m = String(month).padStart(2, "0");
  return path.join(PLANS_DIR, `${year}-${m}.json`);
}

async function readMonthPlan(year, month) {
  const file = monthFile(year, month);
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    const skeleton = {
      year: Number(year),
      month: Number(month),
      employees: [],
      rows: {},
      meta: { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }
    };
    await writeJsonAtomic(file, skeleton);
    return skeleton;
  }
}

async function writeMonthPlan(year, month, obj) {
  const file = monthFile(year, month);
  obj.meta = obj.meta || {};
  obj.meta.lastModified = new Date().toISOString();
  await writeJsonAtomic(file, obj);
}

async function readHolidays(year) {
  const file = path.join(HOLIDAYS_DIR, `${year}.json`);
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    return { year: Number(year), holidays: [] };
  }
}

module.exports = {
  readUsers, writeUsers,
  readMonthPlan, writeMonthPlan,
  readHolidays,
  monthFile
};