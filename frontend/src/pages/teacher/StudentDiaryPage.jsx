import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';

const StudentDiaryPage = () => {
  const [student, setStudent] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { studentId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentDiary();
  }, [studentId]);

  const fetchStudentDiary = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/diary/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiaryEntries(data.entries || []);
        if (data.entries.length > 0) {
          setStudent(data.entries[0].student);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch student diary');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = entry => {
    if (!entry.is_submitted) {
      return <span className="badge bg-secondary">Draft</span>;
    }
    if (entry.mark !== null) {
      const markColor =
        entry.mark >= 70 ? 'success' : entry.mark >= 50 ? 'warning' : 'danger';
      return (
        <span className={`badge bg-${markColor}`}>
          Marked ({entry.mark}/100)
        </span>
      );
    }
    return <span className="badge bg-info">Pending Review</span>;
  };

  const getPriorityClass = entry => {
    if (!entry.is_submitted) return '';
    if (entry.mark !== null) return '';

    // Calculate days since submission
    const daysSinceSubmission = Math.floor(
      (new Date() - new Date(entry.submitted_at)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission > 7) return 'table-danger';
    if (daysSinceSubmission > 3) return 'table-warning';
    return '';
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

  if (error) {
    return (
      <div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate('/teacher/students')}
        >
          <i className="bx bx-arrow-back me-1"></i>
          Back to Students
        </button>
      </div>
    );
  }

  const submittedEntries = diaryEntries.filter(entry => entry.is_submitted);
  const pendingReview = submittedEntries.filter(entry => entry.mark === null);
  const reviewedEntries = submittedEntries.filter(entry => entry.mark !== null);
  const averageMark =
    reviewedEntries.length > 0
      ? Math.round(
          reviewedEntries.reduce((sum, entry) => sum + entry.mark, 0) /
            reviewedEntries.length
        )
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {student ? `${student.name}'s Diary` : 'Student Diary'}
          </h4>
          <p className="text-muted mb-0">
            Review and mark student's internship diary entries
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate('/teacher/students')}
        >
          <i className="bx bx-arrow-back me-1"></i>
          Back to Students
        </button>
      </div>

      {/* Student Info */}
      {student && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-lg me-3">
                    <span className="avatar-initial rounded-circle bg-label-primary">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h5 className="mb-1">{student.name}</h5>
                    <p className="text-muted mb-0">{student.email}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-md-end">
                <span className="badge bg-success">Active Student</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>Total Entries</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{diaryEntries.length}</h4>
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
                    <h4 className="mb-0 me-2">{pendingReview.length}</h4>
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
                    <h4 className="mb-0 me-2">{reviewedEntries.length}</h4>
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

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>Average Mark</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{averageMark}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-trophy bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diary Entries */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Diary Entries</h5>
          {pendingReview.length > 0 && (
            <span className="badge bg-warning">
              {pendingReview.length} pending review
            </span>
          )}
        </div>
        <div className="card-body">
          {diaryEntries.length === 0 ? (
            <div className="text-center py-4">
              <div className="avatar avatar-xl mx-auto mb-3">
                <span className="avatar-initial rounded-circle bg-label-secondary">
                  <i className="bx bx-book-open bx-lg"></i>
                </span>
              </div>
              <h5 className="mb-2">No diary entries yet</h5>
              <p className="text-muted mb-0">
                This student hasn't created any diary entries yet.
              </p>
            </div>
          ) : (
            <div className="table-responsive text-nowrap">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Mark</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {diaryEntries
                    .sort(
                      (a, b) => new Date(b.entry_date) - new Date(a.entry_date)
                    )
                    .map(entry => (
                      <tr key={entry.id} className={getPriorityClass(entry)}>
                        <td>
                          <div>
                            <h6 className="mb-0">
                              {formatDate(entry.entry_date)}
                            </h6>
                            {entry.file_name && (
                              <small className="text-muted">
                                <i className="bx bx-paperclip me-1"></i>
                                {entry.file_name}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(entry)}</td>
                        <td>
                          {entry.mark !== null ? (
                            <span className="fw-medium">{entry.mark}/100</span>
                          ) : entry.is_submitted ? (
                            <span className="text-warning">Pending</span>
                          ) : (
                            <span className="text-muted">Draft</span>
                          )}
                        </td>
                        <td>
                          {entry.submitted_at ? (
                            <small className="text-muted">
                              {new Date(
                                entry.submitted_at
                              ).toLocaleDateString()}
                            </small>
                          ) : (
                            <span className="text-muted">Not submitted</span>
                          )}
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
                                to={`/teacher/review/${entry.id}`}
                              >
                                <i className="bx bx-show me-1"></i>
                                {entry.mark !== null
                                  ? 'View Review'
                                  : 'Review Entry'}
                              </Link>
                              {entry.is_submitted && entry.mark === null && (
                                <Link
                                  className="dropdown-item text-primary"
                                  to={`/teacher/review/${entry.id}`}
                                >
                                  <i className="bx bx-star me-1"></i> Mark Entry
                                </Link>
                              )}
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
    </div>
  );
};

export default StudentDiaryPage;
