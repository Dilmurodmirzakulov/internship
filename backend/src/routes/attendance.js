const express = require("express");
const { body, validationResult } = require("express-validator");
const { Attendance, User, Group } = require("../models");
const { requireTeacher } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/attendance
 * Take or update attendance for a list of students for a given date.
 * Body: {
 *   date: "YYYY-MM-DD",
 *   records: [ { student_id: uuid, status: "present"|"absent"|"excused" } ]
 * }
 */
router.post(
  "/",
  requireTeacher,
  [
    body("date").isISO8601().withMessage("Valid date required"),
    body("records").isArray({ min: 1 }),
    body("records.*.student_id")
      .isUUID()
      .withMessage("student_id must be UUID"),
    body("records.*.status").isIn(["present", "absent", "excused"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { date, records } = req.body;

    try {
      // Teachers can only mark students they are assigned to (their group/s)
      if (req.user.role === "teacher") {
        // Load teacher groups
        const teacher = await User.findByPk(req.user.id, {
          include: [{ model: Group, as: "assignedGroups", attributes: ["id"] }],
        });
        const allowedGroupIds = teacher.assignedGroups.map((g) => g.id);

        // Fetch students to verify they belong to allowed groups
        const students = await User.findAll({
          where: { id: records.map((r) => r.student_id) },
          attributes: ["id", "group_id"],
        });
        for (const s of students) {
          if (!allowedGroupIds.includes(s.group_id)) {
            return res
              .status(403)
              .json({ message: "Access denied to some students." });
          }
        }
      }

      // Upsert each attendance record
      for (const r of records) {
        await Attendance.upsert({
          student_id: r.student_id,
          date,
          status: r.status,
        });
      }

      res.json({ message: "Attendance saved." });
    } catch (error) {
      console.error("Attendance save error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * GET /api/attendance/group/:groupId?date=YYYY-MM-DD
 * Fetch attendance for a group on a given date (defaults to today)
 */
router.get("/group/:groupId", requireTeacher, async (req, res) => {
  const { groupId } = req.params;
  const date = req.query.date || new Date().toISOString().split("T")[0];
  try {
    // Permission check as above
    if (req.user.role === "teacher") {
      const teacher = await User.findByPk(req.user.id, {
        include: [{ model: Group, as: "assignedGroups", attributes: ["id"] }],
      });
      const allowedGroupIds = teacher.assignedGroups.map((g) => g.id);
      if (!allowedGroupIds.includes(groupId)) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    const students = await User.findAll({
      where: { group_id: groupId, role: "student" },
      attributes: ["id", "name", "email"],
    });
    const attendanceRecords = await Attendance.findAll({
      where: { date, student_id: students.map((s) => s.id) },
    });

    const data = students.map((s) => {
      const rec = attendanceRecords.find((r) => r.student_id === s.id);
      return {
        student: s,
        status: rec ? rec.status : "absent",
      };
    });

    res.json({ date, groupId, attendance: data });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
