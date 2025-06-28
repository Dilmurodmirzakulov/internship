const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connection");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "diary_reminder",
        "entry_marked",
        "deadline_warning",
        "system_announcement",
        "password_changed",
        "account_update"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    action_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL to navigate when notification is clicked",
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: "Additional data for the notification",
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When this notification should be automatically removed",
    },
  },
  {
    tableName: "notifications",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["user_id", "is_read"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

module.exports = Notification;
