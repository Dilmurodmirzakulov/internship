const {
  Notification,
  User,
  DiaryEntry,
  InternshipProgram,
} = require("../models");
const { Op } = require("sequelize");

class NotificationService {
  // Create a notification for a specific user
  static async createNotification({
    userId,
    type,
    title,
    message,
    priority = "medium",
    actionUrl = null,
    metadata = {},
    expiresAt = null,
  }) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        priority,
        action_url: actionUrl,
        metadata,
        expires_at: expiresAt,
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Create notifications for multiple users
  static async createBulkNotifications(users, notificationData) {
    try {
      const notifications = users.map((userId) => ({
        user_id: userId,
        ...notificationData,
      }));

      return await Notification.bulkCreate(notifications);
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw error;
    }
  }

  // Send diary reminder notifications
  static async sendDiaryReminders() {
    try {
      console.log("🔔 Checking for diary reminder notifications...");

      // Get all active students
      const students = await User.findAll({
        where: {
          role: "student",
          is_active: true,
        },
        include: [
          {
            model: require("../models/Group"),
            as: "group",
            include: [
              {
                model: InternshipProgram,
                as: "program",
                where: { is_active: true },
              },
            ],
          },
        ],
      });

      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      for (const student of students) {
        if (!student.group?.program) continue;

        const program = student.group.program;

        // Check if today is a valid program day
        const isValidDay = this.isValidProgramDay(today, program);
        if (!isValidDay) continue;

        // Check if student has submitted today's entry
        const todayEntry = await DiaryEntry.findOne({
          where: {
            student_id: student.id,
            entry_date: today,
            is_submitted: true,
          },
        });

        // Check for yesterday's missing entry
        const yesterdayEntry = await DiaryEntry.findOne({
          where: {
            student_id: student.id,
            entry_date: yesterday,
            is_submitted: true,
          },
        });

        // Send reminder for today if not submitted
        if (!todayEntry) {
          await this.createNotification({
            userId: student.id,
            type: "diary_reminder",
            title: "Daily Diary Reminder",
            message: `Don't forget to submit your diary entry for today (${new Date().toLocaleDateString()}).`,
            priority: "medium",
            actionUrl: "/student/diary/entry",
            metadata: { date: today },
          });
        }

        // Send warning for yesterday if not submitted
        if (!yesterdayEntry && this.isValidProgramDay(yesterday, program)) {
          await this.createNotification({
            userId: student.id,
            type: "deadline_warning",
            title: "Missing Diary Entry",
            message: `You haven't submitted your diary entry for ${new Date(
              yesterday
            ).toLocaleDateString()}. Please submit it as soon as possible.`,
            priority: "high",
            actionUrl: `/student/diary/entry/${yesterday}`,
            metadata: { date: yesterday },
          });
        }
      }

      console.log("✅ Diary reminder check completed");
    } catch (error) {
      console.error("Error sending diary reminders:", error);
    }
  }

  // Check if a date is a valid program day (not disabled, not weekend)
  static isValidProgramDay(dateStr, program) {
    const date = new Date(dateStr);
    const startDate = new Date(program.start_date);
    const endDate = new Date(program.end_date);

    // Check if date is within program range
    if (date < startDate || date > endDate) return false;

    // Check if date is disabled
    if (program.disabled_days && program.disabled_days.includes(dateStr)) {
      return false;
    }

    // Check if it's weekend (optional - you can remove this if weekends are allowed)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    return true;
  }

  // Send notification when entry is marked
  static async notifyEntryMarked(diaryEntry) {
    try {
      await this.createNotification({
        userId: diaryEntry.student_id,
        type: "entry_marked",
        title: "Diary Entry Marked",
        message: `Your diary entry for ${new Date(
          diaryEntry.entry_date
        ).toLocaleDateString()} has been marked. Score: ${diaryEntry.mark}/100`,
        priority: "medium",
        actionUrl: "/student/diary",
        metadata: {
          entryId: diaryEntry.id,
          mark: diaryEntry.mark,
          date: diaryEntry.entry_date,
        },
      });
    } catch (error) {
      console.error("Error notifying entry marked:", error);
    }
  }

  // Send system announcements to all users
  static async sendSystemAnnouncement({
    title,
    message,
    priority = "medium",
    userRoles = ["student", "teacher", "super_admin"],
    actionUrl = null,
  }) {
    try {
      const users = await User.findAll({
        where: {
          role: userRoles,
          is_active: true,
        },
        attributes: ["id"],
      });

      const userIds = users.map((user) => user.id);

      await this.createBulkNotifications(userIds, {
        type: "system_announcement",
        title,
        message,
        priority,
        action_url: actionUrl,
      });

      console.log(`📢 System announcement sent to ${userIds.length} users`);
    } catch (error) {
      console.error("Error sending system announcement:", error);
    }
  }

  // Get notifications for a user
  static async getUserNotifications(
    userId,
    { page = 1, limit = 20, unreadOnly = false } = {}
  ) {
    try {
      const where = { user_id: userId };

      if (unreadOnly) {
        where.is_read = false;
      }

      // Remove expired notifications
      where[Op.or] = [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } },
      ];

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit,
        offset: (page - 1) * limit,
      });

      return {
        notifications: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const [updatedCount] = await Notification.update(
        { is_read: true },
        {
          where: {
            id: notificationId,
            user_id: userId,
          },
        }
      );

      return updatedCount > 0;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const [updatedCount] = await Notification.update(
        { is_read: true },
        {
          where: {
            user_id: userId,
            is_read: false,
          },
        }
      );

      return updatedCount;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete old notifications
  static async cleanupExpiredNotifications() {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date(),
          },
        },
      });

      console.log(`🗑️ Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
    }
  }

  // Get notification statistics for a user
  static async getNotificationStats(userId) {
    try {
      const [total, unread, byType] = await Promise.all([
        Notification.count({ where: { user_id: userId } }),
        Notification.count({ where: { user_id: userId, is_read: false } }),
        Notification.findAll({
          where: { user_id: userId },
          attributes: [
            "type",
            [require("sequelize").fn("COUNT", "*"), "count"],
          ],
          group: ["type"],
          raw: true,
        }),
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      throw error;
    }
  }
}

module.exports = NotificationService;
