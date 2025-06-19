const express = require("express");
const { body, validationResult } = require("express-validator");
const { Group, User, InternshipProgram } = require("../models");
const { requireSuperAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Get all groups
router.get("/", requireTeacher, async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: User,
          as: "students",
          attributes: ["id", "name", "email", "is_active"],
        },
        {
          model: User,
          as: "teachers",
          attributes: ["id", "name", "email", "is_active"],
        },
        {
          model: InternshipProgram,
          as: "program",
          attributes: ["id", "name", "start_date", "end_date", "is_active"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ groups });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get group by ID
router.get("/:id", requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: "students",
          attributes: ["id", "name", "email", "is_active", "last_login"],
        },
        {
          model: User,
          as: "teachers",
          attributes: ["id", "name", "email", "is_active", "last_login"],
        },
        {
          model: InternshipProgram,
          as: "program",
          attributes: [
            "id",
            "name",
            "description",
            "start_date",
            "end_date",
            "disabled_days",
            "is_active",
          ],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Teachers can only see their own group
    if (req.user.role === "teacher" && req.user.group_id !== id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ group });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Create group (Super Admin only)
router.post(
  "/",
  requireSuperAdmin,
  [
    body("name").isLength({ min: 2, max: 100 }),
    body("description").optional().isLength({ max: 500 }),
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

      const { name, description } = req.body;

      const group = await Group.create({
        name,
        description,
      });

      res.status(201).json({
        message: "Group created successfully.",
        group,
      });
    } catch (error) {
      console.error("Create group error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Update group (Super Admin only)
router.put(
  "/:id",
  requireSuperAdmin,
  [
    body("name").optional().isLength({ min: 2, max: 100 }),
    body("description").optional().isLength({ max: 500 }),
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

      const group = await Group.findByPk(id);
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }

      await group.update(updateData);

      res.json({
        message: "Group updated successfully.",
        group,
      });
    } catch (error) {
      console.error("Update group error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Delete group (Super Admin only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: "students",
        },
        {
          model: User,
          as: "teachers",
        },
      ],
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Check if group has users
    if (group.students.length > 0 || group.teachers.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete group with assigned users. Please reassign users first.",
      });
    }

    await group.destroy();

    res.json({ message: "Group deleted successfully." });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
