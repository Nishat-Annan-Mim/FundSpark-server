const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  requestWithdrawal,
  getMyWithdrawals,
  getPendingWithdrawals,
  approveWithdrawal,
} = require("../controllers/withdrawalController");

router.post("/", verifySession, verifyRole("creator"), requestWithdrawal);
router.get("/mine", verifySession, verifyRole("creator"), getMyWithdrawals);
router.get(
  "/pending",
  verifySession,
  verifyRole("admin"),
  getPendingWithdrawals,
);
router.put(
  "/:id/approve",
  verifySession,
  verifyRole("admin"),
  approveWithdrawal,
);

module.exports = router;
