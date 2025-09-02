import jwt from "jsonwebtoken";

function requireAdmin(req, res, next) {
  checkAuth(req, res, () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Adminrechte erforderlich." });
    }
    next();
  });
}

function checkAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Kein Anmeldetoken gefunden." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Anmeldetoken ungültig oder abgelaufen." });
  }
}

function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Nicht eingeloggt" });

    const rolesHierarchy = { "user": 1, "moderator": 2, "admin": 3 };
    if (rolesHierarchy[req.user.role] >= rolesHierarchy[requiredRole]) {
      next();
    } else {
      res.status(403).json({ error: "Zugriff verweigert" });
    }
  };
}

function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
}

export { checkAuth, requireAdmin, checkRole, requestLogger };