# University Internship Tracking System API Documentation

This document provides information about the API documentation and how to access it.

## 📚 Swagger Documentation

The API documentation is automatically generated using Swagger/OpenAPI 3.0 specification and is available at:

### Development Environment

- **URL**: `http://localhost:5000/api/docs`
- **Access**: Available when the server is running in development mode

### Production Environment

- **URL**: `https://your-domain.com/api/docs` (replace with your actual domain)

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- PostgreSQL database configured
- Environment variables set up (see `.env.example`)

### Running the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

### Accessing Documentation

1. Start the server using the commands above
2. Open your browser and navigate to `http://localhost:5000/api/docs`
3. You'll see the interactive Swagger UI interface

## 🔐 Authentication

Most API endpoints require authentication using JWT tokens. Here's how to use them:

### 1. Login to Get Token

First, make a POST request to `/api/auth/login` with your credentials:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### 2. Use Token in Requests

Include the JWT token in the Authorization header for protected endpoints:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### 3. Using Swagger UI Authorization

1. Click the "Authorize" button in the Swagger UI
2. Enter your JWT token in the format: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize" to apply to all requests

## 📋 API Endpoints Overview

### Authentication (`/api/auth`)

- `POST /login` - User login
- `GET /me` - Get current user info
- `POST /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password-token` - Reset password with token
- `POST /logout` - User logout

### Users (`/api/users`)

- `GET /` - Get all users (Super Admin only)
- `GET /students` - Get students for teachers
- `GET /group/:groupId` - Get users by group
- `POST /` - Create user (Super Admin only)
- `PUT /:id` - Update user (Super Admin only)
- `DELETE /:id` - Delete user (Super Admin only)

### Groups (`/api/groups`)

- Group management endpoints for organizing students

### Programs (`/api/programs`)

- Internship program management endpoints

### Diary (`/api/diary`)

- Student diary entry management
- Teacher review and marking system

### Notifications (`/api/notifications`)

- User notification system

### Upload (`/api/upload`)

- File upload handling

### Health (`/api/health`)

- `GET /health` - API health check

## 👥 User Roles

The system supports three user roles:

### Super Admin

- Full system access
- User management
- Program and group management
- System configuration

### Teacher

- View assigned group students
- Review and mark diary entries
- Student progress tracking

### Student

- Create and manage diary entries
- View personal progress
- Receive notifications

## 📊 Response Formats

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Pagination Response

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

## 🔍 Testing the API

### Using Swagger UI

1. Navigate to the API documentation URL
2. Expand any endpoint section
3. Click "Try it out"
4. Fill in required parameters
5. Click "Execute" to test the endpoint

### Using cURL

```bash
# Example: Login request
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Example: Get current user (with token)
curl -X GET "http://localhost:5000/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Using Postman

1. Import the API collection from Swagger (use the `/api/docs.json` endpoint)
2. Set up environment variables for base URL and authentication token
3. Test endpoints using the imported collection

## 🛠️ Development

### Adding New Endpoints

When adding new endpoints, make sure to include Swagger documentation:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Description of your endpoint
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourSchema'
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/your-endpoint", middleware, handler);
```

### Updating Schemas

Schemas are defined in `/src/config/swagger.js`. Update them when your data models change.

## 📞 Support

For API support or questions:

- Email: support@example.com
- Documentation Issues: Create an issue in the project repository
- Feature Requests: Contact the development team

## 📝 License

This API is licensed under the MIT License. See the LICENSE file for details.

---

_Last updated: January 2024_
