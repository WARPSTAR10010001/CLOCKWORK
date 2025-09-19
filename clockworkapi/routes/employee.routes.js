const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Department = require('../models/Department');

// GET /api/employees - Alle Mitarbeiter abrufen
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: Department,
                attributes: ['department_name']
            }],
            order: [['last_name', 'ASC'], ['first_name', 'ASC']]
        });
        res.status(200).json(employees);
    } catch (err) {
        console.error('Fehler beim Abrufen der Mitarbeiter:', err);
        res.status(500).json({ message: 'Serverfehler beim Abrufen der Mitarbeiter.' });
    }
});

// GET /api/employees/:id - Einen einzelnen Mitarbeiter abrufen
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [{
                model: Department,
                attributes: ['department_name']
            }]
        });
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }
        res.status(200).json(employee);
    } catch (err) {
        console.error(`Fehler beim Abrufen von Mitarbeiter ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Abrufen des Mitarbeiters.' });
    }
});

// POST /api/employees - Einen neuen Mitarbeiter erstellen
router.post('/', async (req, res) => {
    const { first_name, last_name, email, department_id } = req.body;
    if (!first_name || !last_name) {
        return res.status(400).json({ message: 'Vor- und Nachname sind erforderlich.' });
    }
    try {
        const newEmployee = await Employee.create({ first_name, last_name, email, department_id });
        res.status(201).json(newEmployee);
    } catch (err) {
        console.error('Fehler beim Erstellen des Mitarbeiters:', err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Mitarbeiters.' });
    }
});

// PUT /api/employees/:id - Einen Mitarbeiter aktualisieren
router.put('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }
        
        const updatedEmployee = await employee.update(req.body);
        res.status(200).json(updatedEmployee);
    } catch (err) {
        console.error(`Fehler beim Aktualisieren von Mitarbeiter ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Mitarbeiters.' });
    }
});

// DELETE /api/employees/:id - Einen Mitarbeiter löschen
router.delete('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
        }

        await employee.destroy();
        res.status(200).json({ message: 'Mitarbeiter erfolgreich gelöscht.' });
    } catch (err) {
        console.error(`Fehler beim Löschen von Mitarbeiter ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Mitarbeiters.' });
    }
});

module.exports = router;