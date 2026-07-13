const express = require("express");
const router = express.Router();
const verifySession = require("../middleware/verifySession");
const verifyRole = require("../middleware/verifyRole");
const {
  syncUser,
  getUserByEmail,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
} = require("../controllers/userController");

router.post("/sync", syncUser);
router.get("/all", verifySession, verifyRole("admin"), getAllUsers);
router.get("/stats", verifySession, verifyRole("admin"), getAdminStats);
router.put("/:id/role", verifySession, verifyRole("admin"), updateUserRole);
router.delete("/:id", verifySession, verifyRole("admin"), deleteUser);
router.get("/:email", getUserByEmail);

module.exports = router;
