const express = require("express");
const { body, validationResult } = require("express-validator");
const { InternshipProgram, Group } = require("../models");
const { requireSuperAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Get all programs
router.get("/", requireTeacher, async (req, res) => {
  try {
    const programs = await InternshipProgram.findAll({
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ programs });
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get program by ID
router.get("/:id", requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const program = await InternshipProgram.findByPk(id, {
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // Teachers can only see programs from their group
    if (req.user.role === "teacher" && req.user.group_id !== program.group_id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ program });
  } catch (error) {
    console.error("Get program error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Create program (Super Admin only)
router.post(
  "/",
  requireSuperAdmin,
  [
    body("name").isLength({ min: 2, max: 200 }),
    body("description").optional().isLength({ max: 1000 }),
    body("start_date").isISO8601().toDate(),
    body("end_date").isISO8601().toDate(),
    body("group_id").isUUID(),
    body("disabled_days").optional().isArray(),
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

      const {
        name,
        description,
        start_date,
        end_date,
        group_id,
        disabled_days = [],
      } = req.body;

      // Check if group exists
      const group = await Group.findByPk(group_id);
      if (!group) {
        return res.status(400).json({ message: "Group not found." });
      }

      // Check if group already has a program
      const existingProgram = await InternshipProgram.findOne({
        where: { group_id },
      });
      if (existingProgram) {
        return res
          .status(400)
          .json({ message: "Group already has an internship program." });
      }

      // Validate dates
      if (new Date(start_date) >= new Date(end_date)) {
        return res
          .status(400)
          .json({ message: "End date must be after start date." });
      }

      const program = await InternshipProgram.create({
        name,
        description,
        start_date,
        end_date,
        group_id,
        disabled_days,
      });

      res.status(201).json({
        message: "Program created successfully.",
        program,
      });
    } catch (error) {
      console.error("Create program error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Update program (Super Admin only)
router.put(
  "/:id",
  requireSuperAdmin,
  [
    body("name").optional().isLength({ min: 2, max: 200 }),
    body("description").optional().isLength({ max: 1000 }),
    body("start_date").optional().isISO8601().toDate(),
    body("end_date").optional().isISO8601().toDate(),
    body("disabled_days").optional().isArray(),
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

      const program = await InternshipProgram.findByPk(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }

      // Validate dates if both are provided
      if (updateData.start_date && updateData.end_date) {
        if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
          return res
            .status(400)
            .json({ message: "End date must be after start date." });
        }
      }

      await program.update(updateData);

      res.json({
        message: "Program updated successfully.",
        program,
      });
    } catch (error) {
      console.error("Update program error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Delete program (Super Admin only)
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const program = await InternshipProgram.findByPk(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    await program.destroy();

    res.json({ message: "Program deleted successfully." });
  } catch (error) {
    console.error("Delete program error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get program by group ID
router.get("/group/:groupId", requireTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Teachers can only see programs from their group
    if (req.user.role === "teacher" && req.user.group_id !== groupId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const program = await InternshipProgram.findOne({
      where: { group_id: groupId },
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!program) {
      return res
        .status(404)
        .json({ message: "Program not found for this group." });
    }

    res.json({ program });
  } catch (error) {
    console.error("Get group program error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
