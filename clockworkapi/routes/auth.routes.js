const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = 'jsonwebtoken';
const SystemUser = require('../models/SystemUser');
const Department = require('../models/Department');

// POST /api/auth/register - Einen neuen Benutzer registrieren
router.post('/register', async (req, res) => {
    const { username, password, email, department_id } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich.' });
    }

    try {
        // Überprüfen, ob der Benutzer bereits existiert
        const existingUser = await SystemUser.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ message: 'Benutzername bereits vergeben.' });
        }

        // Passwort hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Neuen Benutzer erstellen
        const newUser = await SystemUser.create({
            username,
            password: hashedPassword,
            email,
            department_id
        });

        res.status(201).json({
            message: 'Benutzer erfolgreich registriert.',
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error('Fehler bei der Registrierung:', err);
        res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
    }
});


// POST /api/auth/login - Einen Benutzer anmelden
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich.' });
    }

    try {
        // Benutzer in der Datenbank finden
        const user = await SystemUser.findOne({
            where: { username },
            include: [{ model: Department, attributes: ['department_name'] }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // Passwort vergleichen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // JWT erstellen
        const payload = {
            user: {
                id: user.user_id,
                username: user.username,
                role: user.role // Annahme: Das User-Modell hat eine 'role'-Spalte
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
        );
        
        // Token im Cookie speichern
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Nur über HTTPS in Produktion
            sameSite: 'strict'
        });

        // Antwort senden
        res.status(200).json({
            message: 'Anmeldung erfolgreich.',
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                department: user.Department ? user.Department.department_name : null
            },
            token: token
        });

    } catch (err) {
        console.error('Fehler beim Login:', err);
        res.status(500).json({ message: 'Serverfehler beim Login.' });
    }
});

// POST /api/auth/logout - Einen Benutzer abmelden
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Abmeldung erfolgreich.' });
});


module.exports = router;