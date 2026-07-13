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

// Admin: get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: update a user's role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["admin", "creator", "supporter"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to update role" });
  }
};

// Admin: remove a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Admin: platform stats for admin-home
const getAdminStats = async (req, res) => {
  try {
    const totalSupporters = await User.countDocuments({ role: "supporter" });
    const totalCreators = await User.countDocuments({ role: "creator" });
    const creditsAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$credits" } } },
    ]);
    const totalCredits = creditsAgg[0]?.total || 0;
    const Payment = require("../models/Payment");
    const totalPayments = await Payment.countDocuments();

    res.status(200).json({
      totalSupporters,
      totalCreators,
      totalCredits,
      totalPayments,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  syncUser,
  getUserByEmail,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
};
