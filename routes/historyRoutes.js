const express = require("express");
const router = express.Router();
const { saveHistory, getMyHistory } = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

// Require JWT authentication for all scan history endpoints
router.post("/save", protect, saveHistory);
router.get("/my", protect, getMyHistory);

module.exports = router;
