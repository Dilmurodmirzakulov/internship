const User = require("./User");
const Group = require("./Group");
const InternshipProgram = require("./InternshipProgram");
const DiaryEntry = require("./DiaryEntry");
const Notification = require("./Notification");
const Attendance = require("./Attendance");

// Create junction table for Teacher-Group many-to-many relationship
const TeacherGroup = require("../database/connection").sequelize.define(
  "TeacherGroup",
  {
    id: {
      type: require("sequelize").DataTypes.UUID,
      defaultValue: require("sequelize").DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacher_id: {
      type: require("sequelize").DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    group_id: {
      type: require("sequelize").DataTypes.UUID,
      allowNull: false,
      references: {
        model: Group,
        key: "id",
      },
    },
  },
  {
    tableName: "teacher_groups",
    indexes: [
      {
        unique: true,
        fields: ["teacher_id", "group_id"],
      },
    ],
  }
);

// Create junction table for Program-Group many-to-many relationship
const ProgramGroup = require("../database/connection").sequelize.define(
  "ProgramGroup",
  {
    id: {
      type: require("sequelize").DataTypes.UUID,
      defaultValue: require("sequelize").DataTypes.UUIDV4,
      primaryKey: true,
    },
    program_id: {
      type: require("sequelize").DataTypes.UUID,
      allowNull: false,
      references: {
        model: InternshipProgram,
        key: "id",
      },
    },
    group_id: {
      type: require("sequelize").DataTypes.UUID,
      allowNull: false,
      references: {
        model: Group,
        key: "id",
      },
    },
  },
  {
    tableName: "program_groups",
    indexes: [
      {
        unique: true,
        fields: ["program_id", "group_id"],
      },
    ],
  }
);

// User - Group associations (for students - they still belong to one group)
User.belongsTo(Group, { as: "group", foreignKey: "group_id" });
Group.hasMany(User, {
  as: "students",
  foreignKey: "group_id",
  scope: { role: "student" },
});

// Many-to-many relationship between Teachers and Groups
User.belongsToMany(Group, {
  through: TeacherGroup,
  as: "assignedGroups",
  foreignKey: "teacher_id",
  otherKey: "group_id",
});
Group.belongsToMany(User, {
  through: TeacherGroup,
  as: "assignedTeachers",
  foreignKey: "group_id",
  otherKey: "teacher_id",
});

// Keep the old association for backward compatibility (teachers can still have a primary group)
Group.hasMany(User, {
  as: "teachers",
  foreignKey: "group_id",
  scope: { role: "teacher" },
});

// Many-to-many relationship between Programs and Groups
InternshipProgram.belongsToMany(Group, {
  through: ProgramGroup,
  as: "assignedGroups",
  foreignKey: "program_id",
  otherKey: "group_id",
});
Group.belongsToMany(InternshipProgram, {
  through: ProgramGroup,
  as: "programs",
  foreignKey: "group_id",
  otherKey: "program_id",
});

// Keep the old association for backward compatibility (single group programs)
Group.hasOne(InternshipProgram, { as: "program", foreignKey: "group_id" });
InternshipProgram.belongsTo(Group, { as: "group", foreignKey: "group_id" });

// User - DiaryEntry associations
User.hasMany(DiaryEntry, { as: "diary_entries", foreignKey: "student_id" });
DiaryEntry.belongsTo(User, { as: "student", foreignKey: "student_id" });

// Teacher - DiaryEntry associations (for marking)
User.hasMany(DiaryEntry, { as: "marked_entries", foreignKey: "teacher_id" });
DiaryEntry.belongsTo(User, { as: "teacher", foreignKey: "teacher_id" });

// User - Notification associations
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });

// Attendance associations
User.hasMany(Attendance, {
  as: "attendance_records",
  foreignKey: "student_id",
});
Attendance.belongsTo(User, { as: "student", foreignKey: "student_id" });

module.exports = {
  User,
  Group,
  InternshipProgram,
  DiaryEntry,
  Notification,
  Attendance,
  TeacherGroup,
  ProgramGroup,
};
