const express = require("express");
const router = express.Router();
const { getAllUsers, getAllHistory, deleteUser } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/adminMiddleware");

// Protect all admin endpoints with authentication and admin role checks
router.use(protect, verifyAdmin);

router.get("/users", getAllUsers);
router.get("/history", getAllHistory);
router.delete("/user/:id", deleteUser);

module.exports = router;
