import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import TeacherDashboard from './teacher/TeacherDashboard';
import AdminDashboard from './admin/AdminDashboard';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize dashboard analytics
    const initializeDashboard = () => {
      try {
        if (typeof window.dashboardAnalitics === 'function') {
          window.dashboardAnalitics();
        } else {
          // Retry after a short delay if function isn't loaded yet
          if (typeof window.dashboardAnalitics === 'function') {
            window.dashboardAnalitics();
          } else {
            console.warn('dashboardAnalitics function not found');
          }
        }
      } catch (error) {
        console.error('Error initializing dashboard analytics:', error);
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(initializeDashboard, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show different dashboards based on user role
  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'super_admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'student') {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-1">Student Dashboard</h4>
            <p className="text-muted mb-0">
              Welcome back, {user?.name}! Track your internship progress.
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="d-flex align-items-end row">
                <div className="col-sm-7">
                  <div className="card-body">
                    <h5 className="card-title text-primary">
                      Keep up the great work! 🎉
                    </h5>
                    <p className="mb-4">
                      Document your daily activities and learnings in your
                      internship diary.
                    </p>
                    <a href="/student/diary" className="btn btn-sm btn-primary">
                      View My Diary
                    </a>
                  </div>
                </div>
                <div className="col-sm-5 text-center text-sm-left">
                  <div className="card-body pb-0 px-0 px-md-4">
                    <img
                      src="/assets/img/illustrations/man-with-laptop-light.png"
                      height="140"
                      alt="Student Dashboard"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card">
              <div className="card-body text-center">
                <div className="avatar avatar-xl mx-auto mb-3">
                  <span className="avatar-initial rounded-circle bg-label-primary">
                    <i className="bx bx-book-open bx-lg"></i>
                  </span>
                </div>
                <h5 className="mb-2">Quick Actions</h5>
                <div className="d-grid gap-2">
                  <a href="/student/diary/entry" className="btn btn-primary">
                    <i className="bx bx-plus me-1"></i>
                    New Entry
                  </a>
                  <a
                    href="/student/diary"
                    className="btn btn-outline-secondary"
                  >
                    <i className="bx bx-book me-1"></i>
                    View Diary
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any other roles
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Welcome {user?.name}!</h4>
          <p className="text-muted mb-0">
            You are logged in as <span className="fw-medium">{user?.role}</span>
            . Contact your administrator if you need access.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="d-flex align-items-end row">
          <div className="col-sm-7">
            <div className="card-body">
              <h5 className="card-title text-primary">Access Restricted 🔒</h5>
              <p className="mb-4">
                Your account doesn't have permission to access this dashboard.
                Please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="col-sm-5 text-center text-sm-left">
            <div className="card-body pb-0 px-0 px-md-4">
              <img
                src="/assets/img/illustrations/man-with-laptop-light.png"
                height="140"
                alt="Access Restricted"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
