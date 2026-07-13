const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: { type: String, default: "" },
    role: {
      type: String,
      enum: ["supporter", "creator", "admin"],
      default: "supporter",
    },
    credits: { type: Number, default: 0 },
    creditsInitialized: { type: Boolean, default: false }, // ensures one-time signup credits
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
