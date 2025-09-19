const express = require('express');
const router = express.Router();
const { Plan, PlanEntry, Employee, Department } = require('../models'); // Annahme, dass Modelle über einen Index exportiert werden

// GET /api/plans - Alle Pläne abrufen
router.get('/', async (req, res) => {
    try {
        const plans = await Plan.findAll({
            include: [{
                model: Department,
                attributes: ['department_name']
            }],
            order: [['year', 'DESC'], ['month', 'DESC']]
        });
        res.status(200).json(plans);
    } catch (err) {
        console.error('Fehler beim Abrufen der Pläne:', err);
        res.status(500).json({ message: 'Serverfehler beim Abrufen der Pläne.' });
    }
});

// GET /api/plans/:id - Einen einzelnen Plan mit allen Einträgen abrufen
router.get('/:id', async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id, {
            include: [
                {
                    model: Department,
                    attributes: ['department_name']
                },
                {
                    model: PlanEntry,
                    include: [{
                        model: Employee,
                        attributes: ['first_name', 'last_name']
                    }]
                },
                {
                    model: Employee, // Mitarbeiter, die dem Plan zugeordnet sind
                    attributes: ['employee_id', 'first_name', 'last_name'],
                    through: { attributes: [] } // Keine Daten aus der Zwischentabelle
                }
            ],
            order: [
                [PlanEntry, 'date', 'ASC']
            ]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan nicht gefunden.' });
        }
        res.status(200).json(plan);
    } catch (err) {
        console.error(`Fehler beim Abrufen von Plan ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Abrufen des Plans.' });
    }
});

// POST /api/plans - Einen neuen Plan erstellen
router.post('/', async (req, res) => {
    const { title, month, year, department_id } = req.body;
    if (!title || !month || !year || !department_id) {
        return res.status(400).json({ message: 'Titel, Monat, Jahr und Abteilung sind erforderlich.' });
    }
    try {
        const newPlan = await Plan.create(req.body);
        res.status(201).json(newPlan);
    } catch (err) {
        console.error('Fehler beim Erstellen des Plans:', err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Plans.' });
    }
});

// PUT /api/plans/:id - Einen Plan aktualisieren
router.put('/:id', async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan nicht gefunden.' });
        }
        const updatedPlan = await plan.update(req.body);
        res.status(200).json(updatedPlan);
    } catch (err) {
        console.error(`Fehler beim Aktualisieren von Plan ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Plans.' });
    }
});

// DELETE /api/plans/:id - Einen Plan löschen
router.delete('/:id', async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan nicht gefunden.' });
        }
        // Lösche zuerst alle zugehörigen Einträge, um Foreign-Key-Konflikte zu vermeiden
        await PlanEntry.destroy({ where: { plan_id: req.params.id } });
        await plan.destroy();
        res.status(200).json({ message: 'Plan erfolgreich gelöscht.' });
    } catch (err) {
        console.error(`Fehler beim Löschen von Plan ${req.params.id}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Plans.' });
    }
});


// --- Routen für Planeinträge (Plan Entries) ---

// POST /api/plans/:planId/entries - Einen neuen Eintrag zu einem Plan hinzufügen
router.post('/:planId/entries', async (req, res) => {
    const { date, entry_type, employee_id } = req.body;
    if (!date || !entry_type || !employee_id) {
        return res.status(400).json({ message: 'Datum, Eintragstyp und Mitarbeiter-ID sind erforderlich.' });
    }
    try {
        const plan = await Plan.findByPk(req.params.planId);
        if (!plan) {
            return res.status(404).json({ message: 'Zugehöriger Plan nicht gefunden.' });
        }
        const newEntry = await PlanEntry.create({
            ...req.body,
            plan_id: req.params.planId
        });
        res.status(201).json(newEntry);
    } catch (err) {
        console.error(`Fehler beim Erstellen des Eintrags für Plan ${req.params.planId}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Erstellen des Eintrags.' });
    }
});

// PUT /api/plans/entries/:entryId - Einen Planeintrag aktualisieren
router.put('/entries/:entryId', async (req, res) => {
    try {
        const entry = await PlanEntry.findByPk(req.params.entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Eintrag nicht gefunden.' });
        }
        const updatedEntry = await entry.update(req.body);
        res.status(200).json(updatedEntry);
    } catch (err) {
        console.error(`Fehler beim Aktualisieren von Eintrag ${req.params.entryId}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Eintrags.' });
    }
});

// DELETE /api/plans/entries/:entryId - Einen Planeintrag löschen
router.delete('/entries/:entryId', async (req, res) => {
    try {
        const entry = await PlanEntry.findByPk(req.params.entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Eintrag nicht gefunden.' });
        }
        await entry.destroy();
        res.status(200).json({ message: 'Eintrag erfolgreich gelöscht.' });
    } catch (err) {
        console.error(`Fehler beim Löschen von Eintrag ${req.params.entryId}:`, err);
        res.status(500).json({ message: 'Serverfehler beim Löschen des Eintrags.' });
    }
});


module.exports = router;