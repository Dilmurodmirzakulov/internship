import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';

const StudentsListPage = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/users/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        setError('Failed to fetch students');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
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
          <h4 className="fw-bold mb-1">{t('navigation.myStudents')}</h4>
          <p className="text-muted mb-0">{t('dashboard.monitorProgress')}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Students List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Students in Your Group</h5>
          <small className="text-muted">{students.length} students</small>
        </div>
        <div className="card-body">
          {students.length === 0 ? (
            <div className="text-center py-4">
              <div className="avatar avatar-xl mx-auto mb-3">
                <span className="avatar-initial rounded-circle bg-label-secondary">
                  <i className="bx bx-group bx-lg"></i>
                </span>
              </div>
              <h5 className="mb-2">No students assigned</h5>
              <p className="text-muted mb-0">
                You don't have any students assigned to your group yet.
              </p>
            </div>
          ) : (
            <div className="table-responsive text-nowrap">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Total Entries</th>
                    <th>Submitted</th>
                    <th>Pending Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-3">
                            <span className="avatar-initial rounded-circle bg-label-primary">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h6 className="mb-0">{student.name}</h6>
                            <small className="text-muted">
                              {student.is_active ? (
                                <span className="badge bg-success">Active</span>
                              ) : (
                                <span className="badge bg-secondary">
                                  Inactive
                                </span>
                              )}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <span className="fw-medium">
                          {student.diary_entries
                            ? student.diary_entries.length
                            : 0}
                        </span>
                      </td>
                      <td>
                        <span className="fw-medium text-success">
                          {student.diary_entries
                            ? student.diary_entries.filter(
                                entry => entry.is_submitted
                              ).length
                            : 0}
                        </span>
                      </td>
                      <td>
                        <span className="fw-medium text-warning">
                          {student.diary_entries
                            ? student.diary_entries.filter(
                                entry =>
                                  entry.is_submitted && entry.mark === null
                              ).length
                            : 0}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button
                            type="button"
                            className="btn p-0 dropdown-toggle hide-arrow"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bx bx-dots-vertical-rounded"></i>
                          </button>
                          <div className="dropdown-menu">
                            <Link
                              className="dropdown-item"
                              to={`/teacher/student/${student.id}/diary`}
                            >
                              <i className="bx bx-book-open me-1"></i> View
                              Diary
                            </Link>
                            <Link
                              className="dropdown-item"
                              to={`/teacher/student/${student.id}/profile`}
                            >
                              <i className="bx bx-user me-1"></i> View Profile
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {students.length > 0 && (
        <div className="row mt-4">
          <div className="col-lg-3 col-md-6 col-12 mb-4">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="content-left">
                    <span>Total Students</span>
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
                    <span>Total Entries</span>
                    <div className="d-flex align-items-end mt-2">
                      <h4 className="mb-0 me-2">
                        {students.reduce(
                          (total, student) =>
                            total +
                            (student.diary_entries
                              ? student.diary_entries.length
                              : 0),
                          0
                        )}
                      </h4>
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
                    <span>Pending Review</span>
                    <div className="d-flex align-items-end mt-2">
                      <h4 className="mb-0 me-2">
                        {students.reduce(
                          (total, student) =>
                            total +
                            (student.diary_entries
                              ? student.diary_entries.filter(
                                  entry =>
                                    entry.is_submitted && entry.mark === null
                                ).length
                              : 0),
                          0
                        )}
                      </h4>
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
                    <span>Reviewed</span>
                    <div className="d-flex align-items-end mt-2">
                      <h4 className="mb-0 me-2">
                        {students.reduce(
                          (total, student) =>
                            total +
                            (student.diary_entries
                              ? student.diary_entries.filter(
                                  entry => entry.mark !== null
                                ).length
                              : 0),
                          0
                        )}
                      </h4>
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
      )}
    </div>
  );
};

export default StudentsListPage;
