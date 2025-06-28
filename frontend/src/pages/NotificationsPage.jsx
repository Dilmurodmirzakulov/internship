import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAuthStore();
  const addNotification = useUIStore(state => state.addNotification);

  // Fetch notifications
  const fetchNotifications = async (
    currentPage = 1,
    currentFilter = filter,
    currentTypeFilter = typeFilter
  ) => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(currentFilter === 'unread' && { unreadOnly: 'true' }),
      });

      const [notificationsRes, statsRes] = await Promise.all([
        fetch(`/api/notifications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/notifications/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (notificationsRes.ok && statsRes.ok) {
        const notificationsData = await notificationsRes.json();
        const statsData = await statsRes.json();

        let filteredNotifications = notificationsData.notifications || [];

        // Client-side filtering by type
        if (currentTypeFilter !== 'all') {
          filteredNotifications = filteredNotifications.filter(
            n => n.type === currentTypeFilter
          );
        }

        // Client-side filtering by read status
        if (currentFilter === 'read') {
          filteredNotifications = filteredNotifications.filter(n => n.is_read);
        }

        setNotifications(filteredNotifications);
        setStats(statsData);
        setTotalPages(notificationsData.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load notifications',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async notificationId => {
    if (!token) return;

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
        addNotification({
          type: 'success',
          message: 'All notifications marked as read',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      addNotification({
        type: 'error',
        message: 'Failed to mark notifications as read',
        duration: 5000,
      });
    }
  };

  // Handle filter change
  const handleFilterChange = newFilter => {
    setFilter(newFilter);
    setPage(1);
    fetchNotifications(1, newFilter, typeFilter);
  };

  // Handle type filter change
  const handleTypeFilterChange = newTypeFilter => {
    setTypeFilter(newTypeFilter);
    setPage(1);
    fetchNotifications(1, filter, newTypeFilter);
  };

  // Handle page change
  const handlePageChange = newPage => {
    setPage(newPage);
    fetchNotifications(newPage, filter, typeFilter);
  };

  // Get type display name
  const getTypeDisplayName = type => {
    switch (type) {
      case 'diary_reminder':
        return 'Diary Reminder';
      case 'entry_marked':
        return 'Entry Marked';
      case 'deadline_warning':
        return 'Deadline Warning';
      case 'system_announcement':
        return 'System Announcement';
      case 'password_changed':
        return 'Password Changed';
      case 'account_update':
        return 'Account Update';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get type icon
  const getTypeIcon = type => {
    switch (type) {
      case 'diary_reminder':
        return 'bx bx-book-open text-primary';
      case 'entry_marked':
        return 'bx bx-check-circle text-success';
      case 'deadline_warning':
        return 'bx bx-time text-warning';
      case 'system_announcement':
        return 'bx bx-megaphone text-info';
      case 'password_changed':
        return 'bx bx-shield text-secondary';
      case 'account_update':
        return 'bx bx-user text-primary';
      default:
        return 'bx bx-bell text-primary';
    }
  };

  // Get priority badge
  const getPriorityBadge = priority => {
    switch (priority) {
      case 'urgent':
        return 'badge bg-danger';
      case 'high':
        return 'badge bg-warning';
      case 'medium':
        return 'badge bg-primary';
      case 'low':
        return 'badge bg-secondary';
      default:
        return 'badge bg-primary';
    }
  };

  // Format date
  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [token]);

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bx bx-bell me-2"></i>
                {t('notifications.title')}
              </h5>
              {stats.unread > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={markAllAsRead}
                  type="button"
                >
                  <i className="bx bx-check-double me-1"></i>
                  Mark All Read ({stats.unread})
                </button>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <i className="bx bx-bell fs-1 text-primary mb-2"></i>
                      <h4 className="mb-1">{stats.total}</h4>
                      <small className="text-muted">
                        {t('notifications.total')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <i className="bx bx-bell-ring fs-1 text-warning mb-2"></i>
                      <h4 className="mb-1">{stats.unread}</h4>
                      <small className="text-muted">
                        {t('notifications.unread')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <i className="bx bx-bell-off fs-1 text-success mb-2"></i>
                      <h4 className="mb-1">{stats.total - stats.unread}</h4>
                      <small className="text-muted">
                        {t('notifications.read')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <i className="bx bx-time fs-1 text-info mb-2"></i>
                      <h4 className="mb-1">
                        {stats.byType?.deadline_warning || 0}
                      </h4>
                      <small className="text-muted">
                        {t('notifications.urgent')}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleFilterChange('all')}
                    >
                      {t('notifications.all')}
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleFilterChange('unread')}
                    >
                      {t('notifications.unread')} ({stats.unread})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleFilterChange('read')}
                    >
                      {t('notifications.read')}
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={typeFilter}
                    onChange={e => handleTypeFilterChange(e.target.value)}
                  >
                    <option value="all">{t('notifications.allTypes')}</option>
                    <option value="diary_reminder">Diary Reminders</option>
                    <option value="entry_marked">Entry Marked</option>
                    <option value="deadline_warning">Deadline Warnings</option>
                    <option value="system_announcement">
                      System Announcements
                    </option>
                    <option value="password_changed">Password Changes</option>
                    <option value="account_update">Account Updates</option>
                  </select>
                </div>
              </div>

              {/* Notifications List */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">
                      {t('reports.loading')}
                    </span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bx bx-bell-off fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">
                    {t('notifications.noNotificationsFound')}
                  </h5>
                  <p className="text-muted">
                    {filter === 'unread'
                      ? t('notifications.allCaughtUp')
                      : t('notifications.noNotificationsMatch')}
                  </p>
                </div>
              ) : (
                <div className="list-group">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`list-group-item list-group-item-action ${
                        !notification.is_read ? 'list-group-item-light' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        !notification.is_read && markAsRead(notification.id)
                      }
                    >
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="d-flex">
                          <div className="me-3">
                            <i
                              className={`${getTypeIcon(notification.type)} fs-4`}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h6 className="mb-0">
                                {notification.title}
                                {!notification.is_read && (
                                  <span className="badge bg-primary ms-2">
                                    {t('notifications.new')}
                                  </span>
                                )}
                              </h6>
                              <div className="d-flex align-items-center">
                                <span
                                  className={getPriorityBadge(
                                    notification.priority
                                  )}
                                >
                                  {notification.priority}
                                </span>
                                <small className="text-muted ms-2">
                                  {formatDate(notification.created_at)}
                                </small>
                              </div>
                            </div>
                            <p className="mb-1">{notification.message}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                <i className="bx bx-tag me-1"></i>
                                {getTypeDisplayName(notification.type)}
                              </small>
                              {notification.action_url && (
                                <Link
                                  to={notification.action_url}
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <i className="bx bx-right-arrow-alt me-1"></i>
                                  {t('notifications.viewDetails')}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        {t('notifications.previous')}
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${page === i + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${page === totalPages ? 'disabled' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
