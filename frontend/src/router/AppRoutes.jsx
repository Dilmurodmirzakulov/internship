import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Layout from '../layouts/Layout';
import { Blank } from '../layouts/Blank';

// Authentication pages
import LoginPage from '../pages/authentication/LoginPage';
import ForgotPasswordPage from '../pages/authentication/ForgotPasswordPage';

// Main pages
import DashboardPage from '../pages/DashboardPage';

// Super Admin pages
import UsersManagementPage from '../pages/admin/UsersManagementPage';
import GroupsManagementPage from '../pages/admin/GroupsManagementPage';
import ProgramsManagementPage from '../pages/admin/ProgramsManagementPage';

// Teacher pages
import StudentsListPage from '../pages/teacher/StudentsListPage';
import StudentDiaryPage from '../pages/teacher/StudentDiaryPage';

// Student pages
import MyDiaryPage from '../pages/student/MyDiaryPage';
import DiaryEntryPage from '../pages/student/DiaryEntryPage';

// Account pages
import AccountPage from '../pages/account/AccountPage';

// Error pages
import ErrorPage from '../pages/misc/ErrorPage';

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

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Super Admin routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <Layout>
              <UsersManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <Layout>
              <GroupsManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <Layout>
              <ProgramsManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentsListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/student/:studentId/diary"
        element={
          <ProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentDiaryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/diary"
        element={
          <ProtectedRoute requiredRole="student">
            <Layout>
              <MyDiaryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/diary/entry/:date?"
        element={
          <ProtectedRoute requiredRole="student">
            <Layout>
              <DiaryEntryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Account routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Layout>
              <AccountPage />
            </Layout>
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
