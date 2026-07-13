const User = require("../models/User");

const verifyRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const dbUser = await User.findOne({ email });
      if (!dbUser || !allowedRoles.includes(dbUser.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient role" });
      }

      req.dbUser = dbUser; // full user doc with credits, role, etc.
      next();
    } catch (error) {
      console.error("Role verification error:", error.message);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = verifyRole;