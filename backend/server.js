const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const { sequelize } = require("./src/database/connection");
const { swaggerUi, specs } = require("./src/config/swagger");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const groupRoutes = require("./src/routes/groups");
const programRoutes = require("./src/routes/programs");
const diaryRoutes = require("./src/routes/diary");
const uploadRoutes = require("./src/routes/upload");
const notificationRoutes = require("./src/routes/notifications");
const NotificationService = require("./src/services/notificationService");

const errorHandler = require("./src/middleware/errorHandler");
const { auth: authMiddleware } = require("./src/middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment
app.set("trust proxy", true);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting - more generous for production deployment
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very generous limit for production deployment
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://beautiful-boba-4352fc.netlify.app",
  "https://685f9488966d03230038ae17--beautiful-boba-4352fc.netlify.app", // Latest deploy URL
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("🌐 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔍 CORS request from origin:", origin);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Be more permissive - allow all Netlify domains and localhost
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes("netlify.app") ||
        origin.includes("localhost")
      ) {
        console.log("✅ CORS allowed for:", origin);
        callback(null, true);
      } else {
        console.log("❌ CORS blocked for:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (for uploaded files) with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    const origin = req.get("Origin");
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Swagger API Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Internship Tracker API Documentation",
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/groups", authMiddleware, groupRoutes);
app.use("/api/programs", authMiddleware, programRoutes);
app.use("/api/diary", authMiddleware, diaryRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Internship Tracker API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 */
app.get("/api/health", async (req, res) => {
  try {
    let dbStatus = "disconnected";
    try {
      await sequelize.authenticate();
      dbStatus = "connected";
    } catch (error) {
      dbStatus = "disconnected";
    }

    res.json({
      status: "OK",
      message: "Internship Tracker API is running",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.json({
      status: "OK",
      message: "Internship Tracker API is running",
      timestamp: new Date().toISOString(),
      database: "unknown",
      environment: process.env.NODE_ENV || "development",
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const startServer = async () => {
  try {
    console.log("🚀 Starting server...");

    // Start the HTTP server first
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    });

    // Initialize database in the background
    initializeDatabase();
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Initialize database separately
const initializeDatabase = async () => {
  try {
    console.log("🔄 Connecting to database...");

    // Test database connection with timeout
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          10000
        )
      ),
    ]);
    console.log("✅ Database connection established successfully.");

    // Sync database
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized.");
    } else {
      // In production, sync without alter to create tables if they don't exist
      await sequelize.sync({ force: false });
      console.log("✅ Database synchronized (production mode).");
    }

    // Start notification scheduler after database is ready
    startNotificationScheduler();
  } catch (error) {
    console.error("⚠️ Database initialization failed:", error.message);
    console.log("🔄 Server will continue running without database features");
    // Don't exit - let the server run without database
  }
};

// Notification scheduler
const startNotificationScheduler = () => {
  console.log("📅 Starting notification scheduler...");

  // Send diary reminders every day at 9 AM
  const scheduleReminders = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0);

    // If it's already past 9 AM today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNext = scheduledTime.getTime() - now.getTime();

    setTimeout(async () => {
      await NotificationService.sendDiaryReminders();
      // Schedule the next reminder
      setInterval(async () => {
        await NotificationService.sendDiaryReminders();
      }, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilNext);

    console.log(
      `📅 Next diary reminder scheduled for: ${scheduledTime.toLocaleString()}`
    );
  };

  // Clean up expired notifications every 6 hours
  const scheduleCleanup = () => {
    setInterval(async () => {
      await NotificationService.cleanupExpiredNotifications();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  };

  scheduleReminders();
  scheduleCleanup();
};

startServer();
