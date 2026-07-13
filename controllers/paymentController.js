const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/Payment");
const User = require("../models/User");

const creditPackages = {
  100: 10,
  300: 25,
  800: 60,
  1500: 110,
};

// Create a Stripe PaymentIntent for a chosen credit package
const createPaymentIntent = async (req, res) => {
  try {
    const { credits } = req.body;
    const priceUSD = creditPackages[credits];

    if (!priceUSD) {
      return res.status(400).json({ message: "Invalid credit package" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceUSD * 100, // Stripe expects cents
      currency: "usd",
      metadata: {
        user_email: req.dbUser.email,
        credits: String(credits),
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Create payment intent error:", error.message);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
};

// Called after successful Stripe confirmation on the client
const confirmCreditPurchase = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const { user_email, credits } = paymentIntent.metadata;
    const creditsNum = Number(credits);

    // Avoid double-crediting if this payment was already recorded
    const existing = await Payment.findOne({ transaction_id: paymentIntentId });
    if (existing) {
      return res.status(200).json({ message: "Already processed" });
    }

    await User.findOneAndUpdate(
      { email: user_email },
      { $inc: { credits: creditsNum } },
    );

    await Payment.create({
      user_email,
      type: "credit_purchase",
      amount: paymentIntent.amount / 100,
      credits: creditsNum,
      transaction_id: paymentIntentId,
      status: "completed",
    });

    res.status(200).json({ message: "Credits added successfully" });
  } catch (error) {
    console.error("Confirm purchase error:", error.message);
    res.status(500).json({ message: "Failed to confirm purchase" });
  }
};

// Supporter: get their credit purchase history
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      user_email: req.dbUser.email,
      type: "credit_purchase",
    }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPaymentIntent,
  confirmCreditPurchase,
  getMyPayments,
};
