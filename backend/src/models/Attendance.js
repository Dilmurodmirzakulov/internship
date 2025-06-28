const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection").sequelize;
const User = require("./User");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("present", "absent", "excused"),
      allowNull: false,
      defaultValue: "present",
    },
  },
  {
    tableName: "attendance",
    indexes: [
      {
        unique: true,
        fields: ["student_id", "date"],
      },
    ],
  }
);

// Associations are defined in models/index.js after all models are loaded

module.exports = Attendance;
