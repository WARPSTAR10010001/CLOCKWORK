const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No auth context' });
    if (req.user.role === 'ADMIN') return next(); // Admin darf alles
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// Nutze diese Helper, um Department-Isolation zentral zu erzwingen
function enforceDepartmentScope(getDeptIdFromRequest) {
  return (req, res, next) => {
    try {
      const reqDeptId = getDeptIdFromRequest(req);
      if (req.user.role === 'ADMIN') return next(); // Admin ist global
      if (!reqDeptId) return res.status(400).json({ error: 'Missing departmentId' });
      if (String(req.user.departmentId) !== String(reqDeptId)) {
        return res.status(403).json({ error: 'Cross-department access denied' });
      }
      return next();
    } catch (e) {
      return res.status(400).json({ error: 'Department scope error' });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
  enforceDepartmentScope
};