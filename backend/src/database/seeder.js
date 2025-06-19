const { User, Group, InternshipProgram } = require("../models");
const bcrypt = require("bcryptjs");

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Create super admin
    const superAdminPassword = await bcrypt.hash("admin123", 12);
    const superAdmin = await User.create({
      name: "Super Administrator",
      email: "admin@university.edu",
      password: superAdminPassword,
      role: "super_admin",
      is_active: true,
    });
    console.log("✅ Super admin created:", superAdmin.email);

    // Create sample groups
    const group1 = await Group.create({
      name: "Computer Science Group A",
      description: "First year computer science students",
      is_active: true,
    });

    const group2 = await Group.create({
      name: "Computer Science Group B",
      description: "Second year computer science students",
      is_active: true,
    });

    console.log("✅ Sample groups created");

    // Create sample teachers
    const teacher1Password = await bcrypt.hash("teacher123", 12);
    const teacher1 = await User.create({
      name: "Dr. John Smith",
      email: "john.smith@university.edu",
      password: teacher1Password,
      role: "teacher",
      group_id: group1.id,
      is_active: true,
    });

    const teacher2Password = await bcrypt.hash("teacher123", 12);
    const teacher2 = await User.create({
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu",
      password: teacher2Password,
      role: "teacher",
      group_id: group2.id,
      is_active: true,
    });

    console.log("✅ Sample teachers created");

    // Create sample students
    const studentPasswords = await Promise.all([
      bcrypt.hash("student123", 12),
      bcrypt.hash("student123", 12),
      bcrypt.hash("student123", 12),
      bcrypt.hash("student123", 12),
    ]);

    const students = await User.bulkCreate([
      {
        name: "Alice Johnson",
        email: "alice.johnson@student.university.edu",
        password: studentPasswords[0],
        role: "student",
        group_id: group1.id,
        is_active: true,
      },
      {
        name: "Bob Wilson",
        email: "bob.wilson@student.university.edu",
        password: studentPasswords[1],
        role: "student",
        group_id: group1.id,
        is_active: true,
      },
      {
        name: "Carol Davis",
        email: "carol.davis@student.university.edu",
        password: studentPasswords[2],
        role: "student",
        group_id: group2.id,
        is_active: true,
      },
      {
        name: "David Brown",
        email: "david.brown@student.university.edu",
        password: studentPasswords[3],
        role: "student",
        group_id: group2.id,
        is_active: true,
      },
    ]);

    console.log("✅ Sample students created");

    // Create sample internship programs
    const currentDate = new Date();
    const startDate1 = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 7
    );
    const endDate1 = new Date(startDate1.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

    const startDate2 = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 14
    );
    const endDate2 = new Date(startDate2.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days later

    const program1 = await InternshipProgram.create({
      name: "Summer Internship Program 2024 - Group A",
      description: "Software development internship for first year students",
      start_date: startDate1.toISOString().split("T")[0],
      end_date: endDate1.toISOString().split("T")[0],
      group_id: group1.id,
      disabled_days: [
        // Sample holidays (weekends and some weekdays)
        "2024-07-04", // Independence Day
        "2024-07-20", // Sample holiday
        "2024-07-21", // Weekend
        "2024-07-27", // Weekend
        "2024-07-28", // Weekend
      ],
      is_active: true,
    });

    const program2 = await InternshipProgram.create({
      name: "Advanced Internship Program 2024 - Group B",
      description:
        "Advanced software engineering internship for second year students",
      start_date: startDate2.toISOString().split("T")[0],
      end_date: endDate2.toISOString().split("T")[0],
      group_id: group2.id,
      disabled_days: [
        // Sample holidays
        "2024-07-04", // Independence Day
        "2024-07-20", // Sample holiday
        "2024-07-21", // Weekend
        "2024-07-27", // Weekend
        "2024-07-28", // Weekend
      ],
      is_active: true,
    });

    console.log("✅ Sample internship programs created");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Login Credentials:");
    console.log("Super Admin: admin@university.edu / admin123");
    console.log("Teacher 1: john.smith@university.edu / teacher123");
    console.log("Teacher 2: sarah.johnson@university.edu / teacher123");
    console.log("Student 1: alice.johnson@student.university.edu / student123");
    console.log("Student 2: bob.wilson@student.university.edu / student123");
    console.log("Student 3: carol.davis@student.university.edu / student123");
    console.log("Student 4: david.brown@student.university.edu / student123");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
};

module.exports = { seedDatabase };
