const Notification = require("../models/Notification");

// Get all notifications for the logged-in user, newest first
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      toEmail: req.dbUser.email,
    }).sort({ time: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all as read (called when the bell is opened)
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { toEmail: req.dbUser.email, read: false },
      { read: true },
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

module.exports = { getMyNotifications, markAllAsRead };
