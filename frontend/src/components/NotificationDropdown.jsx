import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { token } = useAuthStore();
  const addNotification = useUIStore(state => state.addNotification);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [notificationsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/notifications?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/notifications/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (notificationsRes.ok && statsRes.ok) {
        const notificationsData = await notificationsRes.json();
        const statsData = await statsRes.json();

        setNotifications(notificationsData.notifications || []);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async notificationId => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
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
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/read-all`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
    }
  };

  // Handle notification click
  const handleNotificationClick = notification => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  // Get priority icon
  const getPriorityIcon = priority => {
    switch (priority) {
      case 'urgent':
        return 'bx bx-error text-danger';
      case 'high':
        return 'bx bx-info-circle text-warning';
      case 'medium':
        return 'bx bx-bell text-primary';
      case 'low':
        return 'bx bx-bell text-muted';
      default:
        return 'bx bx-bell text-primary';
    }
  };

  // Get type icon
  const getTypeIcon = type => {
    switch (type) {
      case 'diary_reminder':
        return 'bx bx-book-open';
      case 'entry_marked':
        return 'bx bx-check-circle';
      case 'deadline_warning':
        return 'bx bx-time';
      case 'system_announcement':
        return 'bx bx-megaphone';
      case 'password_changed':
        return 'bx bx-shield';
      case 'account_update':
        return 'bx bx-user';
      default:
        return 'bx bx-bell';
    }
  };

  // Format relative time
  const formatTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  // Initial load of stats
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button
        className="btn btn-outline-secondary position-relative"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <i className="bx bx-bell"></i>
        {stats.unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show"
          style={{ width: '350px', maxHeight: '500px' }}
        >
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            {stats.unread > 0 && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={markAllAsRead}
                type="button"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="dropdown-item text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="dropdown-item text-center text-muted">
              <i className="bx bx-bell-off fs-1 mb-2 d-block"></i>
              No notifications
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`dropdown-item ${!notification.is_read ? 'bg-light' : ''}`}
                  style={{ cursor: 'pointer', whiteSpace: 'normal' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex">
                    <div className="me-3">
                      <i
                        className={`${getTypeIcon(notification.type)} ${getPriorityIcon(notification.priority).split(' ').pop()}`}
                      ></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 small fw-bold">
                          {notification.title}
                          {!notification.is_read && (
                            <span
                              className="badge bg-primary ms-1"
                              style={{ fontSize: '0.6em' }}
                            >
                              New
                            </span>
                          )}
                        </h6>
                        <small className="text-muted">
                          {formatTime(notification.created_at)}
                        </small>
                      </div>
                      <p className="mb-1 small text-muted">
                        {notification.message}
                      </p>
                      {notification.action_url && (
                        <Link
                          to={notification.action_url}
                          className="small text-primary text-decoration-none"
                          onClick={e => e.stopPropagation()}
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dropdown-divider"></div>
          <Link
            to="/notifications"
            className="dropdown-item text-center text-primary"
          >
            <i className="bx bx-show-alt me-1"></i>
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
