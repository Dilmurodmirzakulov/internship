require("dotenv").config();
const { sequelize } = require("./src/database/connection");
const { User } = require("./src/models");

const runProductionSeeder = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    console.log("🔄 Syncing database (production safe)...");
    // Use sync without force to create tables if they don't exist
    await sequelize.sync({ force: false });
    console.log("✅ Database synced safely.");

    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      where: { role: "super_admin" },
    });

    if (existingAdmin) {
      console.log("✅ Super admin already exists. Skipping seeding.");
      console.log(`📧 Super admin email: ${existingAdmin.email}`);
    } else {
      console.log("🌱 Creating initial super admin...");

      const superAdmin = await User.create({
        name: "Super Administrator",
        email: "admin@university.edu",
        password: "admin123", // Change this after first login!
        role: "super_admin",
        is_active: true,
      });

      console.log("✅ Super admin created successfully!");
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`🔑 Password: admin123`);
      console.log(
        "⚠️  IMPORTANT: Please change the password after first login!"
      );
    }

    console.log("\n🎉 Production seeding completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Login with super admin credentials");
    console.log("   2. Change the default password");
    console.log("   3. Create your groups, teachers, and students");

    process.exit(0);
  } catch (error) {
    console.error("❌ Production seeding failed:", error);
    process.exit(1);
  }
};

runProductionSeeder();
