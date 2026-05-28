const ScanHistory = require("../models/ScanHistory");

// @desc    Save prediction scan history
// @route   POST /api/history/save
// @access  Private
const saveHistory = async (req, res) => {
    try {
        const { imageUrl, imageBase64, predictionResult, confidenceScore } = req.body;

        if (!predictionResult) {
            return res.status(400).json({ error: "Prediction result is required" });
        }

        // Create new history entry linked to logged-in user
        const newHistory = await ScanHistory.create({
            userId: req.user._id,
            imageUrl,
            imageBase64,
            predictionResult,
            confidenceScore
        });

        return res.status(201).json(newHistory);
    } catch (error) {
        console.error("Save scan history error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// @desc    Get logged-in user's scan history
// @route   GET /api/history/my
// @access  Private
const getMyHistory = async (req, res) => {
    try {
        const history = await ScanHistory.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        return res.json(history);
    } catch (error) {
        console.error("Get user scan history error:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    saveHistory,
    getMyHistory
};
