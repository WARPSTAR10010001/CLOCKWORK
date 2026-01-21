const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Fehlender Token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Kein Autorisierungskontext' });
    if (req.user.role === 'ADMIN') return next();
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Verboten' });
  };
}

function enforceDepartmentScope(getDeptIdFromRequest) {
  return (req, res, next) => {
    try {
      const reqDeptId = getDeptIdFromRequest(req);
      if (req.user.role === 'ADMIN') return next();
      if (!reqDeptId) return res.status(400).json({ error: 'Fehlende departmentId' });
      if (String(req.user.departmentId) !== String(reqDeptId)) {
        return res.status(403).json({ error: 'Fachbereichübergreifender Zugriff verweigert' });
      }
      return next();
    } catch (e) {
      return res.status(400).json({ error: 'Fachbereichsscope Fehler' });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
  enforceDepartmentScope
};