const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  getTopCampaigns,
  createCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignById,
  getExploreCampaigns,
} = require("../controllers/campaignController");

router.get("/top", getTopCampaigns);
router.get("/explore", getExploreCampaigns);
router.get(
  "/my-campaigns",
  verifySession,
  verifyRole("creator"),
  getMyCampaigns,
);
router.post("/", verifySession, verifyRole("creator"), createCampaign);
router.put("/:id", verifySession, verifyRole("creator"), updateCampaign);
router.delete("/:id", verifySession, verifyRole("creator"), deleteCampaign);
router.get("/:id", getCampaignById);

module.exports = router;
