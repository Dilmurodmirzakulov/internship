const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
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
          .json({ message: "Invalid credentials or user inactive." });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Change password (for all users)
router.post(
  "/change-password",
  auth,
  [
    body("currentPassword").isLength({ min: 6 }),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }

      await user.update({ password: newPassword });

      res.json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Reset password (Super Admin only)
router.post(
  "/reset-password",
  auth,
  [body("userId").isUUID(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation error",
          errors: errors.array(),
        });
      }

      if (req.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Super admin only." });
      }

      const { userId, newPassword } = req.body;

      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found." });
      }

      await targetUser.update({ password: newPassword });

      res.json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Logout (client-side token removal)
router.post("/logout", auth, (req, res) => {
  res.json({ message: "Logout successful." });
});

module.exports = router;
