const { User, Group, InternshipProgram, TeacherGroup } = require("../models");
const bcrypt = require("bcryptjs");

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Create super admin
    const superAdmin = await User.create({
      name: "Super Administrator",
      email: "admin@university.edu",
      password: "admin123",
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

    const group3 = await Group.create({
      name: "Computer Science Group C",
      description: "Third year computer science students",
      is_active: true,
    });

    console.log("✅ Sample groups created");

    // Create sample teachers
    const teacher1 = await User.create({
      name: "Dr. John Smith",
      email: "john.smith@university.edu",
      password: "teacher123",
      role: "teacher",
      is_active: true,
    });

    const teacher2 = await User.create({
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu",
      password: "teacher123",
      role: "teacher",
      is_active: true,
    });

    const teacher3 = await User.create({
      name: "Prof. Michael Davis",
      email: "michael.davis@university.edu",
      password: "teacher123",
      role: "teacher",
      is_active: true,
    });

    console.log("✅ Sample teachers created");

    // Create teacher-group assignments (many-to-many)
    // Teacher 1 supervises Group A and Group C
    await teacher1.setAssignedGroups([group1.id, group3.id]);

    // Teacher 2 supervises Group B only
    await teacher2.setAssignedGroups([group2.id]);

    // Teacher 3 supervises all groups
    await teacher3.setAssignedGroups([group1.id, group2.id, group3.id]);

    console.log("✅ Teacher-group assignments created");

    // Create sample students
    const student1 = await User.create({
      name: "Alice Johnson",
      email: "alice.johnson@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group1.id,
      is_active: true,
    });

    const student2 = await User.create({
      name: "Bob Wilson",
      email: "bob.wilson@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group1.id,
      is_active: true,
    });

    const student3 = await User.create({
      name: "Carol Davis",
      email: "carol.davis@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group2.id,
      is_active: true,
    });

    const student4 = await User.create({
      name: "David Brown",
      email: "david.brown@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group2.id,
      is_active: true,
    });

    const student5 = await User.create({
      name: "Eva Martinez",
      email: "eva.martinez@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group3.id,
      is_active: true,
    });

    const student6 = await User.create({
      name: "Frank Thompson",
      email: "frank.thompson@student.university.edu",
      password: "student123",
      role: "student",
      group_id: group3.id,
      is_active: true,
    });

    console.log("✅ Sample students created");

    // Create sample internship programs
    const currentDate = new Date();

    // July 2025 program (whole month)
    const startDate1 = new Date(2025, 6, 1); // July 1, 2025 (month is 0-indexed)
    const endDate1 = new Date(2025, 6, 31); // July 31, 2025

    // August 2025 program
    const startDate2 = new Date(2025, 7, 1); // August 1, 2025
    const endDate2 = new Date(2025, 7, 31); // August 31, 2025

    // September 2025 program
    const startDate3 = new Date(2025, 8, 1); // September 1, 2025
    const endDate3 = new Date(2025, 8, 30); // September 30, 2025

    // Create program for Group A only (July 2025)
    const program1 = await InternshipProgram.create({
      name: "July 2025 Software Development Internship",
      description:
        "Software development internship for first year students - July 2025",
      start_date: startDate1.toISOString().split("T")[0],
      end_date: endDate1.toISOString().split("T")[0],
      group_id: group1.id,
      disabled_days: ["saturday", "sunday"],
      is_active: true,
    });

    // Create program for Group B only (August 2025)
    const program2 = await InternshipProgram.create({
      name: "August 2025 Advanced Engineering Internship",
      description:
        "Advanced software engineering internship for second year students - August 2025",
      start_date: startDate2.toISOString().split("T")[0],
      end_date: endDate2.toISOString().split("T")[0],
      group_id: group2.id,
      disabled_days: ["saturday", "sunday"],
      is_active: true,
    });

    // Create program for multiple groups (September 2025)
    const program3 = await InternshipProgram.create({
      name: "September 2025 Cross-Department Research Program",
      description:
        "Research-focused internship program spanning multiple departments - September 2025",
      start_date: startDate3.toISOString().split("T")[0],
      end_date: endDate3.toISOString().split("T")[0],
      disabled_days: ["friday", "saturday", "sunday"],
      is_active: true,
    });

    // Assign multiple groups to program3
    await program3.setAssignedGroups([group1.id, group3.id]);

    // Create another multi-group program (October-November 2025)
    const startDate4 = new Date(2025, 9, 1); // October 1, 2025
    const endDate4 = new Date(2025, 10, 30); // November 30, 2025

    const program4 = await InternshipProgram.create({
      name: "October-November 2025 University Innovation Challenge",
      description:
        "Comprehensive internship program involving all student groups - October-November 2025",
      start_date: startDate4.toISOString().split("T")[0],
      end_date: endDate4.toISOString().split("T")[0],
      disabled_days: ["saturday", "sunday"],
      is_active: true,
    });

    // Assign all groups to program4
    await program4.setAssignedGroups([group1.id, group2.id, group3.id]);

    console.log(
      "✅ Sample internship programs created with multi-group assignments"
    );

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Login Credentials:");
    console.log("Super Admin: admin@university.edu / admin123");
    console.log(
      "Teacher 1 (Groups A,C): john.smith@university.edu / teacher123"
    );
    console.log(
      "Teacher 2 (Group B): sarah.johnson@university.edu / teacher123"
    );
    console.log(
      "Teacher 3 (All Groups): michael.davis@university.edu / teacher123"
    );
    console.log("Student 1: alice.johnson@student.university.edu / student123");
    console.log("Student 2: bob.wilson@student.university.edu / student123");
    console.log("Student 3: carol.davis@student.university.edu / student123");
    console.log("Student 4: david.brown@student.university.edu / student123");
    console.log("Student 5: eva.martinez@student.university.edu / student123");
    console.log(
      "Student 6: frank.thompson@student.university.edu / student123"
    );
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
};

module.exports = { seedDatabase };
