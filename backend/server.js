const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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
const attendanceRoutes = require("./src/routes/attendance");
const NotificationService = require("./src/services/notificationService");

const errorHandler = require("./src/middleware/errorHandler");
const { auth: authMiddleware } = require("./src/middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment and other cloud platforms
app.set("trust proxy", true);

// Production security headers
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "Internship Tracker API");
    next();
  });
}

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174", // Vite dev server alternative port
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://beautiful-boba-4352fc.netlify.app",
  "https://685f9488966d03230038ae17--beautiful-boba-4352fc.netlify.app", // Latest deploy URL
  "https://techamal-production.up.railway.app", // Railway public URL
  "https://techamal.uz", // Production frontend domain
  "https://www.techamal.uz", // Production frontend (www) domain
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

// Regex-based domain patterns for robust matching in production
const allowedDomainPatterns = [
  /^https?:\/\/([a-z0-9-]+\.)*techamal\.uz$/i,
  /netlify\.app$/i,
  /vercel\.app$/i,
  /railway\.app$/i,
  /render\.com$/i,
];

// Top-level manual preflight responder to satisfy edge proxies before any other middleware
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const requestOrigin = req.get("Origin");
    const isAllowedExact = requestOrigin && allowedOrigins.includes(requestOrigin);
    const isAllowedByPattern = requestOrigin && allowedDomainPatterns.some((rx) => rx.test(requestOrigin));

    if (
      process.env.ALLOW_ALL_ORIGINS === "true" ||
      isAllowedExact ||
      isAllowedByPattern ||
      (process.env.NODE_ENV !== "production" &&
        requestOrigin && /^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(requestOrigin))
    ) {
      res.header("Access-Control-Allow-Origin", requestOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS,PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With,Accept,Origin"
      );
      res.header("Access-Control-Max-Age", "86400");
    }
    return res.status(204).end();
  }
  return next();
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

console.log("🌐 Allowed CORS origins:", allowedOrigins);
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🔧 CORS_ORIGIN env var:", process.env.CORS_ORIGIN);
console.log("🔧 FRONTEND_URL env var:", process.env.FRONTEND_URL);

// Early header setter to ensure ACAO is present even on error responses
app.use((req, res, next) => {
  const requestOrigin = req.get("Origin");
  if (requestOrigin) {
    const isAllowedExact = allowedOrigins.includes(requestOrigin);
    const isAllowedByPattern = allowedDomainPatterns.some((rx) =>
      rx.test(requestOrigin)
    );
    if (
      process.env.ALLOW_ALL_ORIGINS === "true" ||
      isAllowedExact ||
      isAllowedByPattern ||
      // Always allow localhost-like origins in non-production
      (process.env.NODE_ENV !== "production" &&
        /^(https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(requestOrigin))
    ) {
      res.header("Access-Control-Allow-Origin", requestOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }
  }
  next();
});

app.use(
  cors({
    // Allow requests through; actual ACAO is controlled by our header setter above
    // This avoids 500 errors like "Not allowed by CORS" from the cors package
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Length", "X-Requested-With"],
    maxAge: 86400, // 24 hours for preflight cache
    optionsSuccessStatus: 204,
    preflightContinue: false,
  })
);

// Explicit OPTIONS handler for all routes
app.options("*", cors());
// Specific preflight handler for auth endpoints (helps some proxies)
app.options("/api/auth/*", cors());

// Add CORS debugging middleware
app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin) {
    console.log(
      `🔍 Request from origin: ${origin} to ${req.method} ${req.path}`
    );
  }
  next();
});

console.log("🚀 Rate limiting DISABLED for debugging");

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (for uploaded files) with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Access-Control-Allow-Origin", "*");
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
app.use("/api/attendance", authMiddleware, attendanceRoutes);

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

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  const origin = req.get("Origin");
  res.json({
    message: "CORS is working!",
    origin: origin || "No origin header",
    timestamp: new Date().toISOString(),
    headers: {
      "access-control-allow-origin": res.get("Access-Control-Allow-Origin"),
      "access-control-allow-credentials": res.get(
        "Access-Control-Allow-Credentials"
      ),
    },
  });
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
