const express = require("express");
const { body, validationResult } = require("express-validator");
const { User, Group, DiaryEntry, TeacherGroup } = require("../models");
const {
  requireSuperAdmin,
  requireTeacher,
  auth,
} = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(
      process.env.UPLOAD_PATH || "./uploads",
      "profiles"
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile-${req.user.id}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."),
      false
    );
  }
};

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, teacher, student]
 *         description: Filter users by role
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter users by group ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   description: Total number of users
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Super admin only
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
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    const { role, group_id, search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (group_id) where.group_id = group_id;

    // Add search functionality
    if (search) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where,
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
        {
          model: Group,
          as: "assignedGroups",
          attributes: ["id", "name"],
          through: { attributes: [] }, // Exclude junction table attributes
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

// Get teacher dashboard data (optimized single endpoint)
router.get("/teacher/dashboard", requireTeacher, async (req, res) => {
  try {
    let whereClause = { role: "student" };

    // Teachers can only see students from their assigned groups
    if (req.user.role === "teacher") {
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      if (assignedGroupIds.length === 0) {
        return res.status(400).json({
          message:
            "Teacher must be assigned to at least one group to view students.",
        });
      }

      whereClause.group_id = assignedGroupIds;
    }

    const students = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
        {
          model: DiaryEntry,
          as: "diary_entries",
          attributes: [
            "id",
            "entry_date",
            "is_submitted",
            "mark",
            "submitted_at",
            "marked_at",
          ],
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
      order: [["name", "ASC"]],
    });

    // Calculate dashboard statistics
    const totalEntries = students.reduce(
      (total, student) => total + (student.diary_entries?.length || 0),
      0
    );

    const submittedEntries = students.reduce(
      (total, student) =>
        total +
        (student.diary_entries?.filter((e) => e.is_submitted)?.length || 0),
      0
    );

    const reviewedEntries = students.reduce(
      (total, student) =>
        total +
        (student.diary_entries?.filter((e) => e.mark !== null)?.length || 0),
      0
    );

    // Get pending entries (submitted but not marked)
    const allPendingEntries = [];
    students.forEach((student) => {
      const pending =
        student.diary_entries?.filter(
          (entry) => entry.is_submitted && entry.mark === null
        ) || [];
      allPendingEntries.push(...pending);
    });

    // Sort pending entries by submission date
    allPendingEntries.sort(
      (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at)
    );

    const dashboardData = {
      students: students.map((student) => ({
        ...student.toJSON(),
        diary_entries: student.diary_entries || [],
      })),
      statistics: {
        totalStudents: students.length,
        totalEntries,
        submittedEntries,
        reviewedEntries,
        pendingEntries: allPendingEntries.length,
      },
      pendingEntries: allPendingEntries.slice(0, 10), // Latest 10 pending entries
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Get teacher dashboard error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/users/students:
 *   get:
 *     summary: Get students with diary entries (for teachers and super admins)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Teachers can only see students from their assigned groups.
 *       Super admins can see all students.
 *       Each student includes their diary entries.
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/User'
 *                       - type: object
 *                         properties:
 *                           diary_entries:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/DiaryEntry'
 *       400:
 *         description: Teacher must be assigned to at least one group
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/students", requireTeacher, async (req, res) => {
  try {
    let whereClause = { role: "student" };

    // Teachers can only see students from their assigned groups
    // Super admins can see all students
    if (req.user.role === "teacher") {
      // Get teacher's assigned groups
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      if (assignedGroupIds.length === 0) {
        return res.status(400).json({
          message:
            "Teacher must be assigned to at least one group to view students.",
        });
      }

      whereClause.group_id = assignedGroupIds;
    }
    // For super_admin, no group restriction (can see all students)

    const students = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
        {
          model: DiaryEntry,
          as: "diary_entries",
          attributes: [
            "id",
            "entry_date",
            "is_submitted",
            "mark",
            "submitted_at",
            "marked_at",
          ],
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
      order: [["name", "ASC"]],
    });

    // Transform the data to include diary_entries (matching frontend expectation)
    const studentsWithDiary = students.map((student) => ({
      ...student.toJSON(),
      diary_entries: student.diary_entries || [],
    }));

    res.json({ students: studentsWithDiary });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get users by group (Teachers can see their group students)
router.get("/group/:groupId", requireTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { role } = req.query;

    // Teachers can only see their assigned groups
    if (req.user.role === "teacher") {
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      if (!assignedGroupIds.includes(groupId)) {
        return res.status(403).json({
          message: "Access denied. You can only view your assigned groups.",
        });
      }
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
    body("assigned_group_ids").optional().isArray(),
    body("assigned_group_ids.*").optional().isUUID(),
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

      const { name, email, password, role, group_id, assigned_group_ids } =
        req.body;

      // For students, validate group exists
      if (role === "student" && group_id) {
        const group = await Group.findByPk(group_id);
        if (!group) {
          return res.status(400).json({ message: "Group not found." });
        }
      }

      // For teachers, validate assigned groups
      if (role === "teacher") {
        if (!assigned_group_ids || assigned_group_ids.length === 0) {
          return res.status(400).json({
            message: "Teachers must be assigned to at least one group.",
          });
        }

        const groups = await Group.findAll({
          where: { id: assigned_group_ids },
        });

        if (groups.length !== assigned_group_ids.length) {
          return res
            .status(400)
            .json({ message: "One or more assigned groups not found." });
        }
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        group_id: role === "student" ? group_id : null, // Only students have group_id
      });

      // If teacher with assigned groups, create the associations
      if (
        role === "teacher" &&
        assigned_group_ids &&
        assigned_group_ids.length > 0
      ) {
        await user.setAssignedGroups(assigned_group_ids);
      }

      // Fetch the user with all associations for response
      const userWithGroups = await User.findByPk(user.id, {
        include: [
          {
            model: Group,
            as: "group",
            attributes: ["id", "name"],
          },
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        attributes: {
          exclude: [
            "password",
            "password_reset_token",
            "password_reset_expires",
          ],
        },
      });

      res.status(201).json({
        message: "User created successfully.",
        user: userWithGroups,
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
    body("assigned_group_ids").optional().isArray(),
    body("assigned_group_ids.*").optional().isUUID(),
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
      const { assigned_group_ids, ...updateData } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // For students, validate group exists
      if (
        (updateData.role === "student" || user.role === "student") &&
        updateData.group_id
      ) {
        const group = await Group.findByPk(updateData.group_id);
        if (!group) {
          return res.status(400).json({ message: "Group not found." });
        }
      }

      // For teachers, validate assigned groups
      if (
        (updateData.role === "teacher" || user.role === "teacher") &&
        assigned_group_ids !== undefined
      ) {
        if (assigned_group_ids.length === 0) {
          return res.status(400).json({
            message: "Teachers must be assigned to at least one group.",
          });
        }

        const groups = await Group.findAll({
          where: { id: assigned_group_ids },
        });

        if (groups.length !== assigned_group_ids.length) {
          return res
            .status(400)
            .json({ message: "One or more assigned groups not found." });
        }
      }

      // If changing role from teacher to student, clear assigned groups
      if (updateData.role === "student" && user.role === "teacher") {
        await user.setAssignedGroups([]);
        updateData.group_id = updateData.group_id || null;
      }

      // If changing role from student to teacher, clear group_id
      if (updateData.role === "teacher" && user.role === "student") {
        updateData.group_id = null;
      }

      await user.update(updateData);

      // Update assigned groups for teachers
      if (
        (updateData.role === "teacher" || user.role === "teacher") &&
        assigned_group_ids !== undefined
      ) {
        await user.setAssignedGroups(assigned_group_ids);
      }

      // Fetch the updated user with all associations
      const userWithGroups = await User.findByPk(user.id, {
        include: [
          {
            model: Group,
            as: "group",
            attributes: ["id", "name"],
          },
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        attributes: {
          exclude: [
            "password",
            "password_reset_token",
            "password_reset_expires",
          ],
        },
      });

      res.json({
        message: "User updated successfully.",
        user: userWithGroups,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user account (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully."
 *       400:
 *         description: Cannot delete super admin user
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
 *         description: Access denied - Super admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID with detailed information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         group:
 *                           $ref: '#/components/schemas/Group'
 *                         assignedGroups:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
        {
          model: Group,
          as: "assignedGroups",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      attributes: {
        exclude: ["password", "password_reset_token", "password_reset_expires"],
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Teachers can only see users from their assigned groups
    if (req.user.role === "teacher") {
      const teacherWithGroups = await User.findByPk(req.user.id, {
        include: [
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id"],
          },
        ],
      });

      const assignedGroupIds = teacherWithGroups.assignedGroups.map(
        (g) => g.id
      );

      // Check if the requested user belongs to any of teacher's assigned groups
      const userGroupIds = [];
      if (user.group_id) userGroupIds.push(user.group_id);
      if (user.assignedGroups) {
        userGroupIds.push(...user.assignedGroups.map((g) => g.id));
      }

      const hasAccess = userGroupIds.some((groupId) =>
        assignedGroupIds.includes(groupId)
      );

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Update own profile (Any authenticated user)
router.put(
  "/profile/me",
  auth,
  profileUpload.single("profile_image"),
  [
    body("name").optional().isLength({ min: 2, max: 100 }).trim(),
    body("email").optional().isEmail().normalizeEmail(),
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

      const { name, email } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const updateData = {};

      // Update name if provided
      if (name) {
        updateData.name = name;
      }

      // Update email if provided and different
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ message: "Email is already taken." });
        }
        updateData.email = email;
      }

      // Handle profile image upload
      if (req.file) {
        // Delete old profile image if it exists
        if (user.profile_image) {
          const oldImagePath = path.join(
            process.env.UPLOAD_PATH || "./uploads",
            user.profile_image
          );
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        // Set new profile image path
        updateData.profile_image = `profiles/${req.file.filename}`;
      }

      // Update user
      await user.update(updateData);

      // Fetch updated user with associations
      const updatedUser = await User.findByPk(user.id, {
        include: [
          {
            model: Group,
            as: "group",
            attributes: ["id", "name"],
          },
          {
            model: Group,
            as: "assignedGroups",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        attributes: {
          exclude: [
            "password",
            "password_reset_token",
            "password_reset_expires",
          ],
        },
      });

      res.json({
        message: "Profile updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);

      // Clean up uploaded file if there was an error
      if (req.file) {
        const filePath = path.join(
          process.env.UPLOAD_PATH || "./uploads",
          "profiles",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * @swagger
 * /api/users/admin/analytics:
 *   get:
 *     summary: Get comprehensive analytics for admin dashboard
 *     tags: [Users]
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
 *         description: Admin analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userStats:
 *                   type: object
 *                 diaryStats:
 *                   type: object
 *                 programStats:
 *                   type: object
 *                 engagementStats:
 *                   type: object
 *       403:
 *         description: Access denied - Super admin only
 *       500:
 *         description: Server error
 */
router.get("/admin/analytics", requireSuperAdmin, async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe) || 30;
    const cutoffDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

    // Get user statistics
    const allUsers = await User.findAll({
      attributes: ["id", "role", "is_active", "last_login", "created_at"],
    });

    const userStats = {
      total: allUsers.length,
      active: allUsers.filter((u) => u.is_active).length,
      students: allUsers.filter((u) => u.role === "student").length,
      teachers: allUsers.filter((u) => u.role === "teacher").length,
      admins: allUsers.filter((u) => u.role === "super_admin").length,
      recentLogins: allUsers.filter((u) => {
        if (!u.last_login) return false;
        return new Date(u.last_login) >= cutoffDate;
      }).length,
      newUsers: allUsers.filter((u) => new Date(u.created_at) >= cutoffDate)
        .length,
    };

    // Get diary statistics
    const { DiaryEntry } = require("../models");
    const allEntries = await DiaryEntry.findAll({
      where: {
        created_at: {
          [require("sequelize").Op.gte]: cutoffDate,
        },
      },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekEntries = await DiaryEntry.findAll({
      where: {
        created_at: {
          [require("sequelize").Op.gte]: weekAgo,
        },
      },
    });

    const markedEntriesWithMarks = allEntries.filter(
      (entry) => entry.mark !== null
    );
    const diaryStats = {
      totalEntries: allEntries.length,
      submittedEntries: allEntries.filter((entry) => entry.is_submitted).length,
      markedEntries: markedEntriesWithMarks.length,
      avgMark:
        markedEntriesWithMarks.length > 0
          ? Math.round(
              (markedEntriesWithMarks.reduce(
                (sum, entry) => sum + entry.mark,
                0
              ) /
                markedEntriesWithMarks.length) *
                10
            ) / 10
          : 0,
      entriesThisWeek: thisWeekEntries.length,
      pendingReviews: allEntries.filter(
        (entry) => entry.is_submitted && entry.mark === null
      ).length,
    };

    // Get program statistics
    const { InternshipProgram } = require("../models");
    const allPrograms = await InternshipProgram.findAll();

    const programStats = {
      total: allPrograms.length,
      active: allPrograms.filter((p) => p.is_active).length,
      upcoming: allPrograms.filter((p) => {
        if (!p.start_date) return false;
        return new Date(p.start_date) > new Date();
      }).length,
      ongoing: allPrograms.filter((p) => {
        if (!p.start_date || !p.end_date) return false;
        const now = new Date();
        return new Date(p.start_date) <= now && new Date(p.end_date) >= now;
      }).length,
      completed: allPrograms.filter((p) => {
        if (!p.end_date) return false;
        return new Date(p.end_date) < new Date();
      }).length,
    };

    // Calculate engagement statistics
    const engagementStats = {
      userEngagementRate:
        userStats.total > 0
          ? Math.round((userStats.recentLogins / userStats.total) * 100)
          : 0,
      submissionRate:
        diaryStats.totalEntries > 0
          ? Math.round(
              (diaryStats.submittedEntries / diaryStats.totalEntries) * 100
            )
          : 0,
      markingProgress:
        diaryStats.submittedEntries > 0
          ? Math.round(
              (diaryStats.markedEntries / diaryStats.submittedEntries) * 100
            )
          : 0,
    };

    const analytics = {
      userStats,
      diaryStats,
      programStats,
      engagementStats,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Get admin analytics error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
