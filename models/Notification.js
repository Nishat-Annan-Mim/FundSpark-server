const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    toEmail: { type: String, required: true },
    actionRoute: { type: String, required: true },
    time: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
