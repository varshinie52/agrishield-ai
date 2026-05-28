const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({
        error: "Access denied. Admin authorization required."
    });
};

module.exports = { verifyAdmin };
