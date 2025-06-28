const express = require("express");
const { body, validationResult } = require("express-validator");
const { InternshipProgram, Group, ProgramGroup } = require("../models");
const { requireSuperAdmin, requireTeacher } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all internship programs
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 programs:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/InternshipProgram'
 *                       - type: object
 *                         properties:
 *                           group:
 *                             $ref: '#/components/schemas/Group'
 *                           assignedGroups:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Group'
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
    const programs = await InternshipProgram.findAll({
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
      order: [["created_at", "DESC"]],
    });

    res.json({ programs });
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/programs/{id}:
 *   get:
 *     summary: Get internship program by ID
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 program:
 *                   allOf:
 *                     - $ref: '#/components/schemas/InternshipProgram'
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
 *         description: Program not found
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

    const program = await InternshipProgram.findByPk(id, {
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "description"],
        },
        {
          model: Group,
          as: "assignedGroups",
          attributes: ["id", "name", "description"],
          through: { attributes: [] },
        },
      ],
    });

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // Teachers can only see programs from their assigned groups
    if (req.user.role === "teacher") {
      const teacherWithGroups = await require("../models").User.findByPk(
        req.user.id,
        {
          include: [
            {
              model: Group,
              as: "assignedGroups",
              attributes: ["id"],
            },
          ],
        }
      );

      const teacherGroupIds = teacherWithGroups.assignedGroups.map((g) => g.id);

      // Check if program is assigned to any of teacher's groups
      const programGroupIds = [];
      if (program.group_id) programGroupIds.push(program.group_id);
      if (program.assignedGroups) {
        programGroupIds.push(...program.assignedGroups.map((g) => g.id));
      }

      const hasAccess = programGroupIds.some((groupId) =>
        teacherGroupIds.includes(groupId)
      );

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    res.json({ program });
  } catch (error) {
    console.error("Get program error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/programs:
 *   post:
 *     summary: Create a new internship program
 *     tags: [Programs]
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
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 description: Program name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Program description
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Program start date
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Program end date
 *               group_id:
 *                 type: string
 *                 format: uuid
 *                 description: Primary group ID (for backward compatibility)
 *               assigned_group_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of group IDs to assign to this program
 *               disabled_days:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                 description: Days when diary entries are not allowed
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Program created successfully."
 *                 program:
 *                   $ref: '#/components/schemas/InternshipProgram'
 *       400:
 *         description: Validation error or business rule violation
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
    body("name").isLength({ min: 2, max: 200 }),
    body("description").optional().isLength({ max: 1000 }),
    body("start_date").isISO8601().toDate(),
    body("end_date").isISO8601().toDate(),
    body("group_id").optional().isUUID(),
    body("assigned_group_ids").optional().isArray(),
    body("assigned_group_ids.*").optional().isUUID(),
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
        assigned_group_ids,
        disabled_days = [],
      } = req.body;

      // Validate that at least one group is assigned
      if (
        !group_id &&
        (!assigned_group_ids || assigned_group_ids.length === 0)
      ) {
        return res.status(400).json({
          message: "Program must be assigned to at least one group.",
        });
      }

      // Check if primary group exists (for backward compatibility)
      if (group_id) {
        const group = await Group.findByPk(group_id);
        if (!group) {
          return res.status(400).json({ message: "Primary group not found." });
        }
      }

      // Validate assigned groups
      if (assigned_group_ids && assigned_group_ids.length > 0) {
        const groups = await Group.findAll({
          where: { id: assigned_group_ids },
        });

        if (groups.length !== assigned_group_ids.length) {
          return res
            .status(400)
            .json({ message: "One or more assigned groups not found." });
        }
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

      // Assign groups to program
      if (assigned_group_ids && assigned_group_ids.length > 0) {
        await program.setAssignedGroups(assigned_group_ids);
      }

      // Fetch the program with all associations for response
      const programWithGroups = await InternshipProgram.findByPk(program.id, {
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
      });

      res.status(201).json({
        message: "Program created successfully.",
        program: programWithGroups,
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
    body("assigned_group_ids").optional().isArray(),
    body("assigned_group_ids.*").optional().isUUID(),
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
      const { assigned_group_ids, ...updateData } = req.body;

      const program = await InternshipProgram.findByPk(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }

      // Validate assigned groups
      if (assigned_group_ids !== undefined) {
        if (assigned_group_ids.length === 0) {
          return res.status(400).json({
            message: "Program must be assigned to at least one group.",
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

      // Validate dates if both are provided
      if (updateData.start_date && updateData.end_date) {
        if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
          return res
            .status(400)
            .json({ message: "End date must be after start date." });
        }
      }

      await program.update(updateData);

      // Update assigned groups
      if (assigned_group_ids !== undefined) {
        await program.setAssignedGroups(assigned_group_ids);
      }

      // Fetch the updated program with all associations
      const programWithGroups = await InternshipProgram.findByPk(program.id, {
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
      });

      res.json({
        message: "Program updated successfully.",
        program: programWithGroups,
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

// Get programs by group ID
router.get("/group/:groupId", requireTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Teachers can only see programs from their assigned groups
    if (req.user.role === "teacher") {
      const teacherWithGroups = await require("../models").User.findByPk(
        req.user.id,
        {
          include: [
            {
              model: Group,
              as: "assignedGroups",
              attributes: ["id"],
            },
          ],
        }
      );

      const teacherGroupIds = teacherWithGroups.assignedGroups.map((g) => g.id);

      if (!teacherGroupIds.includes(groupId)) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    // Find programs that are assigned to this group (either via group_id or assignedGroups)
    const programs = await InternshipProgram.findAll({
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
          where: { id: groupId },
          required: false,
        },
      ],
      where: {
        [require("sequelize").Op.or]: [
          { group_id: groupId },
          { "$assignedGroups.id$": groupId },
        ],
      },
    });

    res.json({ programs });
  } catch (error) {
    console.error("Get group programs error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
