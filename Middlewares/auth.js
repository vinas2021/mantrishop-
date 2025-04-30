const jwt = require('jsonwebtoken');
const User = require('../models/userModel')

const authantication = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "You are not logged in" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        req.user = user; // Attach user to request object
       
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
// authorize
const authorize = (req, res, next) => {
    if (req.user.role === "admin") {
        next();
    } else {
        // console.log(req.user.role);
        return res.status(403).json({ message: "Unauthorized: You do not have admin privileges." });
    }
};


module.exports = { authantication, authorize };