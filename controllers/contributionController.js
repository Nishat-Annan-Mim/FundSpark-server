const Contribution = require("../models/Contribution");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

// Creator: get pending contributions for their campaigns
const getPendingContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({
      creator_email: req.dbUser.email,
      status: "pending",
    }).sort({ createdAt: -1 });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Creator: approve a contribution
const approveContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found" });
    }
    if (contribution.creator_email !== req.dbUser.email) {
      return res.status(403).json({ message: "Not your campaign's contribution" });
    }
    if (contribution.status !== "pending") {
      return res.status(400).json({ message: "Contribution already processed" });
    }

    contribution.status = "approved";
    await contribution.save();

    await Campaign.findByIdAndUpdate(contribution.campaign_id, {
      $inc: { amount_raised: contribution.contribution_amount },
    });

    await createNotification({
      message: `Your contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was approved by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: "/dashboard/supporter-home",
    });

    res.status(200).json(contribution);
  } catch (error) {
    console.error("Approve contribution error:", error.message);
    res.status(500).json({ message: "Failed to approve contribution" });
  }
};

// Creator: reject a contribution (refund supporter's credits)
const rejectContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found" });
    }
    if (contribution.creator_email !== req.dbUser.email) {
      return res.status(403).json({ message: "Not your campaign's contribution" });
    }
    if (contribution.status !== "pending") {
      return res.status(400).json({ message: "Contribution already processed" });
    }

    contribution.status = "rejected";
    await contribution.save();

    await User.findOneAndUpdate(
      { email: contribution.supporter_email },
      { $inc: { credits: contribution.contribution_amount } }
    );

    await createNotification({
      message: `Your contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was rejected by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: "/dashboard/supporter-home",
    });

    res.status(200).json(contribution);
  } catch (error) {
    console.error("Reject contribution error:", error.message);
    res.status(500).json({ message: "Failed to reject contribution" });
  }
};

// Supporter: create a new contribution
const createContribution = async (req, res) => {
  try {
    const { campaign_id, contribution_amount, message } = req.body;
    const supporter = req.dbUser;

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (contribution_amount < campaign.minimum_contribution) {
      return res.status(400).json({
        message: `Minimum contribution is ${campaign.minimum_contribution} credits`,
      });
    }
    if (supporter.credits < contribution_amount) {
      return res.status(400).json({ message: "Insufficient credits" });
    }

    // Deduct credits immediately (held until approved/rejected)
    await User.findByIdAndUpdate(supporter._id, {
      $inc: { credits: -contribution_amount },
    });

    const contribution = await Contribution.create({
      campaign_id,
      campaign_title: campaign.campaign_title,
      contribution_amount,
      supporter_email: supporter.email,
      supporter_name: supporter.name,
      creator_name: campaign.creator_name,
      creator_email: campaign.creator_email,
      message: message || "",
      status: "pending",
    });

    await createNotification({
      message: `${supporter.name} contributed ${contribution_amount} credits to ${campaign.campaign_title}`,
      toEmail: campaign.creator_email,
      actionRoute: "/dashboard/creator-home",
    });

    res.status(201).json(contribution);
  } catch (error) {
    console.error("Create contribution error:", error.message);
    res.status(500).json({ message: "Failed to create contribution" });
  }
};

// Supporter: get their approved contributions
const getApprovedContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({
      supporter_email: req.dbUser.email,
      status: "approved",
    }).sort({ createdAt: -1 });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Supporter: get ALL their contributions, paginated
const getMyContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [contributions, total] = await Promise.all([
      Contribution.find({ supporter_email: req.dbUser.email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Contribution.countDocuments({ supporter_email: req.dbUser.email }),
    ]);

    res.status(200).json({
      contributions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getPendingContributions,
  approveContribution,
  rejectContribution,
  createContribution,
  getApprovedContributions,
  getMyContributions,
};