const express = require("express");
const { auth } = require("../middleware/auth");
const NotificationService = require("../services/notificationService");
const { body, validationResult, query } = require("express-validator");

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications with pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 50
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                   description: Total number of notifications
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  auth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("unreadOnly").optional().isBoolean(),
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

      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.id;

      const result = await NotificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === "true",
      });

      res.json(result);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of notifications
 *                 unread:
 *                   type: integer
 *                   description: Number of unread notifications
 *                 read:
 *                   type: integer
 *                   description: Number of read notifications
 *       401:
 *         description: Unauthorized
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
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await NotificationService.getNotificationStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read."
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
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
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await NotificationService.markAsRead(id, userId);

    if (!updated) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Mark all notifications as read
router.patch("/read-all", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedCount = await NotificationService.markAllAsRead(userId);

    res.json({
      message: "All notifications marked as read.",
      updatedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All notifications marked as read."
 *                 updatedCount:
 *                   type: integer
 *                   description: Number of notifications that were updated
 *       401:
 *         description: Unauthorized
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

/**
 * @swagger
 * /api/notifications/announcement:
 *   post:
 *     summary: Send system-wide announcement (Super Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Announcement title
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Announcement message
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Announcement priority level
 *               userRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [super_admin, teacher, student]
 *                 description: Target user roles (all roles if not specified)
 *               actionUrl:
 *                 type: string
 *                 format: url
 *                 description: Optional action URL for the notification
 *     responses:
 *       200:
 *         description: System announcement sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "System announcement sent successfully."
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
  "/announcement",
  auth,
  [
    body("title").isLength({ min: 1, max: 200 }),
    body("message").isLength({ min: 1, max: 1000 }),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
    body("userRoles").optional().isArray(),
    body("actionUrl")
      .optional({ nullable: true, checkFalsy: true })
      .isURL()
      .withMessage("Invalid URL for actionUrl"),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Super admin only." });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { title, message, priority, userRoles, actionUrl } = req.body;

      await NotificationService.sendSystemAnnouncement({
        title,
        message,
        priority,
        userRoles,
        actionUrl: actionUrl || null,
      });

      res.json({ message: "System announcement sent successfully." });
    } catch (error) {
      console.error("Send system announcement error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// Trigger diary reminders manually (Super Admin only)
router.post("/diary-reminders", auth, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin only." });
    }

    await NotificationService.sendDiaryReminders();
    res.json({ message: "Diary reminders sent successfully." });
  } catch (error) {
    console.error("Send diary reminders error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Cleanup expired notifications (Super Admin only)
router.delete("/cleanup", auth, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin only." });
    }

    const deletedCount =
      await NotificationService.cleanupExpiredNotifications();
    res.json({
      message: "Expired notifications cleaned up.",
      deletedCount,
    });
  } catch (error) {
    console.error("Cleanup notifications error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
