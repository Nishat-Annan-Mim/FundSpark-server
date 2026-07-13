const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    type: {
      type: String,
      enum: ["credit_purchase", "withdrawal"],
      required: true,
    },
    amount: { type: Number, required: true }, // dollars for purchase, dollars for withdrawal payout
    credits: { type: Number, required: true }, // credits gained or withdrawn
    transaction_id: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);