const express = require("express");
const router = express.Router();
const { getTopCampaigns } = require("../controllers/campaignController");

router.get("/top", getTopCampaigns);

module.exports = router;
