const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  createPaymentIntent,
  confirmCreditPurchase,
  getMyPayments,
} = require("../controllers/paymentController");

router.post(
  "/create-intent",
  verifySession,
  verifyRole("supporter"),
  createPaymentIntent,
);
router.post(
  "/confirm",
  verifySession,
  verifyRole("supporter"),
  confirmCreditPurchase,
);
router.get("/mine", verifySession, verifyRole("supporter"), getMyPayments);

module.exports = router;
