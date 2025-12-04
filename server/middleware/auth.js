// Authentication middleware

export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    return res.redirect('/portal/auth');
  }
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      return res.redirect('/portal/auth');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      return res.status(403).send('Access denied');
    }

    next();
  };
};

// Helper to check if user owns resource or is admin
export const requireOwnershipOrAdmin = (getUserId) => {
  return async (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.session.user.role === 'admin') {
      return next();
    }

    try {
      const resourceUserId = await getUserId(req);
      if (resourceUserId === req.session.user.participantId) {
        return next();
      }
      return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      return res.status(500).json({ message: 'Error checking ownership' });
    }
  };
};

