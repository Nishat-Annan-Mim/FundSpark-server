const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!allowedRoles.includes(req.dbUser.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
};

module.exports = verifyRole;
