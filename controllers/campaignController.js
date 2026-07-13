const Campaign = require("../models/Campaign");

// Public: top 6 campaigns by amount raised (approved only)
const getTopCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "approved" })
      .sort({ amount_raised: -1 })
      .limit(6);
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getTopCampaigns };