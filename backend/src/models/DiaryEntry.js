const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connection");

const DiaryEntry = sequelize.define(
  "DiaryEntry",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    text_report: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL to uploaded file/image",
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Original filename",
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "File size in bytes",
    },
    mark: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
      comment: "Numeric mark (0-100)",
    },
    teacher_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_submitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    marked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "diary_entries",
    indexes: [
      {
        unique: true,
        fields: ["student_id", "entry_date"],
      },
    ],
  }
);

module.exports = DiaryEntry;
