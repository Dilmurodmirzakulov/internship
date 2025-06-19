# Internship Tracker Backend

A comprehensive backend API for managing university internship programs with role-based access control.

## Features

- **Role-based Authentication**: Super Admin, Teacher, and Student roles
- **User Management**: Create, update, and manage users and groups
- **Internship Programs**: Manage program dates and disabled days (holidays)
- **Diary System**: Students submit daily reports, teachers mark them
- **File Upload**: Support for images, PDFs, and documents (max 5MB)
- **PostgreSQL Database**: Robust data storage with Sequelize ORM
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling with detailed responses

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** database
- **Sequelize** ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **multer** for file uploads
- **express-validator** for input validation

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=internship_tracker
   DB_USER=postgres
   DB_PASSWORD=your_password

   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads

   FRONTEND_URL=http://localhost:5173
   ```

4. **Create PostgreSQL database:**

   ```sql
   CREATE DATABASE internship_tracker;
   ```

5. **Run database migrations and seed data:**

   ```bash
   npm run dev
   ```

   The server will automatically sync the database and seed sample data on first run.

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password (Super Admin only)
- `POST /api/auth/logout` - Logout

### Users (Super Admin)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id` - Get user by ID

### Groups

- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group (Super Admin)
- `PUT /api/groups/:id` - Update group (Super Admin)
- `DELETE /api/groups/:id` - Delete group (Super Admin)
- `GET /api/groups/:id` - Get group by ID

### Programs

- `GET /api/programs` - Get all programs
- `POST /api/programs` - Create program (Super Admin)
- `PUT /api/programs/:id` - Update program (Super Admin)
- `DELETE /api/programs/:id` - Delete program (Super Admin)
- `GET /api/programs/:id` - Get program by ID
- `GET /api/programs/group/:groupId` - Get program by group

### Diary

- `GET /api/diary/my-diary` - Get own diary entries (Students)
- `GET /api/diary/student/:studentId` - Get student diary (Teachers)
- `POST /api/diary/entry` - Create/update diary entry (Students)
- `POST /api/diary/mark/:entryId` - Mark diary entry (Teachers)
- `GET /api/diary/entry/:entryId` - Get diary entry by ID
- `GET /api/diary/program-dates/:groupId` - Get program dates for calendar

### File Upload

- `POST /api/upload/diary-file` - Upload file for diary entry
- `DELETE /api/upload/file/:filename` - Delete uploaded file
- `GET /api/upload/file/:filename` - Get file info

## Role Permissions

### Super Admin

- Full access to all endpoints
- Can create, update, delete users, groups, and programs
- Can reset any user's password
- Can manage all groups and programs

### Teacher

- Can view students in their assigned group
- Can view and mark diary entries for their group students
- Can view their group's internship program
- Cannot access other groups' data

### Student

- Can view and update their own diary entries
- Can upload files for their diary entries
- Can view their group's internship program
- Cannot access other students' data

## Sample Data

The seeder creates sample data with these credentials:

**Super Admin:**

- Email: `admin@university.edu`
- Password: `admin123`

**Teachers:**

- Email: `john.smith@university.edu` / Password: `teacher123`
- Email: `sarah.johnson@university.edu` / Password: `teacher123`

**Students:**

- Email: `alice.johnson@student.university.edu` / Password: `student123`
- Email: `bob.wilson@student.university.edu` / Password: `student123`
- Email: `carol.davis@student.university.edu` / Password: `student123`
- Email: `david.brown@student.university.edu` / Password: `student123`

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Health check
curl http://localhost:5000/api/health
```

## File Upload

- **Supported formats**: Images (JPEG, PNG, GIF), PDFs, Word documents, text files
- **Maximum size**: 5MB per file
- **Storage**: Local file system (configurable via `UPLOAD_PATH`)
- **Security**: Unique filenames, file type validation

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers
- File upload restrictions

## Database Schema

### Users

- UUID primary key
- Name, email, password
- Role (super_admin, teacher, student)
- Group association
- Active status

### Groups

- UUID primary key
- Name, description
- Active status

### Internship Programs

- UUID primary key
- Name, description
- Start/end dates
- Disabled days (holidays)
- Group association

### Diary Entries

- UUID primary key
- Entry date
- Text report
- File attachment
- Mark (0-100)
- Teacher comments
- Student and teacher associations

## License

MIT License
