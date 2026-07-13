const Campaign = require("../models/Campaign");
const Contribution = require("../models/Contribution");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

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

// Creator: add a new campaign (status defaults to pending)
const createCampaign = async (req, res) => {
  try {
    const {
      campaign_title,
      campaign_story,
      category,
      funding_goal,
      minimum_contribution,
      deadline,
      reward_info,
      campaign_image_url,
    } = req.body;

    const creator = req.dbUser; // set by verifyRole middleware

    const campaign = await Campaign.create({
      campaign_title,
      campaign_story,
      category,
      funding_goal,
      minimum_contribution,
      deadline,
      reward_info,
      campaign_image_url,
      creator_name: creator.name,
      creator_email: creator.email,
      status: "pending",
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error("Create campaign error:", error.message);
    res.status(500).json({ message: "Failed to create campaign" });
  }
};

// Creator: get their own campaigns, sorted by deadline descending
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      creator_email: req.dbUser.email,
    }).sort({ deadline: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Creator: update limited fields
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { campaign_title, campaign_story, reward_info } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.creator_email !== req.dbUser.email) {
      return res.status(403).json({ message: "Not your campaign" });
    }

    campaign.campaign_title = campaign_title ?? campaign.campaign_title;
    campaign.campaign_story = campaign_story ?? campaign.campaign_story;
    campaign.reward_info = reward_info ?? campaign.reward_info;
    await campaign.save();

    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to update campaign" });
  }
};

// Creator: delete campaign + refund all approved supporters
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.creator_email !== req.dbUser.email) {
      return res.status(403).json({ message: "Not your campaign" });
    }

    // Refund all approved contributions back to supporters
    const approvedContributions = await Contribution.find({
      campaign_id: id,
      status: "approved",
    });

    for (const contribution of approvedContributions) {
      await User.findOneAndUpdate(
        { email: contribution.supporter_email },
        { $inc: { credits: contribution.contribution_amount } },
      );
    }

    await Contribution.deleteMany({ campaign_id: id });
    await Campaign.findByIdAndDelete(id);

    res.status(200).json({ message: "Campaign deleted and refunds issued" });
  } catch (error) {
    console.error("Delete campaign error:", error.message);
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

// Single campaign details (public)
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Public/Supporter: all approved campaigns with deadline not passed
const getExploreCampaigns = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = {
      status: "approved",
      deadline: { $gte: new Date() },
    };

    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.campaign_title = { $regex: search, $options: "i" };
    }

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all pending campaigns
const getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: approve a campaign
const approveCampaignAdmin = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    campaign.status = "approved";
    await campaign.save();

    await createNotification({
      message: `Your campaign "${campaign.campaign_title}" has been approved and is now live`,
      toEmail: campaign.creator_email,
      actionRoute: "/dashboard/my-campaigns",
    });

    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to approve campaign" });
  }
};

// Admin: reject a campaign
const rejectCampaignAdmin = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    campaign.status = "rejected";
    await campaign.save();

    await createNotification({
      message: `Your campaign "${campaign.campaign_title}" was rejected by the admin`,
      toEmail: campaign.creator_email,
      actionRoute: "/dashboard/my-campaigns",
    });

    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to reject campaign" });
  }
};

// Admin: get ALL campaigns (for Manage Campaigns)
const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete any campaign
const deleteCampaignAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const approvedContributions = await Contribution.find({
      campaign_id: id,
      status: "approved",
    });
    for (const contribution of approvedContributions) {
      await User.findOneAndUpdate(
        { email: contribution.supporter_email },
        { $inc: { credits: contribution.contribution_amount } },
      );
    }
    await Contribution.deleteMany({ campaign_id: id });
    await Campaign.findByIdAndDelete(id);

    res.status(200).json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

module.exports = {
  getTopCampaigns,
  createCampaign,
  getMyCampaigns,
  updateCampaign,
  deleteCampaign,
  getCampaignById,
  getExploreCampaigns,
  getPendingCampaigns,
  approveCampaignAdmin,
  rejectCampaignAdmin,
  getAllCampaigns,
  deleteCampaignAdmin,
};
