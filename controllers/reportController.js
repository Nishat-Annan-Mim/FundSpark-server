const Report = require("../models/Report");
const Campaign = require("../models/Campaign");

// Supporter: report a campaign
const createReport = async (req, res) => {
  try {
    const { campaign_id, reason } = req.body;
    const reporter = req.dbUser;

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const report = await Report.create({
      campaign_id,
      campaign_title: campaign.campaign_title,
      reporter_name: reporter.name,
      reporter_email: reporter.email,
      reason,
      status: "pending",
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Create report error:", error.message);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

// Admin: get all pending reports
const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: suspend the reported campaign
const suspendCampaign = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    await Campaign.findByIdAndUpdate(report.campaign_id, {
      status: "suspended",
    });
    report.status = "resolved";
    await report.save();

    res.status(200).json({ message: "Campaign suspended" });
  } catch (error) {
    res.status(500).json({ message: "Failed to suspend campaign" });
  }
};

// Admin: delete the reported campaign entirely
const deleteReportedCampaign = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const Contribution = require("../models/Contribution");
    const User = require("../models/User");

    const approvedContributions = await Contribution.find({
      campaign_id: report.campaign_id,
      status: "approved",
    });
    for (const contribution of approvedContributions) {
      await User.findOneAndUpdate(
        { email: contribution.supporter_email },
        { $inc: { credits: contribution.contribution_amount } },
      );
    }
    await Contribution.deleteMany({ campaign_id: report.campaign_id });
    await Campaign.findByIdAndDelete(report.campaign_id);

    report.status = "resolved";
    await report.save();

    res.status(200).json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
};

module.exports = {
  createReport,
  getPendingReports,
  suspendCampaign,
  deleteReportedCampaign,
};
