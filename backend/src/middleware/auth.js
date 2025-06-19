const jwt = require("jsonwebtoken");
const { User } = require("../models");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: require("../models/Group"),
          as: "group",
          include: [
            {
              model: require("../models/InternshipProgram"),
              as: "program",
            },
          ],
        },
      ],
    });

    if (!user || !user.is_active) {
      return res
        .status(401)
        .json({ message: "Invalid token or user inactive." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    res.status(500).json({ message: "Server error." });
  }
};

// Role-based middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

// Specific role middlewares
const requireSuperAdmin = requireRole("super_admin");
const requireTeacher = requireRole("teacher", "super_admin");
const requireStudent = requireRole("student", "teacher", "super_admin");

module.exports = {
  auth,
  requireRole,
  requireSuperAdmin,
  requireTeacher,
  requireStudent,
};
