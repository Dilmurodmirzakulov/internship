import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Layout from '../layouts/Layout';
import { Blank } from '../layouts/Blank';

// Authentication pages
import LoginPage from '../pages/authentication/LoginPage';
import ForgotPasswordPage from '../pages/authentication/ForgotPasswordPage';
import ResetPasswordPage from '../pages/authentication/ResetPasswordPage';

// Main pages
import DashboardPage from '../pages/DashboardPage';

// Super Admin pages
import UsersManagementPage from '../pages/admin/UsersManagementPage';
import UserDetailPage from '../pages/admin/UserDetailPage';
import GroupsManagementPage from '../pages/admin/GroupsManagementPage';
import ProgramsManagementPage from '../pages/admin/ProgramsManagementPage';
import ReportsPage from '../pages/admin/ReportsPage';
import NotificationManagementPage from '../pages/admin/NotificationManagementPage';

// Teacher pages
import StudentsListPage from '../pages/teacher/StudentsListPage';
import StudentDiaryPage from '../pages/teacher/StudentDiaryPage';
import ReviewEntryPage from '../pages/teacher/ReviewEntryPage';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';

// Student pages
import MyDiaryPage from '../pages/student/MyDiaryPage';
import DiaryEntryPage from '../pages/student/DiaryEntryPage';

// Account pages
import AccountPage from '../pages/account/AccountPage';

// General pages
import NotificationsPage from '../pages/NotificationsPage';

// Error pages
import ErrorPage from '../pages/misc/ErrorPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AttendancePage from '../pages/teacher/AttendancePage';

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/auth/login"
        element={
          <Blank>
            <LoginPage />
          </Blank>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <Blank>
            <ForgotPasswordPage />
          </Blank>
        }
      />
      <Route
        path="/auth/reset-password/:token"
        element={
          <Blank>
            <ResetPasswordPage />
          </Blank>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Super Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <UsersManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <UserDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <GroupsManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <ProgramsManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <NotificationManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute requiredRole="teacher">
            <StudentsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/student/:studentId/diary"
        element={
          <ProtectedRoute requiredRole="teacher">
            <StudentDiaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/review/:entryId"
        element={
          <ProtectedRoute requiredRole="teacher">
            <ReviewEntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute requiredRole="teacher">
            <AttendancePage />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/diary"
        element={
          <ProtectedRoute requiredRole="student">
            <MyDiaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/diary/entry/:date?"
        element={
          <ProtectedRoute requiredRole="student">
            <DiaryEntryPage />
          </ProtectedRoute>
        }
      />

      {/* Account routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      {/* General routes */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Error routes */}
      <Route
        path="/error"
        element={
          <Blank>
            <ErrorPage />
          </Blank>
        }
      />

      {/* Redirect based on role */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Catch all - redirect to home or login */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
