# 🎓 University Internship Tracking System

A comprehensive full-stack web application for managing university internship programs with role-based access control for Super Admins, Teachers, and Students.

## 🌟 Features

### 👨‍💼 Super Admin

- **User Management**: Create, update, and manage all users (teachers and students)
- **Group Management**: Create and manage student groups
- **Program Management**: Set up internship programs with date ranges and disabled days (holidays)
- **Password Management**: Reset passwords for any user
- **Full System Access**: Complete oversight of the entire system

### 👩‍🏫 Teacher

- **Student Oversight**: View students assigned to their group
- **Diary Management**: Review and mark student daily reports
- **Progress Tracking**: Monitor student internship progress
- **Grading System**: Assign numeric marks (0-100) and comments

### 🎓 Student

- **Daily Diary**: Submit daily internship reports
- **File Upload**: Attach documents, images, or files to diary entries
- **Progress View**: Track their own internship progress and marks
- **Calendar Integration**: View program dates and disabled days

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js
- **PostgreSQL** database
- **Sequelize** ORM
- **JWT** authentication
- **bcryptjs** for password hashing
- **multer** for file uploads
- **express-validator** for input validation

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management
- **React Router** for navigation
- **Bootstrap 5** with Sneat admin theme
- **Axios** for API calls

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**

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

5. **Start the backend server:**

   ```bash
   npm run dev
   ```

   The server will automatically sync the database and seed sample data.

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

## 🔐 Demo Credentials

The system comes with pre-seeded demo data:

### Super Admin

- **Email**: `admin@university.edu`
- **Password**: `admin123`

### Teachers

- **Email**: `john.smith@university.edu` / **Password**: `teacher123`
- **Email**: `sarah.johnson@university.edu` / **Password**: `teacher123`

### Students

- **Email**: `alice.johnson@student.university.edu` / **Password**: `student123`
- **Email**: `bob.wilson@student.university.edu` / **Password**: `student123`
- **Email**: `carol.davis@student.university.edu` / **Password**: `student123`
- **Email**: `david.brown@student.university.edu` / **Password**: `student123`

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset password (Super Admin only)

### User Management (Super Admin)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Group Management

- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group (Super Admin)
- `PUT /api/groups/:id` - Update group (Super Admin)
- `DELETE /api/groups/:id` - Delete group (Super Admin)

### Program Management

- `GET /api/programs` - Get all programs
- `POST /api/programs` - Create program (Super Admin)
- `PUT /api/programs/:id` - Update program (Super Admin)
- `DELETE /api/programs/:id` - Delete program (Super Admin)

### Diary Management

- `GET /api/diary/my-diary` - Get own diary entries (Students)
- `GET /api/diary/student/:studentId` - Get student diary (Teachers)
- `POST /api/diary/entry` - Create/update diary entry (Students)
- `POST /api/diary/mark/:entryId` - Mark diary entry (Teachers)

### File Upload

- `POST /api/upload/diary-file` - Upload file for diary entry
- `DELETE /api/upload/file/:filename` - Delete uploaded file

## 🗄️ Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password` (String, Hashed)
- `role` (Enum: super_admin, teacher, student)
- `group_id` (UUID, Foreign Key)
- `is_active` (Boolean)
- `last_login` (DateTime)

### Groups Table

- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (Text)
- `is_active` (Boolean)

### Internship Programs Table

- `id` (UUID, Primary Key)
- `name` (String)
- `description` (Text)
- `start_date` (Date)
- `end_date` (Date)
- `group_id` (UUID, Foreign Key)
- `disabled_days` (JSONB Array)
- `is_active` (Boolean)

### Diary Entries Table

- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key)
- `teacher_id` (UUID, Foreign Key)
- `entry_date` (Date)
- `text_report` (Text)
- `file_url` (String)
- `file_name` (String)
- `file_size` (Integer)
- `mark` (Integer, 0-100)
- `teacher_comment` (Text)
- `is_submitted` (Boolean)
- `submitted_at` (DateTime)
- `marked_at` (DateTime)

## 🔒 Security Features

- **JWT Authentication** with role-based access control
- **Password Hashing** using bcrypt
- **Input Validation** and sanitization
- **File Upload Security** with type and size restrictions
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **SQL Injection Protection** via Sequelize ORM

## 🚀 Deployment

### Backend Deployment

1. Set environment variables for production
2. Configure PostgreSQL database
3. Run database migrations: `npm run migrate`
4. Start production server: `npm start`

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for API endpoints

## 📝 Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm test            # Run tests
npm run migrate     # Run database migrations
```

### Frontend Development

```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm test           # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:

- Email: support@university.edu
- Documentation: [Project Wiki](../../wiki)
- Issues: [GitHub Issues](../../issues)

## 🙏 Acknowledgments

- [Sneat Admin Template](https://themeselection.com/item/sneat-bootstrap-html-admin-template/) for the beautiful UI design
- [React](https://reactjs.org/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework
- [PostgreSQL](https://www.postgresql.org/) for the robust database system
