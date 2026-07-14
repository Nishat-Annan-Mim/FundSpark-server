const axios = require("axios");
const User = require("../models/User");

const verifySession = async (req, res, next) => {
  try {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No session cookie" });
    }

    const { data } = await axios.get(
      `${process.env.CLIENT_URL}/api/auth/get-session`,
      {
        headers: { cookie: cookieHeader },
      },
    );

    if (!data || !data.user) {
      return res.status(401).json({ message: "Unauthorized: Invalid session" });
    }

    req.user = data.user;

    // Attach the full DB user (with role/credits) so routes that don't need
    // role-restriction can still use req.dbUser
    const dbUser = await User.findOne({ email: data.user.email });
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error("Session verification error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = verifySession;
