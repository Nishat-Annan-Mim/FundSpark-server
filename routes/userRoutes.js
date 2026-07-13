const express = require("express");
const router = express.Router();
const { syncUser, getUserByEmail } = require("../controllers/userController");

router.post("/sync", syncUser);
router.get("/:email", getUserByEmail);

module.exports = router;