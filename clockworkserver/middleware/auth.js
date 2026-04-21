const jwt = require('jsonwebtoken');

function getAccessibleDepartmentIds(user) {
  if (!user) return [];

  const ids = new Set();

  if (user.departmentId != null) {
    ids.add(String(user.departmentId));
  }

  if (Array.isArray(user.departmentIds)) {
    for (const id of user.departmentIds) {
      if (id != null) ids.add(String(id));
    }
  }

  return Array.from(ids);
}

function canAccessDepartment(user, departmentId) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (departmentId == null || departmentId === '') return false;

  return getAccessibleDepartmentIds(user).includes(String(departmentId));
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Fehlender Token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ungueltiger oder abgelaufener Token' });
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
      if (!reqDeptId) return res.status(400).json({ error: 'Fehlende departmentId' });
      if (!canAccessDepartment(req.user, reqDeptId)) {
        return res.status(403).json({ error: 'Fachbereichsuebergreifender Zugriff verweigert' });
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
  enforceDepartmentScope,
  getAccessibleDepartmentIds,
  canAccessDepartment
};
