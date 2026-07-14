const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  createReport,
  getPendingReports,
  suspendCampaign,
  deleteReportedCampaign,
} = require("../controllers/reportController");

router.post("/", verifySession, verifyRole("supporter"), createReport);
router.get("/pending", verifySession, verifyRole("admin"), getPendingReports);
router.put("/:id/suspend", verifySession, verifyRole("admin"), suspendCampaign);
router.delete(
  "/:id/delete-campaign",
  verifySession,
  verifyRole("admin"),
  deleteReportedCampaign,
);

module.exports = router;
