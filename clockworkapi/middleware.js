const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Zugriff verweigert. Bitte einloggen." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Ungültige oder abgelaufene Sitzung." });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Zugriff verweigert. Diese Aktion ist nur für Admins." });
    }
};

const isMod = (req, res, next) => {
    if (req.user && req.user.role === 'mod') {
        next();
    } else {
        res.status(403).json({ error: "Zugriff verweigert. Diese Aktion ist nur für Moderatoren." });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isMod,
};