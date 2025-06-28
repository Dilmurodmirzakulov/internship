import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../layouts/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

const UserDetailPage = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [diaryStats, setDiaryStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    is_active: true,
  });

  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserDiaryStats();
      fetchUserNotifications();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const { token } = useAuthStore.getState();
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          is_active: data.user.is_active,
        });
      } else if (response.status === 404) {
        setError(t('errors.userNotFound'));
      } else {
        setError(t('errors.failedToFetchUserDetails'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDiaryStats = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`/api/diary/student/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Calculate statistics from diary entries
        const stats = {
          totalEntries: data.entries?.length || 0,
          submittedEntries:
            data.entries?.filter(
              entry => entry.content && entry.content.trim() !== ''
            ).length || 0,
          reviewedEntries:
            data.entries?.filter(entry => entry.reviewed_by).length || 0,
          averageRating:
            data.entries?.length > 0
              ? data.entries.reduce(
                  (sum, entry) => sum + (entry.rating || 0),
                  0
                ) / data.entries.length
              : 0,
          lastEntryDate:
            data.entries?.length > 0
              ? new Date(
                  Math.max(
                    ...data.entries.map(entry => new Date(entry.created_at))
                  )
                ).toLocaleDateString()
              : t('diary.noEntriesYet'),
        };
        setDiaryStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch diary stats:', err);
    }
  };

  const fetchUserNotifications = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `/api/notifications?user_id=${userId}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateUser = async e => {
    e.preventDefault();
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchUserDetails(); // Refresh user data
        // Show success message
        alert(t('userDetail.userUpdatedSuccessfully'));
      } else {
        const errorData = await response.json();
        alert(errorData.message || t('userDetail.failedToUpdateUser'));
      }
    } catch (err) {
      alert(t('userDetail.networkErrorOccurred'));
    }
  };

  const getRoleBadge = role => {
    const roleConfig = {
      super_admin: { class: 'bg-danger', text: t('user.superAdmin') },
      teacher: { class: 'bg-info', text: t('user.teacher') },
      student: { class: 'bg-success', text: t('user.student') },
    };
    const config = roleConfig[role] || { class: 'bg-secondary', text: role };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getStatusBadge = isActive => {
    return isActive ? (
      <span className="badge bg-success">{t('user.active')}</span>
    ) : (
      <span className="badge bg-secondary">{t('user.inactive')}</span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-xxl flex-grow-1 container-p-y">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <div className="error-container">
                    <h4 className="text-danger">{error}</h4>
                    <p className="text-muted">{t('userDetail.userNotFound')}</p>
                    <Link to="/admin/users" className="btn btn-primary">
                      <i className="bx bx-arrow-back me-2"></i>
                      {t('userDetail.backToUsers')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-xxl flex-grow-1 container-p-y">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/admin/dashboard">{t('userDetail.dashboard')}</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/admin/users">{t('userDetail.users')}</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {user?.name}
            </li>
          </ol>
        </nav>

        {/* User Header */}
        <div className="row">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-sm-auto">
                    <div className="avatar avatar-xl me-3">
                      <span className="avatar-initial rounded-circle bg-label-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h4 className="mb-1">{user?.name}</h4>
                        <p className="text-muted mb-0">{user?.email}</p>
                        <div className="mt-2">
                          {getRoleBadge(user?.role)}
                          <span className="mx-2">
                            {getStatusBadge(user?.is_active)}
                          </span>
                          {user?.group && (
                            <span className="badge bg-outline-primary">
                              {t('user.group')}: {user.group.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowEditModal(true)}
                        >
                          <i className="bx bx-edit me-1"></i>
                          {t('userDetail.editUser')}
                        </button>
                        <Link
                          to="/admin/users"
                          className="btn btn-outline-secondary"
                        >
                          <i className="bx bx-arrow-back me-1"></i>
                          {t('userDetail.backToUsers')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="nav-align-top mb-4">
                  <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                      >
                        <i className="bx bx-user me-2"></i>
                        {t('userDetail.overview')}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                      >
                        <i className="bx bx-detail me-2"></i>
                        {t('userDetail.details')}
                      </button>
                    </li>
                    {user?.role === 'student' && (
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeTab === 'diary' ? 'active' : ''}`}
                          onClick={() => setActiveTab('diary')}
                        >
                          <i className="bx bx-book me-2"></i>
                          {t('userDetail.diaryActivity')}
                        </button>
                      </li>
                    )}
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                      >
                        <i className="bx bx-bell me-2"></i>
                        {t('userDetail.notifications')}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card-body">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card border h-100">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            {t('userDetail.basicInformation')}
                          </h5>
                        </div>
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-0">
                                {t('userDetail.fullName')}:
                              </h6>
                            </div>
                            <div className="col-sm-8">
                              <p className="text-muted mb-0">{user?.name}</p>
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-0">{t('userDetail.email')}:</h6>
                            </div>
                            <div className="col-sm-8">
                              <p className="text-muted mb-0">{user?.email}</p>
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-0">{t('userDetail.role')}:</h6>
                            </div>
                            <div className="col-sm-8">
                              {getRoleBadge(user?.role)}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-0">
                                {t('userDetail.status')}:
                              </h6>
                            </div>
                            <div className="col-sm-8">
                              {getStatusBadge(user?.is_active)}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-0">
                                {t('userDetail.created')}:
                              </h6>
                            </div>
                            <div className="col-sm-8">
                              <p className="text-muted mb-0">
                                {new Date(
                                  user?.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-4">
                              <h6 className="mb-0">
                                {t('userDetail.lastUpdated')}:
                              </h6>
                            </div>
                            <div className="col-sm-8">
                              <p className="text-muted mb-0">
                                {new Date(
                                  user?.updated_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card border h-100">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            {t('userDetail.groupInformation')}
                          </h5>
                        </div>
                        <div className="card-body">
                          {user?.role === 'student' && (
                            <>
                              <div className="row mb-3">
                                <div className="col-sm-4">
                                  <h6 className="mb-0">
                                    {t('userDetail.assignedGroup')}:
                                  </h6>
                                </div>
                                <div className="col-sm-8">
                                  {user?.group ? (
                                    <span className="badge bg-primary">
                                      {user.group.name}
                                    </span>
                                  ) : (
                                    <span className="text-muted">
                                      {t('userDetail.noGroupAssigned')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {user?.group && (
                                <>
                                  <div className="row mb-3">
                                    <div className="col-sm-4">
                                      <h6 className="mb-0">
                                        {t('userDetail.groupDescription')}:
                                      </h6>
                                    </div>
                                    <div className="col-sm-8">
                                      <p className="text-muted mb-0">
                                        {user.group.description ||
                                          t('userDetail.noDescription')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-sm-4">
                                      <h6 className="mb-0">
                                        {t('userDetail.groupSize')}:
                                      </h6>
                                    </div>
                                    <div className="col-sm-8">
                                      <p className="text-muted mb-0">
                                        {user.group.users?.length || 0}{' '}
                                        {t('userDetail.students')}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                          {user?.role === 'teacher' && (
                            <>
                              <div className="row">
                                <div className="col-sm-4">
                                  <h6 className="mb-0">
                                    {t('userDetail.assignedGroups')}:
                                  </h6>
                                </div>
                                <div className="col-sm-8">
                                  {user?.assignedGroups &&
                                  user.assignedGroups.length > 0 ? (
                                    <div>
                                      {user.assignedGroups.map(group => (
                                        <span
                                          key={group.id}
                                          className="badge bg-primary me-1 mb-1"
                                        >
                                          {group.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted">
                                      {t('userDetail.noGroupsAssigned')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                          {user?.role === 'super_admin' && (
                            <div className="text-center">
                              <p className="text-muted">
                                {t('userDetail.superAdminAccess')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="row">
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            {t('userDetail.detailedInformation')}
                          </h5>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6">
                              <table className="table table-borderless">
                                <tbody>
                                  <tr>
                                    <td>
                                      <strong>{t('userDetail.userId')}:</strong>
                                    </td>
                                    <td>{user?.id}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.fullName')}:
                                      </strong>
                                    </td>
                                    <td>{user?.name}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.emailAddress')}:
                                      </strong>
                                    </td>
                                    <td>{user?.email}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>{t('userDetail.role')}:</strong>
                                    </td>
                                    <td>{getRoleBadge(user?.role)}</td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.accountStatus')}:
                                      </strong>
                                    </td>
                                    <td>{getStatusBadge(user?.is_active)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="col-md-6">
                              <table className="table table-borderless">
                                <tbody>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.createdDate')}:
                                      </strong>
                                    </td>
                                    <td>
                                      {new Date(
                                        user?.created_at
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.lastUpdated')}:
                                      </strong>
                                    </td>
                                    <td>
                                      {new Date(
                                        user?.updated_at
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        {t('userDetail.groupId')}:
                                      </strong>
                                    </td>
                                    <td>
                                      {user?.group_id ||
                                        t('userDetail.notAssigned')}
                                    </td>
                                  </tr>
                                  {user?.role === 'student' && user?.group && (
                                    <tr>
                                      <td>
                                        <strong>
                                          {t('userDetail.groupName')}:
                                        </strong>
                                      </td>
                                      <td>{user.group.name}</td>
                                    </tr>
                                  )}
                                  {user?.role === 'teacher' &&
                                    user?.assignedGroups && (
                                      <tr>
                                        <td>
                                          <strong>
                                            {t('userDetail.assignedGroups')}:
                                          </strong>
                                        </td>
                                        <td>
                                          {user.assignedGroups.length}{' '}
                                          {t('userDetail.groups')}
                                        </td>
                                      </tr>
                                    )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Diary Activity Tab */}
                {activeTab === 'diary' && user?.role === 'student' && (
                  <div className="row">
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            {t('userDetail.diaryActivityStatistics')}
                          </h5>
                        </div>
                        <div className="card-body">
                          {diaryStats ? (
                            <div className="row">
                              <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                  <div className="card-body text-center">
                                    <h3 className="card-title text-white">
                                      {diaryStats.totalEntries}
                                    </h3>
                                    <p className="card-text">
                                      {t('userDetail.totalEntries')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="card bg-success text-white">
                                  <div className="card-body text-center">
                                    <h3 className="card-title text-white">
                                      {diaryStats.submittedEntries}
                                    </h3>
                                    <p className="card-text">
                                      {t('userDetail.submittedEntries')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="card bg-info text-white">
                                  <div className="card-body text-center">
                                    <h3 className="card-title text-white">
                                      {diaryStats.reviewedEntries}
                                    </h3>
                                    <p className="card-text">
                                      {t('userDetail.reviewedEntries')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="card bg-warning text-white">
                                  <div className="card-body text-center">
                                    <h3 className="card-title text-white">
                                      {diaryStats.averageRating.toFixed(1)}
                                    </h3>
                                    <p className="card-text">
                                      {t('userDetail.averageRating')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="spinner-border" role="status">
                                <span className="visually-hidden">
                                  {t('common.loading')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="row">
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            {t('userDetail.recentNotifications')}
                          </h5>
                        </div>
                        <div className="card-body">
                          {notifications.length > 0 ? (
                            <div className="list-group">
                              {notifications.map(notification => (
                                <div
                                  key={notification.id}
                                  className={`list-group-item ${
                                    notification.is_read
                                      ? 'list-group-item-light'
                                      : 'list-group-item-primary'
                                  }`}
                                >
                                  <div className="d-flex w-100 justify-content-between">
                                    <h6 className="mb-1">
                                      {notification.title}
                                    </h6>
                                    <small>
                                      {new Date(
                                        notification.created_at
                                      ).toLocaleDateString()}
                                    </small>
                                  </div>
                                  <p className="mb-1">{notification.message}</p>
                                  <small>
                                    <span
                                      className={`badge ${
                                        notification.is_read
                                          ? 'bg-secondary'
                                          : 'bg-primary'
                                      }`}
                                    >
                                      {notification.is_read
                                        ? t('userDetail.read')
                                        : t('userDetail.unread')}
                                    </span>
                                  </small>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-muted">
                                {t('userDetail.noRecentNotifications')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div
            className="modal fade show"
            style={{ display: 'block' }}
            tabIndex="-1"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('userDetail.updateUser')}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleUpdateUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('user.name')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('user.email')} *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('user.role')} *</label>
                      <select
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="student">{t('user.student')}</option>
                        <option value="teacher">{t('user.teacher')}</option>
                        <option value="super_admin">
                          {t('user.superAdmin')}
                        </option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          {t('user.active')}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {t('userDetail.updateUser')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </Layout>
  );
};

export default UserDetailPage;
