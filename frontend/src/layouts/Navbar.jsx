import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import NotificationDropdown from '../components/NotificationDropdown';
import LanguageSwitcher from '../components/LanguageSwitcher';
import getGreetingMessage from '../utils/greetingHandler';
import API_BASE_URL from '../config/api';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    // Call logout from store
    logout();
    // Redirect to login page
    navigate('/auth/login');
  };

  const getRoleDisplayName = role => {
    switch (role) {
      case 'super_admin':
        return t('user.superAdmin');
      case 'teacher':
        return t('user.teacher');
      case 'student':
        return t('user.student');
      default:
        return t('user.name');
    }
  };

  const getAvatarInitials = name => {
    return name
      ? name
          .split(' ')
          .map(n => n.charAt(0))
          .join('')
          .toUpperCase()
      : 'U';
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a
          aria-label="toggle for sidebar"
          className="nav-item nav-link px-0 me-xl-4"
          href="#"
        >
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        {getGreetingMessage(user?.name?.split(' ')[0] || 'User')}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item me-3">
            <LanguageSwitcher />
          </li>
          <li className="nav-item me-3">
            <NotificationDropdown />
          </li>
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              aria-label="dropdown profile avatar"
              className="nav-link dropdown-toggle hide-arrow"
              href="#"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                {user?.profile_image ? (
                  <img
                    src={`${API_BASE_URL}/uploads/${user.profile_image}`}
                    alt="Profile"
                    className="w-px-40 h-px-40 rounded-circle"
                  />
                ) : (
                  <span className="avatar-initial rounded-circle bg-label-primary">
                    {getAvatarInitials(user?.name)}
                  </span>
                )}
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <div className="dropdown-item">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        {user?.profile_image ? (
                          <img
                            src={`${API_BASE_URL}/uploads/${user.profile_image}`}
                            alt="Profile"
                            className="w-px-40 h-px-40 rounded-circle"
                          />
                        ) : (
                          <span className="avatar-initial rounded-circle bg-label-primary">
                            {getAvatarInitials(user?.name)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-medium d-block">
                        {user?.name || 'User'}
                      </span>
                      <small className="text-muted">
                        {getRoleDisplayName(user?.role)}
                      </small>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <Link
                  aria-label="go to profile"
                  className="dropdown-item"
                  to="/account"
                >
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">{t('common.profile')}</span>
                </Link>
              </li>
              <li>
                <Link
                  aria-label="go to settings"
                  className="dropdown-item"
                  to="/account"
                >
                  <i className="bx bx-cog me-2"></i>
                  <span className="align-middle">{t('common.settings')}</span>
                </Link>
              </li>
              {user?.role === 'student' && (
                <li>
                  <Link
                    aria-label="go to diary"
                    className="dropdown-item"
                    to="/student/diary"
                  >
                    <i className="bx bx-book-open me-2"></i>
                    <span className="align-middle">
                      {t('navigation.myDiary')}
                    </span>
                  </Link>
                </li>
              )}
              {user?.role === 'teacher' && (
                <li>
                  <Link
                    aria-label="go to students"
                    className="dropdown-item"
                    to="/teacher/students"
                  >
                    <i className="bx bx-group me-2"></i>
                    <span className="align-middle">
                      {t('navigation.students')}
                    </span>
                  </Link>
                </li>
              )}
              {user?.role === 'super_admin' && (
                <>
                  <li>
                    <Link
                      aria-label="manage users"
                      className="dropdown-item"
                      to="/admin/users"
                    >
                      <i className="bx bx-user me-2"></i>
                      <span className="align-middle">
                        {t('navigation.users')}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      aria-label="manage groups"
                      className="dropdown-item"
                      to="/admin/groups"
                    >
                      <i className="bx bx-group me-2"></i>
                      <span className="align-middle">
                        {t('navigation.groups')}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      aria-label="manage programs"
                      className="dropdown-item"
                      to="/admin/programs"
                    >
                      <i className="bx bx-calendar me-2"></i>
                      <span className="align-middle">
                        {t('navigation.programs')}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      aria-label="view reports"
                      className="dropdown-item"
                      to="/admin/reports"
                    >
                      <i className="bx bx-bar-chart-alt-2 me-2"></i>
                      <span className="align-middle">
                        {t('navigation.reports')}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      aria-label="manage notifications"
                      className="dropdown-item"
                      to="/admin/notifications"
                    >
                      <i className="bx bx-bell me-2"></i>
                      <span className="align-middle">
                        {t('common.notifications')}
                      </span>
                    </Link>
                  </li>
                </>
              )}
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <button
                  aria-label="click to log out"
                  className="dropdown-item"
                  onClick={handleLogout}
                  style={{
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">{t('common.logout')}</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
