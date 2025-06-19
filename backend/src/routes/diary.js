const express = require("express");
const { body, validationResult } = require("express-validator");
const { DiaryEntry, User, InternshipProgram } = require("../models");
const { requireStudent, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Get student's diary entries
router.get("/student/:studentId", requireTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    // Teachers can only see students from their group
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (req.user.role === "teacher" && req.user.group_id !== student.group_id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const where = { student_id: studentId };
    if (start_date && end_date) {
      where.entry_date = {
        [require("sequelize").Op.between]: [start_date, end_date],
      };
    }

    const entries = await DiaryEntry.findAll({
      where,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["entry_date", "ASC"]],
    });

    res.json({ entries });
  } catch (error) {
    console.error("Get student diary error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get own diary entries (for students)
router.get("/my-diary", requireStudent, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { student_id: req.user.id };
    if (start_date && end_date) {
      where.entry_date = {
        [require("sequelize").Op.between]: [start_date, end_date],
      };
    }

    const entries = await DiaryEntry.findAll({
      where,
      include: [
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["entry_date", "ASC"]],
    });

    res.json({ entries });
  } catch (error) {
    console.error("Get my diary error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Create/Update diary entry (for students)
router.post(
  "/entry",
  requireStudent,
  [
    body("entry_date").isISO8601().toDate(),
    body("text_report").optional().isLength({ max: 5000 }),
    body("file_url").optional().isURL(),
    body("file_name").optional().isLength({ max: 255 }),
    body("file_size").optional().isInt({ min: 0, max: 5242880 }),
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

      const { entry_date, text_report, file_url, file_name, file_size } =
        req.body;

      // Check if date is within program range and not disabled
      const program = await InternshipProgram.findOne({
        where: { group_id: req.user.group_id },
      });

      if (!program) {
        return res
          .status(400)
          .json({ message: "No internship program found for your group." });
      }

      const entryDate = new Date(entry_date);
      const startDate = new Date(program.start_date);
      const endDate = new Date(program.end_date);

      if (entryDate < startDate || entryDate > endDate) {
        return res.status(400).json({
          message: "Entry date is outside the internship program period.",
        });
      }

      // Check if date is disabled
      if (program.disabled_days && program.disabled_days.includes(entry_date)) {
        return res.status(400).json({
          message:
            "Reports are not allowed for this date (holiday/non-working day).",
        });
      }

      // Check if entry already exists
      let entry = await DiaryEntry.findOne({
        where: { student_id: req.user.id, entry_date },
      });

      if (entry) {
        // Update existing entry
        await entry.update({
          text_report,
          file_url,
          file_name,
          file_size,
          is_submitted: true,
          submitted_at: new Date(),
        });
      } else {
        // Create new entry
        entry = await DiaryEntry.create({
          student_id: req.user.id,
          entry_date,
          text_report,
          file_url,
          file_name,
          file_size,
          is_submitted: true,
          submitted_at: new Date(),
        });
      }

      res.json({
        message: "Diary entry saved successfully.",
        entry,
      });
    } catch (error) {
      console.error("Create diary entry error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Mark diary entry (for teachers)
router.post(
  "/mark/:entryId",
  requireTeacher,
  [
    body("mark").isInt({ min: 0, max: 100 }),
    body("teacher_comment").optional().isLength({ max: 1000 }),
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

      const { entryId } = req.params;
      const { mark, teacher_comment } = req.body;

      const entry = await DiaryEntry.findByPk(entryId, {
        include: [
          {
            model: User,
            as: "student",
            include: [
              {
                model: require("../models/Group"),
                as: "group",
              },
            ],
          },
        ],
      });

      if (!entry) {
        return res.status(404).json({ message: "Diary entry not found." });
      }

      // Teachers can only mark entries from their group
      if (
        req.user.role === "teacher" &&
        req.user.group_id !== entry.student.group_id
      ) {
        return res.status(403).json({ message: "Access denied." });
      }

      await entry.update({
        mark,
        teacher_comment,
        teacher_id: req.user.id,
        marked_at: new Date(),
      });

      res.json({
        message: "Entry marked successfully.",
        entry,
      });
    } catch (error) {
      console.error("Mark diary entry error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Get diary entry by ID
router.get("/entry/:entryId", requireTeacher, async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await DiaryEntry.findByPk(entryId, {
      include: [
        {
          model: User,
          as: "student",
          include: [
            {
              model: require("../models/Group"),
              as: "group",
            },
          ],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found." });
    }

    // Teachers can only see entries from their group
    if (
      req.user.role === "teacher" &&
      req.user.group_id !== entry.student.group_id
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ entry });
  } catch (error) {
    console.error("Get diary entry error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get program dates for calendar
router.get("/program-dates/:groupId", requireTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Teachers can only see their own group
    if (req.user.role === "teacher" && req.user.group_id !== groupId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const program = await InternshipProgram.findOne({
      where: { group_id: groupId },
    });

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // Generate all dates between start and end
    const dates = [];
    const currentDate = new Date(program.start_date);
    const endDate = new Date(program.end_date);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dates.push({
        date: dateStr,
        is_disabled:
          program.disabled_days && program.disabled_days.includes(dateStr),
        is_weekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ dates, program });
  } catch (error) {
    console.error("Get program dates error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
