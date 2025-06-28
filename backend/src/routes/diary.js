const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const { DiaryEntry, User, InternshipProgram } = require("../models");
const NotificationService = require("../services/notificationService");
const { requireStudent, requireTeacher } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5242880, // 5MB
    files: 1,
  },
});

/**
 * @swagger
 * /api/diary/student/{studentId}:
 *   get:
 *     summary: Get diary entries for a specific student (Teachers only)
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering entries (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering entries (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Student diary entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/DiaryEntry'
 *                       - type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           teacher:
 *                             $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Teacher or Super admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/student/:studentId", requireTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    // Teachers can only see students from their assigned groups
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Check if teacher has access to this student
    if (req.user.role === "teacher") {
      // Get teacher's assigned groups
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: require("../models/Group"),
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      if (!assignedGroupIds.includes(student.group_id)) {
        return res.status(403).json({ message: "Access denied." });
      }
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

/**
 * @swagger
 * /api/diary/my-entries:
 *   get:
 *     summary: Get student's own diary entries
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering entries (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering entries (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Diary entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiaryEntry'
 *       401:
 *         description: Unauthorized - Student only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my-entries", requireStudent, async (req, res) => {
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

/**
 * @swagger
 * /api/diary/entry:
 *   post:
 *     summary: Create or update a diary entry
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - entry_date
 *             properties:
 *               entry_date:
 *                 type: string
 *                 format: date
 *                 description: Date of the diary entry (YYYY-MM-DD)
 *               text_report:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Text content of the diary entry
 *               is_submitted:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to submit the entry or save as draft
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Optional file attachment (images, PDF, Word docs, text files, max 5MB)
 *     responses:
 *       200:
 *         description: Diary entry saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Diary entry saved successfully."
 *                 entry:
 *                   $ref: '#/components/schemas/DiaryEntry'
 *       400:
 *         description: Validation error or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Student only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/entry",
  requireStudent,
  upload.single("file"),
  [
    body("entry_date").isISO8601().toDate(),
    body("text_report").optional().isLength({ max: 5000 }),
    body("is_submitted").optional().isBoolean(),
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

      const { entry_date, text_report, is_submitted = true } = req.body;

      // Handle file upload
      let file_url = null;
      let file_name = null;
      let file_size = null;

      if (req.file) {
        file_url = `/uploads/${req.file.filename}`;
        file_name = req.file.originalname;
        file_size = req.file.size;
      }

      // Check if date is within any program range and not disabled
      const programs = await InternshipProgram.findAll({
        include: [
          {
            model: require("../models/Group"),
            as: "assignedGroups",
            attributes: ["id"],
            through: { attributes: [] },
            where: { id: req.user.group_id },
            required: false,
          },
        ],
        where: {
          [require("sequelize").Op.or]: [
            { group_id: req.user.group_id },
            { "$assignedGroups.id$": req.user.group_id },
          ],
          is_active: true,
        },
      });

      if (!programs || programs.length === 0) {
        return res.status(400).json({
          message: "No active internship programs found for your group.",
        });
      }

      const entryDate = new Date(entry_date);
      const entryDateStr = entry_date; // Keep as string for comparison
      const dayOfWeek = entryDate
        .toLocaleDateString("en-US", {
          weekday: "long",
        })
        .toLowerCase();

      // Check if the date falls within any program's range and is not disabled
      let isValidDate = false;
      let isDisabledDate = false;

      for (const program of programs) {
        const startDate = new Date(program.start_date);
        const endDate = new Date(program.end_date);

        // Check if date is within this program's range
        if (entryDate >= startDate && entryDate <= endDate) {
          isValidDate = true;

          // Check if date is disabled in this program
          if (
            program.disabled_days &&
            program.disabled_days.includes(dayOfWeek)
          ) {
            isDisabledDate = true;
          }
        }
      }

      if (!isValidDate) {
        return res.status(400).json({
          message: "Entry date is outside all internship program periods.",
        });
      }

      if (isDisabledDate) {
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
        // Update existing entry (only if not submitted or saving as draft)
        if (!entry.is_submitted || !is_submitted) {
          await entry.update({
            text_report,
            file_url,
            file_name,
            file_size,
            is_submitted,
            submitted_at: is_submitted ? new Date() : entry.submitted_at,
          });
        } else {
          return res.status(400).json({
            message: "Cannot modify a submitted entry.",
          });
        }
      } else {
        // Create new entry
        entry = await DiaryEntry.create({
          student_id: req.user.id,
          entry_date,
          text_report,
          file_url,
          file_name,
          file_size,
          is_submitted,
          submitted_at: is_submitted ? new Date() : null,
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

// Update diary entry by ID (for students)
router.put(
  "/entry/:entryId",
  requireStudent,
  upload.single("file"),
  [
    body("entry_date").optional().isISO8601().toDate(),
    body("text_report").optional().isLength({ max: 5000 }),
    body("is_submitted").optional().isBoolean(),
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
      const { entry_date, text_report, is_submitted } = req.body;

      // Handle file upload
      let file_url = null;
      let file_name = null;
      let file_size = null;

      if (req.file) {
        file_url = `/uploads/${req.file.filename}`;
        file_name = req.file.originalname;
        file_size = req.file.size;
      }

      const entry = await DiaryEntry.findOne({
        where: {
          id: entryId,
          student_id: req.user.id,
        },
      });

      if (!entry) {
        return res.status(404).json({ message: "Diary entry not found." });
      }

      // Check if entry can be modified
      if (entry.is_submitted && is_submitted !== false) {
        return res.status(400).json({
          message: "Cannot modify a submitted entry.",
        });
      }

      const updateData = {};
      if (entry_date !== undefined) updateData.entry_date = entry_date;
      if (text_report !== undefined) updateData.text_report = text_report;

      // Only update file data if a new file was uploaded
      if (req.file) {
        updateData.file_url = file_url;
        updateData.file_name = file_name;
        updateData.file_size = file_size;
      }

      if (is_submitted !== undefined) {
        updateData.is_submitted = is_submitted;
        updateData.submitted_at = is_submitted ? new Date() : null;
      }

      await entry.update(updateData);

      res.json({
        message: "Diary entry updated successfully.",
        entry,
      });
    } catch (error) {
      console.error("Update diary entry error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * @swagger
 * /api/diary/mark/{entryId}:
 *   post:
 *     summary: Mark and provide feedback on a diary entry (Teachers only)
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Diary entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mark
 *             properties:
 *               mark:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Grade/mark for the diary entry
 *               teacher_comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Teacher's feedback comment
 *     responses:
 *       200:
 *         description: Entry marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Entry marked successfully."
 *                 entry:
 *                   $ref: '#/components/schemas/DiaryEntry'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Teacher or Super admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Diary entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

      // Teachers can only mark entries from their assigned groups
      if (req.user.role === "teacher") {
        // Get teacher's assigned groups
        const teacherWithGroups = await User.findByPk(req.user.id, {
          include: [
            {
              model: require("../models/Group"),
              as: "assignedGroups",
              attributes: ["id"],
            },
          ],
        });

        const assignedGroupIds = teacherWithGroups.assignedGroups.map(
          (g) => g.id
        );

        if (!assignedGroupIds.includes(entry.student.group_id)) {
          return res.status(403).json({ message: "Access denied." });
        }
      }

      await entry.update({
        mark,
        teacher_comment,
        teacher_id: req.user.id,
        marked_at: new Date(),
      });

      // Send notification to student
      try {
        await NotificationService.notifyEntryMarked(entry);
      } catch (notificationError) {
        console.error(
          "Failed to send marking notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

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

/**
 * @swagger
 * /api/diary/entry/{date}:
 *   get:
 *     summary: Get diary entry by specific date (Students only)
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Entry date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Diary entry retrieved successfully (null if not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entry:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/DiaryEntry'
 *                     - type: 'null'
 *       401:
 *         description: Unauthorized - Student only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/entry/:date", requireStudent, async (req, res) => {
  try {
    const { date } = req.params;

    const entry = await DiaryEntry.findOne({
      where: {
        student_id: req.user.id,
        entry_date: date,
      },
      include: [
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({ entry });
  } catch (error) {
    console.error("Get diary entry error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get diary entry by ID (for teachers)
router.get("/entry-by-id/:entryId", requireTeacher, async (req, res) => {
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

    // Teachers can only see entries from their assigned groups
    if (req.user.role === "teacher") {
      // Get teacher's assigned groups
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: require("../models/Group"),
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      if (!assignedGroupIds.includes(entry.student.group_id)) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    res.json({ entry });
  } catch (error) {
    console.error("Get diary entry error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get program dates for calendar
router.get("/program-dates/:groupId", requireStudent, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Students and teachers can only see their own group
    // Super admins can see any group
    if (req.user.role !== "super_admin" && req.user.group_id !== groupId) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Find programs that are assigned to this group (either via group_id or assignedGroups)
    const programs = await InternshipProgram.findAll({
      include: [
        {
          model: require("../models/Group"),
          as: "assignedGroups",
          attributes: ["id", "name"],
          through: { attributes: [] },
          where: { id: groupId },
          required: false,
        },
      ],
      where: {
        [require("sequelize").Op.or]: [
          { group_id: groupId },
          { "$assignedGroups.id$": groupId },
        ],
        is_active: true,
      },
    });

    if (!programs || programs.length === 0) {
      return res
        .status(404)
        .json({ message: "No active programs found for this group." });
    }

    // Merge dates from all programs for this group
    const allDates = new Map();
    const programInfo = [];

    for (const program of programs) {
      programInfo.push({
        id: program.id,
        name: program.name,
        description: program.description,
        start_date: program.start_date,
        end_date: program.end_date,
      });

      // Generate all dates between start and end for this program
      const currentDate = new Date(program.start_date);
      const endDate = new Date(program.end_date);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayOfWeek = currentDate
          .toLocaleDateString("en-US", {
            weekday: "long",
          })
          .toLowerCase();

        const isDisabled =
          program.disabled_days && program.disabled_days.includes(dayOfWeek);
        const isWeekend =
          currentDate.getDay() === 0 || currentDate.getDay() === 6;

        // If date already exists, merge the disabled status (if any program disables it, it's disabled)
        if (allDates.has(dateStr)) {
          const existingDate = allDates.get(dateStr);
          existingDate.is_disabled = existingDate.is_disabled || isDisabled;
          existingDate.programs.push(program.name);
        } else {
          allDates.set(dateStr, {
            date: dateStr,
            is_disabled: isDisabled,
            is_weekend: isWeekend,
            programs: [program.name],
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Convert Map to array and sort by date
    const dates = Array.from(allDates.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({ dates, programs: programInfo });
  } catch (error) {
    console.error("Get program dates error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/diary/analytics:
 *   get:
 *     summary: Get diary analytics for admin reports
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back for analytics
 *     responses:
 *       200:
 *         description: Diary analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEntries:
 *                   type: integer
 *                 submittedEntries:
 *                   type: integer
 *                 markedEntries:
 *                   type: integer
 *                 avgMark:
 *                   type: number
 *                 entriesThisWeek:
 *                   type: integer
 *                 pendingReviews:
 *                   type: integer
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get("/analytics", async (req, res) => {
  try {
    // Only allow super_admin to access analytics
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const timeframe = parseInt(req.query.timeframe) || 30;
    const cutoffDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all diary entries
    const allEntries = await DiaryEntry.findAll({
      where: {
        created_at: {
          [require("sequelize").Op.gte]: cutoffDate,
        },
      },
    });

    // Get entries from this week
    const thisWeekEntries = await DiaryEntry.findAll({
      where: {
        created_at: {
          [require("sequelize").Op.gte]: weekAgo,
        },
      },
    });

    // Calculate statistics
    const totalEntries = allEntries.length;
    const submittedEntries = allEntries.filter(
      (entry) => entry.is_submitted
    ).length;
    const markedEntries = allEntries.filter(
      (entry) => entry.mark !== null
    ).length;
    const pendingReviews = allEntries.filter(
      (entry) => entry.is_submitted && entry.mark === null
    ).length;
    const entriesThisWeek = thisWeekEntries.length;

    // Calculate average mark
    const markedEntriesWithMarks = allEntries.filter(
      (entry) => entry.mark !== null
    );
    const avgMark =
      markedEntriesWithMarks.length > 0
        ? Math.round(
            (markedEntriesWithMarks.reduce(
              (sum, entry) => sum + entry.mark,
              0
            ) /
              markedEntriesWithMarks.length) *
              10
          ) / 10
        : 0;

    const analytics = {
      totalEntries,
      submittedEntries,
      markedEntries,
      avgMark,
      entriesThisWeek,
      pendingReviews,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Get diary analytics error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/diary/overview:
 *   get:
 *     summary: Get diary overview statistics for admin reports
 *     tags: [Diary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diary overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissionTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                 markingProgress:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     marked:
 *                       type: integer
 *                     percentage:
 *                       type: number
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get("/overview", async (req, res) => {
  try {
    // Only allow super_admin to access overview
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Get submission trends for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const submissionTrends = await DiaryEntry.findAll({
      attributes: [
        [
          require("sequelize").fn(
            "DATE",
            require("sequelize").col("submitted_at")
          ),
          "date",
        ],
        [
          require("sequelize").fn("COUNT", require("sequelize").col("id")),
          "count",
        ],
      ],
      where: {
        submitted_at: {
          [require("sequelize").Op.gte]: thirtyDaysAgo,
        },
        is_submitted: true,
      },
      group: [
        require("sequelize").fn(
          "DATE",
          require("sequelize").col("submitted_at")
        ),
      ],
      order: [
        [
          require("sequelize").fn(
            "DATE",
            require("sequelize").col("submitted_at")
          ),
          "ASC",
        ],
      ],
    });

    // Get marking progress
    const allSubmittedEntries = await DiaryEntry.count({
      where: { is_submitted: true },
    });

    const markedEntries = await DiaryEntry.count({
      where: {
        is_submitted: true,
        mark: { [require("sequelize").Op.ne]: null },
      },
    });

    const markingProgress = {
      total: allSubmittedEntries,
      marked: markedEntries,
      percentage:
        allSubmittedEntries > 0
          ? Math.round((markedEntries / allSubmittedEntries) * 100)
          : 0,
    };

    const overview = {
      submissionTrends,
      markingProgress,
    };

    res.json(overview);
  } catch (error) {
    console.error("Get diary overview error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
