const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SystemUser = require("../models/SystemUser");
require("dotenv").config();
const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Benutzername und Passwort sind erforderlich." });
    }

    try {
        const user = await SystemUser.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: "Falsche Anmeldedaten." });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Falsche Anmeldedaten." });
        }

        const tokenPayload = {
            id: user.id,
            username: user.username,
            role: user.role,
            departmentId: user.department_id
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
        );

        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "lax" })
           .json({
               message: "Login erfolgreich",
               user: tokenPayload
           });

    } catch (err) {
        console.error("Login Fehler:", err);
        res.status(500).json({ error: "Ein interner Serverfehler ist aufgetreten." });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token").json({ message: "Logout erfolgreich." });
});

const { verifyToken } = require("../middleware");
router.get("/status", verifyToken, (req, res) => {
    res.json({
        loggedIn: true,
        user: req.user
    });
});

module.exports = router;