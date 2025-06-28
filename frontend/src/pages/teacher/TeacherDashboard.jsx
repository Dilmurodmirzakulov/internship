import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { token } = useAuthStore.getState();

      // Use the optimized dashboard endpoint
      const dashboardResponse = await fetch('/api/users/teacher/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();

        // Set students data
        setStudents(dashboardData.students || []);

        // Set pending entries from the optimized response
        setPendingEntries(dashboardData.pendingEntries || []);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(t('dashboard.failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgo = dateString => {
    const days = Math.floor(
      (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('dashboard.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  const totalEntries = students.reduce(
    (total, student) =>
      total + (student.diary_entries ? student.diary_entries.length : 0),
    0
  );

  const submittedEntries = students.reduce(
    (total, student) =>
      total +
      (student.diary_entries
        ? student.diary_entries.filter(e => e.is_submitted).length
        : 0),
    0
  );

  const reviewedEntries = students.reduce(
    (total, student) =>
      total +
      (student.diary_entries
        ? student.diary_entries.filter(e => e.mark !== null).length
        : 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('dashboard.teacherDashboard')}</h4>
          <p className="text-muted mb-0">
            {t('dashboard.welcomeBack', { name: user?.name })}
          </p>
        </div>
        <Link to="/teacher/students" className="btn btn-primary">
          <i className="bx bx-group me-1"></i>
          {t('navigation.students')}
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('dashboard.myStudents')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{students.length}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-group bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('dashboard.totalEntries')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{totalEntries}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-book-open bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('dashboard.pendingReview')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{pendingEntries.length}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-time bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('dashboard.reviewed')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{reviewedEntries}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-check-circle bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Pending Reviews */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('dashboard.pendingReviews')}</h5>
              {pendingEntries.length > 0 && (
                <span className="badge bg-warning">
                  {pendingEntries.length} {t('dashboard.pending')}
                </span>
              )}
            </div>
            <div className="card-body">
              {pendingEntries.length === 0 ? (
                <div className="text-center py-4">
                  <div className="avatar avatar-xl mx-auto mb-3">
                    <span className="avatar-initial rounded-circle bg-label-success">
                      <i className="bx bx-check-circle bx-lg"></i>
                    </span>
                  </div>
                  <h5 className="mb-2">{t('dashboard.allCaughtUp')}</h5>
                  <p className="text-muted mb-0">
                    {t('dashboard.noDiaryEntriesPending')}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{t('dashboard.student')}</th>
                        <th>{t('dashboard.entryDate')}</th>
                        <th>{t('dashboard.submitted')}</th>
                        <th>{t('dashboard.priority')}</th>
                        <th>{t('dashboard.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEntries.slice(0, 10).map(entry => {
                        const daysAgo = Math.floor(
                          (new Date() - new Date(entry.submitted_at)) /
                            (1000 * 60 * 60 * 24)
                        );
                        const priority =
                          daysAgo > 7
                            ? t('dashboard.high')
                            : daysAgo > 3
                              ? t('dashboard.medium')
                              : t('dashboard.low');
                        const priorityColor =
                          daysAgo > 7
                            ? 'danger'
                            : daysAgo > 3
                              ? 'warning'
                              : 'success';

                        return (
                          <tr key={entry.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-sm me-2">
                                  <span className="avatar-initial rounded-circle bg-label-primary">
                                    {entry.student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span>{entry.student.name}</span>
                              </div>
                            </td>
                            <td>{formatDate(entry.entry_date)}</td>
                            <td>
                              <small className="text-muted">
                                {getDaysAgo(entry.submitted_at)}
                              </small>
                            </td>
                            <td>
                              <span className={`badge bg-${priorityColor}`}>
                                {priority}
                              </span>
                            </td>
                            <td>
                              <Link
                                to={`/teacher/review/${entry.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bx bx-star me-1"></i>
                                {t('dashboard.review')}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {pendingEntries.length > 10 && (
                    <div className="text-center mt-3">
                      <Link
                        to="/teacher/students"
                        className="btn btn-outline-primary"
                      >
                        {t('dashboard.viewAllPendingReviews')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">{t('dashboard.quickActions')}</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <Link to="/teacher/students" className="btn btn-primary">
                  <i className="bx bx-group me-2"></i>
                  {t('dashboard.manageStudents')}
                </Link>

                <Link to="/account" className="btn btn-outline-secondary">
                  <i className="bx bx-user me-2"></i>
                  {t('dashboard.myProfile')}
                </Link>

                <button
                  className="btn btn-outline-info"
                  onClick={fetchDashboardData}
                >
                  <i className="bx bx-refresh me-2"></i>
                  {t('dashboard.refreshData')}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {students.length > 0 ? (
                <div className="timeline">
                  {students.slice(0, 5).map(student => (
                    <div key={student.id} className="timeline-item">
                      <div className="d-flex align-items-center mb-2">
                        <div className="avatar avatar-xs me-2">
                          <span className="avatar-initial rounded-circle bg-label-info">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <small className="text-muted">
                          {student.name} -{' '}
                          {student.diary_entries
                            ? student.diary_entries.length
                            : 0}{' '}
                          entries
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
