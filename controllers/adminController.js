const User = require("../models/User");
const ScanHistory = require("../models/ScanHistory");

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.json(users);
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// @desc    Get all scan history in the system
// @route   GET /api/admin/history
// @access  Private/Admin
const getAllHistory = async (req, res) => {
    try {
        const history = await ScanHistory.find()
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });
        return res.json(history);
    } catch (error) {
        console.error("Get all history error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a user and their scan history
// @route   DELETE /api/admin/user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Prevent admin from deleting themselves (self-deletion guard)
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: "Self-deletion is not permitted" });
        }

        // Delete associated scan history
        await ScanHistory.deleteMany({ userId: id });

        // Delete user
        await User.findByIdAndDelete(id);

        return res.json({ message: "User and associated scan history deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getAllHistory,
    deleteUser
};
