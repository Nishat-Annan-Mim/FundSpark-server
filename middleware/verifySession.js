const axios = require("axios");

const verifySession = async (req, res, next) => {
  try {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return res.status(401).json({ message: "Unauthorized: No session cookie" });
    }

    // Ask the Next.js Better Auth server to validate this session
    const { data } = await axios.get(
      `${process.env.CLIENT_URL}/api/auth/get-session`,
      {
        headers: { cookie: cookieHeader },
      }
    );

    if (!data || !data.user) {
      return res.status(401).json({ message: "Unauthorized: Invalid session" });
    }

    req.user = data.user; // { id, name, email, ... }
    next();
  } catch (error) {
    console.error("Session verification error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = verifySession;