const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "University Internship Tracking System API",
      version: "1.0.0",
      description:
        "A comprehensive API for managing university internship programs, student diary entries, and progress tracking.",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.yourdomain.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Groups",
        description: "Group management endpoints",
      },
      {
        name: "Programs",
        description: "Internship program management endpoints",
      },
      {
        name: "Diary",
        description: "Student diary entry management endpoints",
      },
      {
        name: "Notifications",
        description: "User notification management endpoints",
      },
      {
        name: "Upload",
        description: "File upload endpoints",
      },
      {
        name: "Health",
        description: "API health check endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User ID",
            },
            name: {
              type: "string",
              description: "User full name",
              minLength: 2,
              maxLength: 100,
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            role: {
              type: "string",
              enum: ["super_admin", "teacher", "student"],
              description: "User role in the system",
            },
            is_active: {
              type: "boolean",
              description: "Whether the user account is active",
            },
            last_login: {
              type: "string",
              format: "date-time",
              description: "Last login timestamp",
            },
            profile_image: {
              type: "string",
              description: "Path to profile image",
            },
            group_id: {
              type: "string",
              format: "uuid",
              description: "Group ID (for students)",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Group: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              description: "Group name",
            },
            description: {
              type: "string",
              description: "Group description",
            },
            program_id: {
              type: "string",
              format: "uuid",
              description: "Associated program ID",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        InternshipProgram: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              description: "Program name",
            },
            description: {
              type: "string",
              description: "Program description",
            },
            start_date: {
              type: "string",
              format: "date",
            },
            end_date: {
              type: "string",
              format: "date",
            },
            is_active: {
              type: "boolean",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        DiaryEntry: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            student_id: {
              type: "string",
              format: "uuid",
            },
            entry_date: {
              type: "string",
              format: "date",
            },
            content: {
              type: "string",
              description: "Diary entry content",
            },
            activities: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of activities performed",
            },
            learning_outcomes: {
              type: "string",
              description: "What the student learned",
            },
            challenges: {
              type: "string",
              description: "Challenges faced",
            },
            supervisor_feedback: {
              type: "string",
              description: "Feedback from workplace supervisor",
            },
            is_submitted: {
              type: "boolean",
            },
            submitted_at: {
              type: "string",
              format: "date-time",
            },
            mark: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            teacher_feedback: {
              type: "string",
              description: "Teacher feedback on the entry",
            },
            marked_at: {
              type: "string",
              format: "date-time",
            },
            marked_by: {
              type: "string",
              format: "uuid",
              description: "ID of teacher who marked the entry",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            user_id: {
              type: "string",
              format: "uuid",
            },
            type: {
              type: "string",
              enum: ["diary_reminder", "entry_reviewed", "system_announcement"],
            },
            title: {
              type: "string",
            },
            message: {
              type: "string",
            },
            is_read: {
              type: "boolean",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
              description: "Validation errors",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "User password",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
            token: {
              type: "string",
              description: "JWT authentication token",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              minLength: 6,
            },
            newPassword: {
              type: "string",
              minLength: 6,
            },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: {
              type: "string",
              minLength: 32,
            },
            newPassword: {
              type: "string",
              minLength: 6,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
