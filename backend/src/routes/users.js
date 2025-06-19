const express = require("express");
const { body, validationResult } = require("express-validator");
const { User, Group } = require("../models");
const { requireSuperAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Get all users (Super Admin only)
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    const { role, group_id, page = 1, limit = 10 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (group_id) where.group_id = group_id;

    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where,
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get users by group (Teachers can see their group students)
router.get("/group/:groupId", requireTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { role } = req.query;

    // Teachers can only see their own group
    if (req.user.role === "teacher" && req.user.group_id !== groupId) {
      return res
        .status(403)
        .json({ message: "Access denied. You can only view your own group." });
    }

    const where = { group_id: groupId };
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
      order: [["name", "ASC"]],
    });

    res.json({ users });
  } catch (error) {
    console.error("Get group users error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Create user (Super Admin only)
router.post(
  "/",
  requireSuperAdmin,
  [
    body("name").isLength({ min: 2, max: 100 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["teacher", "student"]),
    body("group_id").optional().isUUID(),
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

      const { name, email, password, role, group_id } = req.body;

      // Check if group exists if provided
      if (group_id) {
        const group = await Group.findByPk(group_id);
        if (!group) {
          return res.status(400).json({ message: "Group not found." });
        }
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        group_id,
      });

      res.status(201).json({
        message: "User created successfully.",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Update user (Super Admin only)
router.put(
  "/:id",
  requireSuperAdmin,
  [
    body("name").optional().isLength({ min: 2, max: 100 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("role").optional().isIn(["teacher", "student"]),
    body("group_id").optional().isUUID(),
    body("is_active").optional().isBoolean(),
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

      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Check if group exists if provided
      if (updateData.group_id) {
        const group = await Group.findByPk(updateData.group_id);
        if (!group) {
          return res.status(400).json({ message: "Group not found." });
        }
      }

      await user.update(updateData);

      res.json({
        message: "User updated successfully.",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Delete user (Super Admin only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prevent deleting super admin
    if (user.role === "super_admin") {
      return res
        .status(400)
        .json({ message: "Cannot delete super admin user." });
    }

    await user.destroy();

    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get user by ID
router.get("/:id", requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Teachers can only see users from their group
    if (req.user.role === "teacher" && req.user.group_id !== user.group_id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
