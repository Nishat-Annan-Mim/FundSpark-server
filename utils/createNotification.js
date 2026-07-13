const Notification = require("../models/Notification");

const createNotification = async ({ message, toEmail, actionRoute }) => {
  try {
    await Notification.create({
      message,
      toEmail,
      actionRoute,
      time: new Date(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

module.exports = createNotification;