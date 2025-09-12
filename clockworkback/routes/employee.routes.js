const express = require("express");
const router = express.Router();
const { verifyToken, isMod } = require("../middleware");
const Employee = require("../models/Employee");
const { Op } = require("sequelize");


router.get("/", verifyToken, async (req, res) => {
  try {
    const { departmentId, role } = req.user;
    let whereClause = {};

    if (role !== 'admin') {
      if (!departmentId) {
        return res.status(403).json({ error: "Keine Abteilungsinformation im Token gefunden." });
      }
      whereClause.department_id = departmentId;
    }

    const employees = await Employee.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Fehler beim Abrufen der Mitarbeiter:", error);
    res.status(500).json({ error: "Serverfehler beim Abrufen der Mitarbeiter." });
  }
});

router.post("/", verifyToken, isMod, async (req, res) => {
  const { name } = req.body;
  const { departmentId } = req.user;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Der Name des Mitarbeiters darf nicht leer sein." });
  }
  if (!departmentId) {
    return res.status(403).json({ error: "Nur Moderatoren mit einer Abteilung können Mitarbeiter erstellen." });
  }

  try {
    const [employee, created] = await Employee.findOrCreate({
      where: { name: name.trim(), department_id: departmentId },
      defaults: { name: name.trim(), department_id: departmentId }
    });

    if (created) {
      res.status(201).json(employee);
    } else {
      res.status(200).json(employee);
    }

  } catch (error) {
    console.error("Fehler beim Erstellen des Mitarbeiters:", error);
    res.status(500).json({ error: "Serverfehler beim Erstellen des Mitarbeiters." });
  }
});

module.exports = router;