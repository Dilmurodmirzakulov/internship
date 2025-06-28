const express = require("express");
const { body, validationResult } = require("express-validator");
const { Group, User, InternshipProgram } = require("../models");
const { requireSuperAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups with associated users and programs
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Group'
 *                       - type: object
 *                         properties:
 *                           students:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           teachers:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           program:
 *                             $ref: '#/components/schemas/InternshipProgram'
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

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID with detailed information
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Group'
 *                     - type: object
 *                       properties:
 *                         students:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         teachers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         program:
 *                           $ref: '#/components/schemas/InternshipProgram'
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
 *         description: Group not found
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

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Group name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Group description
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group created successfully."
 *                 group:
 *                   $ref: '#/components/schemas/Group'
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

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update group information
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Group name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Group description
 *               is_active:
 *                 type: boolean
 *                 description: Whether the group is active
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group updated successfully."
 *                 group:
 *                   $ref: '#/components/schemas/Group'
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
 *         description: Access denied - Super admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
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
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group deleted successfully."
 *       400:
 *         description: Cannot delete group with assigned users
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
 *         description: Group not found
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
