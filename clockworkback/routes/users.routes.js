const express = require("express");
const router = express.Router();

const users = [
    {
        id: 0,
        username: "admin",
        password: "CWadmin47495",
    },
    {
        id: 1,
        username: "default",
        password: "rheinberg47495!",
    }
];

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Bitte das Anmeldefeld ausfüllen." });
    }

    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Falsche Anmeldedaten. Erneut versuchen oder einen Systemadmin kontaktieren." });
    }

    req.session.user = { id: user.id, username: user.username, isAdmin: user.isAdmin };
    res.json({ message: "Anmeldung erfolgreich.", user: { username: user.username, isAdmin: user.isAdmin } });
});

router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Abmeldung fehlgeschlagen." });
        }
        res.json({ message: "Abmeldung erfolgreich." });
    });
});

module.exports = router;