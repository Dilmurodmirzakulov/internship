import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import API_BASE_URL from '../../config/api';

const NotificationManagementPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const addNotification = useUIStore(state => state.addNotification);

  // Validation schema for system announcements
  const announcementSchema = Yup.object().shape({
    title: Yup.string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title must be less than 200 characters')
      .required('Title is required'),
    message: Yup.string()
      .min(10, 'Message must be at least 10 characters')
      .max(1000, 'Message must be less than 1000 characters')
      .required('Message is required'),
    priority: Yup.string()
      .oneOf(['low', 'medium', 'high', 'urgent'])
      .required('Priority is required'),
    userRoles: Yup.array()
      .of(Yup.string().oneOf(['student', 'teacher', 'super_admin']))
      .min(1, 'Select at least one user role')
      .required('User roles are required'),
    actionUrl: Yup.string().url('Must be a valid URL').nullable(),
  });

  // Fetch notification statistics
  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  // Send system announcement
  const sendAnnouncement = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/announcement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'System announcement sent successfully!',
          duration: 5000,
        });
        resetForm();
        fetchStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        addNotification({
          type: 'error',
          message: errorData.message || 'Failed to send announcement',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to send announcement:', error);
      addNotification({
        type: 'error',
        message: 'Network error occurred',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger diary reminders manually
  const triggerDiaryReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/diary-reminders`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Diary reminders sent successfully!',
          duration: 5000,
        });
      } else {
        const errorData = await response.json();
        addNotification({
          type: 'error',
          message: errorData.message || 'Failed to send reminders',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to send reminders:', error);
      addNotification({
        type: 'error',
        message: 'Network error occurred',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup expired notifications
  const cleanupNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/cleanup`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        addNotification({
          type: 'success',
          message: `Cleaned up ${data.deletedCount} expired notifications`,
          duration: 5000,
        });
        fetchStats(); // Refresh stats
      } else {
        const errorData = await response.json();
        addNotification({
          type: 'error',
          message: errorData.message || 'Failed to cleanup notifications',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
      addNotification({
        type: 'error',
        message: 'Network error occurred',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bx bx-bell me-2"></i>
                {t('notifications.management')}
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <i className="bx bx-bell fs-1 text-primary mb-2"></i>
                      <h4 className="mb-1">{stats.total || 0}</h4>
                      <small className="text-muted">
                        {t('notifications.totalNotifications')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <i className="bx bx-bell-ring fs-1 text-warning mb-2"></i>
                      <h4 className="mb-1">{stats.unread || 0}</h4>
                      <small className="text-muted">
                        {t('notifications.unread')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <i className="bx bx-book-open fs-1 text-info mb-2"></i>
                      <h4 className="mb-1">
                        {stats.byType?.diary_reminder || 0}
                      </h4>
                      <small className="text-muted">
                        {t('notifications.diaryReminders')}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <i className="bx bx-megaphone fs-1 text-success mb-2"></i>
                      <h4 className="mb-1">
                        {stats.byType?.system_announcement || 0}
                      </h4>
                      <small className="text-muted">
                        {t('notifications.announcements')}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="mb-3">{t('notifications.quickActions')}</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-primary"
                      onClick={triggerDiaryReminders}
                      disabled={loading}
                    >
                      <i className="bx bx-time me-1"></i>
                      {t('notifications.sendDiaryReminders')}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={cleanupNotifications}
                      disabled={loading}
                    >
                      <i className="bx bx-trash me-1"></i>
                      {t('notifications.cleanupExpired')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Send System Announcement */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bx bx-megaphone me-2"></i>
                {t('notifications.sendSystemAnnouncement')}
              </h6>
            </div>
            <div className="card-body">
              <Formik
                initialValues={{
                  title: '',
                  message: '',
                  priority: 'medium',
                  userRoles: ['student', 'teacher'],
                  actionUrl: '',
                }}
                validationSchema={announcementSchema}
                onSubmit={sendAnnouncement}
              >
                {({ isSubmitting, values, setFieldValue }) => (
                  <Form>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.title')}
                          </label>
                          <Field
                            name="title"
                            type="text"
                            className="form-control"
                            placeholder={t(
                              'notifications.enterAnnouncementTitle'
                            )}
                          />
                          <ErrorMessage
                            name="title"
                            component="div"
                            className="text-danger small"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.message')}
                          </label>
                          <Field
                            as="textarea"
                            name="message"
                            rows="4"
                            className="form-control"
                            placeholder={t(
                              'notifications.enterAnnouncementMessage'
                            )}
                          />
                          <ErrorMessage
                            name="message"
                            component="div"
                            className="text-danger small"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.actionUrl')}
                          </label>
                          <Field
                            name="actionUrl"
                            type="url"
                            className="form-control"
                            placeholder={t('notifications.enterActionUrl')}
                          />
                          <ErrorMessage
                            name="actionUrl"
                            component="div"
                            className="text-danger small"
                          />
                          <small className="text-muted">
                            {t('notifications.actionUrlHelp')}
                          </small>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.priority')}
                          </label>
                          <Field
                            as="select"
                            name="priority"
                            className="form-select"
                          >
                            <option value="low">
                              {t('notifications.low')}
                            </option>
                            <option value="medium">
                              {t('notifications.medium')}
                            </option>
                            <option value="high">
                              {t('notifications.high')}
                            </option>
                            <option value="urgent">
                              {t('notifications.urgent')}
                            </option>
                          </Field>
                          <ErrorMessage
                            name="priority"
                            component="div"
                            className="text-danger small"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.targetUsers')}
                          </label>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={values.userRoles.includes('student')}
                              onChange={e => {
                                const roles = values.userRoles;
                                if (e.target.checked) {
                                  setFieldValue('userRoles', [
                                    ...roles,
                                    'student',
                                  ]);
                                } else {
                                  setFieldValue(
                                    'userRoles',
                                    roles.filter(r => r !== 'student')
                                  );
                                }
                              }}
                            />
                            <label className="form-check-label">
                              {t('notifications.students')}
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={values.userRoles.includes('teacher')}
                              onChange={e => {
                                const roles = values.userRoles;
                                if (e.target.checked) {
                                  setFieldValue('userRoles', [
                                    ...roles,
                                    'teacher',
                                  ]);
                                } else {
                                  setFieldValue(
                                    'userRoles',
                                    roles.filter(r => r !== 'teacher')
                                  );
                                }
                              }}
                            />
                            <label className="form-check-label">
                              {t('notifications.teachers')}
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={values.userRoles.includes('super_admin')}
                              onChange={e => {
                                const roles = values.userRoles;
                                if (e.target.checked) {
                                  setFieldValue('userRoles', [
                                    ...roles,
                                    'super_admin',
                                  ]);
                                } else {
                                  setFieldValue(
                                    'userRoles',
                                    roles.filter(r => r !== 'super_admin')
                                  );
                                }
                              }}
                            />
                            <label className="form-check-label">
                              {t('notifications.superAdmins')}
                            </label>
                          </div>
                          <ErrorMessage
                            name="userRoles"
                            component="div"
                            className="text-danger small"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            {t('notifications.priorityPreview')}
                          </label>
                          <div className="d-flex align-items-center">
                            <span
                              className={`badge ${
                                values.priority === 'urgent'
                                  ? 'bg-danger'
                                  : values.priority === 'high'
                                    ? 'bg-warning'
                                    : values.priority === 'medium'
                                      ? 'bg-primary'
                                      : 'bg-secondary'
                              }`}
                            >
                              {values.priority.toUpperCase()}
                            </span>
                            <i
                              className={`ms-2 ${
                                values.priority === 'urgent'
                                  ? 'bx bx-error text-danger'
                                  : values.priority === 'high'
                                    ? 'bx bx-info-circle text-warning'
                                    : 'bx bx-bell text-primary'
                              }`}
                            ></i>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            {t('notifications.sending')}
                          </>
                        ) : (
                          <>
                            <i className="bx bx-send me-1"></i>
                            {t('notifications.sendAnnouncement')}
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagementPage;
