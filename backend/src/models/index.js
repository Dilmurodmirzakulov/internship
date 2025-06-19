const User = require("./User");
const Group = require("./Group");
const InternshipProgram = require("./InternshipProgram");
const DiaryEntry = require("./DiaryEntry");

// User - Group associations
User.belongsTo(Group, { as: "group", foreignKey: "group_id" });
Group.hasMany(User, {
  as: "students",
  foreignKey: "group_id",
  scope: { role: "student" },
});
Group.hasMany(User, {
  as: "teachers",
  foreignKey: "group_id",
  scope: { role: "teacher" },
});

// Group - InternshipProgram associations
Group.hasOne(InternshipProgram, { as: "program", foreignKey: "group_id" });
InternshipProgram.belongsTo(Group, { as: "group", foreignKey: "group_id" });

// User - DiaryEntry associations
User.hasMany(DiaryEntry, { as: "diary_entries", foreignKey: "student_id" });
DiaryEntry.belongsTo(User, { as: "student", foreignKey: "student_id" });

// Teacher - DiaryEntry associations (for marking)
User.hasMany(DiaryEntry, { as: "marked_entries", foreignKey: "teacher_id" });
DiaryEntry.belongsTo(User, { as: "teacher", foreignKey: "teacher_id" });

module.exports = {
  User,
  Group,
  InternshipProgram,
  DiaryEntry,
};
