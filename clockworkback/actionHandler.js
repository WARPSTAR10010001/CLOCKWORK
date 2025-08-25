const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Nicht eingeloggt." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Ungültiger oder abgelaufener Token." });
  }
}

function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Nicht eingeloggt." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Keine Berechtigung." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Ungültiger oder abgelaufener Token." });
  }
}

function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
}

module.exports = { requireAuth, requireAdmin, requestLogger };