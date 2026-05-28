 const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    try {
        // Check authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            console.log("TOKEN:", token);

            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            console.log("DECODED:", decoded);

            // Get user from DB
            req.user = await User.findById(decoded.id).select("-password");

            return next();
        }

        return res.status(401).json({
            error: "No token provided"
        });

    } catch (error) {
        console.log("JWT VERIFY ERROR:", error.message);

        return res.status(401).json({
            error: "Not authorized, token failed verification"
        });
    }
};

module.exports = { protect };