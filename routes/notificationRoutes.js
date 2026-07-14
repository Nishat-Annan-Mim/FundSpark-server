const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const {
  getMyNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");

router.get("/mine", verifySession, getMyNotifications);
router.put("/mark-read", verifySession, markAllAsRead);

module.exports = router;
