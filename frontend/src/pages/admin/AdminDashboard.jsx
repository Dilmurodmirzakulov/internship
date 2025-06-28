import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';
import { formatDate } from '../../utils/dateUtils';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalPrograms: 0,
    activeUsers: 0,
    students: 0,
    teachers: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { token } = useAuthStore.getState();

      // Try comprehensive analytics endpoint first
      try {
        const analyticsResponse = await fetch(
          `${API_BASE_URL}/users/admin/analytics?timeframe=30`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();

          // Also fetch groups for the complete dashboard
          const groupsResponse = await fetch(`${API_BASE_URL}/groups`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const groupsData = groupsResponse.ok
            ? await groupsResponse.json()
            : { groups: [] };
          const groups = groupsData.groups || [];

          setStats({
            totalUsers: analyticsData.userStats.total,
            totalGroups: groups.length,
            totalPrograms: analyticsData.programStats.total,
            activeUsers: analyticsData.userStats.active,
            students: analyticsData.userStats.students,
            teachers: analyticsData.userStats.teachers,
            recentActivity: [], // We'll fetch recent activity separately if needed
          });
          return; // Success with analytics endpoint
        }
      } catch (analyticsError) {
        console.warn(
          'Analytics endpoint failed, falling back to individual endpoints:',
          analyticsError
        );
      }

      // Fallback to individual endpoints
      const usersResponse = await fetch(`${API_BASE_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const groupsResponse = await fetch(`${API_BASE_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const programsResponse = await fetch(`${API_BASE_URL}/programs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersResponse.ok && groupsResponse.ok && programsResponse.ok) {
        const usersData = await usersResponse.json();
        const groupsData = await groupsResponse.json();
        const programsData = await programsResponse.json();

        const users = usersData.users || [];
        const groups = groupsData.groups || [];
        const programs = programsData.programs || [];

        setStats({
          totalUsers: users.length,
          totalGroups: groups.length,
          totalPrograms: programs.length,
          activeUsers: users.filter(u => u.is_active).length,
          students: users.filter(u => u.role === 'student').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          recentActivity: users.slice(0, 5), // Last 5 users as recent activity
        });
      } else {
        setError(t('dashboard.failedToFetch'));
      }
    } catch (err) {
      setError(t('dashboard.networkError'));
    } finally {
      setLoading(false);
    }
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

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('dashboard.adminDashboard')}</h4>
          <p className="text-muted mb-0">
            {t('dashboard.adminWelcomeBack', { name: user?.name })}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/users" className="btn btn-primary">
            <i className="bx bx-user me-1"></i>
            {t('dashboard.manageUsers')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* System Stats */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('dashboard.totalUsers')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{stats.totalUsers}</h4>
                  </div>
                  <small className="text-success">
                    {stats.activeUsers} {t('dashboard.active')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-user bx-sm"></i>
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
                  <span>{t('dashboard.students')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{stats.students}</h4>
                  </div>
                  <small className="text-muted">
                    {t('dashboard.enrolledStudents')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-success">
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
                  <span>{t('dashboard.teachers')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{stats.teachers}</h4>
                  </div>
                  <small className="text-muted">
                    {t('dashboard.activeTeachers')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-info">
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
                  <span>{t('dashboard.groups')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{stats.totalGroups}</h4>
                  </div>
                  <small className="text-muted">
                    {t('dashboard.activeGroups')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-buildings bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Quick Actions */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">{t('dashboard.quickActions')}</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <Link to="/admin/users" className="btn btn-primary">
                  <i className="bx bx-user-plus me-2"></i>
                  {t('dashboard.addNewUser')}
                </Link>

                <Link to="/admin/groups" className="btn btn-outline-primary">
                  <i className="bx bx-group me-2"></i>
                  {t('dashboard.createGroup')}
                </Link>

                <Link to="/admin/programs" className="btn btn-outline-primary">
                  <i className="bx bx-calendar-plus me-2"></i>
                  {t('dashboard.addProgram')}
                </Link>

                <button
                  className="btn btn-outline-info"
                  onClick={fetchDashboardStats}
                >
                  <i className="bx bx-refresh me-2"></i>
                  {t('dashboard.refreshData')}
                </button>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">{t('dashboard.systemInformation')}</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>{t('dashboard.programs')}</span>
                <span className="fw-medium">{stats.totalPrograms}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('dashboard.activeUsers')}</span>
                <span className="fw-medium">{stats.activeUsers}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('dashboard.systemStatus')}</span>
                <span className="badge bg-success">
                  {t('dashboard.online')}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span>{t('dashboard.lastUpdated')}</span>
                <span className="text-muted">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('dashboard.recentUsers')}</h5>
              <Link
                to="/admin/users"
                className="btn btn-sm btn-outline-primary"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="card-body">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-4">
                  <div className="avatar avatar-xl mx-auto mb-3">
                    <span className="avatar-initial rounded-circle bg-label-secondary">
                      <i className="bx bx-user bx-lg"></i>
                    </span>
                  </div>
                  <h5 className="mb-2">{t('dashboard.noRecentActivity')}</h5>
                  <p className="text-muted mb-0">
                    {t('dashboard.userActivityMessage')}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{t('dashboard.user')}</th>
                        <th>{t('dashboard.role')}</th>
                        <th>{t('dashboard.group')}</th>
                        <th>{t('dashboard.status')}</th>
                        <th>{t('dashboard.joined')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentActivity.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-sm me-2">
                                <span className="avatar-initial rounded-circle bg-label-primary">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h6 className="mb-0">{user.name}</h6>
                                <small className="text-muted">
                                  {user.email}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge bg-${
                                user.role === 'super_admin'
                                  ? 'danger'
                                  : user.role === 'teacher'
                                    ? 'primary'
                                    : 'success'
                              }`}
                            >
                              {user.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {user.group ? (
                              <span className="text-primary">
                                {user.group.name}
                              </span>
                            ) : (
                              <span className="text-muted">
                                {t('dashboard.noGroup')}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge bg-${user.is_active ? 'success' : 'secondary'}`}
                            >
                              {user.is_active
                                ? t('dashboard.activeStatus')
                                : t('dashboard.inactiveStatus')}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(user.created_at, t('common.notSet'))}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
