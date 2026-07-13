const User = require("../models/User");

// Called right after Better Auth creates the account (client-side triggers this)
const syncUser = async (req, res) => {
  try {
    const { name, email, photoURL, role } = req.body;

    let existingUser = await User.findOne({ email });

    if (existingUser) {
      // User already synced (e.g. logging in again via Google) — don't re-grant credits
      return res.status(200).json(existingUser);
    }

    const startingCredits = role === "creator" ? 20 : 50;

    const newUser = await User.create({
      name,
      email,
      photoURL: photoURL || "",
      role: role || "supporter",
      credits: startingCredits,
      creditsInitialized: true,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Sync user error:", error.message);
    res.status(500).json({ message: "Failed to sync user" });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { syncUser, getUserByEmail };
