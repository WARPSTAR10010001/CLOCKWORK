function requireLogin(req, res, next) {
    if (!req.session?.user) {
        res.status(401).json({ error: "Nicht eingeloggt." });
        return;
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session?.user.id !== 0) {
        res.status(403).json({ error: "Keine Berechtigung." });
        return;
    }
    next();
}

function errorLogger(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Serverseitiger Fehler.",
    });
    return;
}

function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
}

module.exports = { requireLogin, requireAdmin, requestLogger, errorLogger }