require("dotenv").config();
const { sequelize } = require("./src/database/connection");
const { seedDatabase } = require("./src/database/seeder");

const runSeeder = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    console.log("🔄 Syncing database...");
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log("✅ Database synced.");

    await seedDatabase();

    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeeder();
