const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { requireStudent } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || "./uploads";

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and common document types
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, Word documents, and text files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
    files: 1, // Only one file per request
  },
});

// Upload file for diary entry
router.post(
  "/diary-file",
  requireStudent,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        message: "File uploaded successfully.",
        file: {
          url: fileUrl,
          name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("File upload error:", error);

      // Delete uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ message: "File upload failed." });
    }
  }
);

// Delete uploaded file
router.delete("/file/:filename", requireStudent, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_PATH || "./uploads";
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "File deleted successfully." });
    } else {
      res.status(404).json({ message: "File not found." });
    }
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({ message: "File deletion failed." });
  }
});

// Get file info (for validation)
router.get("/file/:filename", requireStudent, async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_PATH || "./uploads";
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      });
    } else {
      res.status(404).json({ message: "File not found." });
    }
  } catch (error) {
    console.error("Get file info error:", error);
    res.status(500).json({ message: "Failed to get file info." });
  }
});

module.exports = router;
