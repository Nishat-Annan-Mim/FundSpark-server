const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  getPendingContributions,
  approveContribution,
  rejectContribution,
  createContribution,
  getApprovedContributions,
  getMyContributions,
} = require("../controllers/contributionController");

router.get(
  "/pending",
  verifySession,
  verifyRole("creator"),
  getPendingContributions,
);
router.put(
  "/:id/approve",
  verifySession,
  verifyRole("creator"),
  approveContribution,
);
router.put(
  "/:id/reject",
  verifySession,
  verifyRole("creator"),
  rejectContribution,
);

router.post("/", verifySession, verifyRole("supporter"), createContribution);
router.get(
  "/approved",
  verifySession,
  verifyRole("supporter"),
  getApprovedContributions,
);
router.get("/mine", verifySession, verifyRole("supporter"), getMyContributions);

module.exports = router;
