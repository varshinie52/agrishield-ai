const User = require("../models/User");
const { generateToken } = require("../config/jwt");

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verify inputs
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please provide name, email, and password" });
        }

        // Email duplicate check
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        // Create new user (pre-save hook will hash password)
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // Verify email exists
        const user = await User.findOne({ email });
        
        // Compare password using matchPassword schema method
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get logged in user details
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        // req.user has already been populated in protect middleware (with password excluded)
        res.json(req.user);
    } catch (error) {
        console.error("Get Profile error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getProfile
};
