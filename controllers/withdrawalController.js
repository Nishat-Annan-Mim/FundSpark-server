const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const Payment = require("../models/Payment");
const createNotification = require("../utils/createNotification");

// Creator: request a withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { withdrawal_credit, payment_system, account_number } = req.body;
    const creator = req.dbUser;

    if (withdrawal_credit < 200) {
      return res.status(400).json({
        message: "Minimum withdrawal is 200 credits ($10)",
      });
    }
    if (withdrawal_credit > creator.credits) {
      return res.status(400).json({ message: "Insufficient raised credits" });
    }

    const withdrawal_amount = withdrawal_credit / 20; // 20 credits = $1

    const withdrawal = await Withdrawal.create({
      creator_email: creator.email,
      creator_name: creator.name,
      withdrawal_credit,
      withdrawal_amount,
      payment_system,
      account_number,
      status: "pending",
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error("Withdrawal request error:", error.message);
    res.status(500).json({ message: "Failed to request withdrawal" });
  }
};

// Creator: get their withdrawal requests (payment history)
const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      creator_email: req.dbUser.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all pending withdrawal requests
const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: mark withdrawal as paid
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    withdrawal.status = "approved";
    await withdrawal.save();

    await User.findOneAndUpdate(
      { email: withdrawal.creator_email },
      { $inc: { credits: -withdrawal.withdrawal_credit } },
    );

    await Payment.create({
      user_email: withdrawal.creator_email,
      type: "withdrawal",
      amount: withdrawal.withdrawal_amount,
      credits: withdrawal.withdrawal_credit,
      status: "completed",
    });

    await createNotification({
      message: `Your withdrawal of $${withdrawal.withdrawal_amount} has been processed`,
      toEmail: withdrawal.creator_email,
      actionRoute: "/dashboard/payment-history",
    });

    res.status(200).json(withdrawal);
  } catch (error) {
    console.error("Approve withdrawal error:", error.message);
    res.status(500).json({ message: "Failed to approve withdrawal" });
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
  getPendingWithdrawals,
  approveWithdrawal,
};
