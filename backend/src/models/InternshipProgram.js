const { DataTypes } = require("sequelize");
const { sequelize } = require("../database/connection");

const InternshipProgram = sequelize.define(
  "InternshipProgram",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    disabled_days: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: "Array of disabled dates (holidays, non-working days)",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "internship_programs",
    validate: {
      endDateAfterStartDate() {
        if (
          this.start_date &&
          this.end_date &&
          this.start_date >= this.end_date
        ) {
          throw new Error("End date must be after start date");
        }
      },
    },
  }
);

module.exports = InternshipProgram;
