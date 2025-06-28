import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';

const ReviewEntryPage = () => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  const [markData, setMarkData] = useState({
    mark: '',
    teacher_comment: '',
  });
  const { entryId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiaryEntry();
  }, [entryId]);

  const fetchDiaryEntry = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/diary/entry-by-id/${entryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntry(data.entry);

        // Pre-fill form if already marked
        if (data.entry.mark !== null) {
          setMarkData({
            mark: data.entry.mark.toString(),
            teacher_comment: data.entry.teacher_comment || '',
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch diary entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setMarkData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitMark = async e => {
    e.preventDefault();
    setIsMarking(true);
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/diary/mark/${entryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mark: parseInt(markData.mark),
          teacher_comment: markData.teacher_comment,
        }),
      });

      if (response.ok) {
        setSuccess('Entry marked successfully!');
        // Refresh entry data
        await fetchDiaryEntry();

        setTimeout(() => {
          navigate(`/teacher/student/${entry.student?.id || 'unknown'}/diary`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsMarking(false);
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

  const getMarkColor = mark => {
    if (mark >= 90) return 'success';
    if (mark >= 80) return 'info';
    if (mark >= 70) return 'primary';
    if (mark >= 60) return 'warning';
    return 'danger';
  };

  const downloadFile = () => {
    if (entry.file_url) {
      const link = document.createElement('a');
      link.href = entry.file_url;
      link.download = entry.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  if (error && !entry) {
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

  if (!entry) {
    return (
      <div>
        <div className="alert alert-warning" role="alert">
          Diary entry not found.
        </div>
      </div>
    );
  }

  const canMark =
    entry.is_submitted && (entry.mark === null || user.id === entry.teacher_id);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Review Diary Entry</h4>
          <p className="text-muted mb-0">
            {entry.student?.name || 'Unknown Student'} -{' '}
            {formatDate(entry.entry_date)}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            navigate(`/teacher/student/${entry.student?.id || 'unknown'}/diary`)
          }
        >
          <i className="bx bx-arrow-back me-1"></i>
          Back to Student Diary
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="row">
        {/* Entry Content */}
        <div className="col-lg-8 mb-4">
          {/* Student Info */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-lg me-3">
                  <span className="avatar-initial rounded-circle bg-label-primary">
                    {entry.student?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">
                    {entry.student?.name || 'Unknown Student'}
                  </h5>
                  <p className="text-muted mb-0">
                    {entry.student?.email || 'No email'}
                  </p>
                </div>
                <div>
                  {entry.is_submitted ? (
                    <span className="badge bg-success">Submitted</span>
                  ) : (
                    <span className="badge bg-warning">Draft</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Entry Details */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Entry Details</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">Entry Date</label>
                  <p className="mb-0">{formatDate(entry.entry_date)}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Submitted</label>
                  <p className="mb-0">
                    {entry.submitted_at
                      ? new Date(entry.submitted_at).toLocaleString()
                      : 'Not submitted'}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Daily Report</label>
                <div className="card bg-light">
                  <div className="card-body">
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {entry.text_report || 'No report provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Attachment */}
              {entry.file_url && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Attachment</label>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="bx bx-paperclip bx-md text-primary"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{entry.file_name}</h6>
                      <small className="text-muted">
                        {entry.file_size
                          ? `${Math.round(entry.file_size / 1024)} KB`
                          : 'Unknown size'}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={downloadFile}
                    >
                      <i className="bx bx-download me-1"></i>
                      Download
                    </button>
                  </div>

                  {/* Image Preview */}
                  {entry.file_name &&
                    entry.file_name.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <div className="mt-3">
                        <img
                          src={entry.file_url}
                          alt="Entry attachment"
                          className="img-fluid rounded"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Marking Panel */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {entry.mark !== null ? 'Review Information' : 'Mark Entry'}
              </h5>
            </div>
            <div className="card-body">
              {entry.mark !== null ? (
                /* Display existing mark */
                <div>
                  <div className="text-center mb-4">
                    <div className="avatar avatar-xl mx-auto mb-3">
                      <span
                        className={`avatar-initial rounded-circle bg-${getMarkColor(entry.mark)}`}
                      >
                        <i className="bx bx-star bx-lg"></i>
                      </span>
                    </div>
                    <h3 className={`text-${getMarkColor(entry.mark)} mb-1`}>
                      {entry.mark}/100
                    </h3>
                    <p className="text-muted mb-0">Final Mark</p>
                  </div>

                  {entry.teacher_comment && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        Teacher Comment
                      </label>
                      <div className="card bg-light">
                        <div className="card-body">
                          <p
                            className="mb-0"
                            style={{ whiteSpace: 'pre-wrap' }}
                          >
                            {entry.teacher_comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-medium">Marked By</label>
                    <p className="mb-0">{entry.teacher?.name || 'Unknown'}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Marked On</label>
                    <p className="mb-0">
                      {entry.marked_at
                        ? new Date(entry.marked_at).toLocaleString()
                        : 'Unknown'}
                    </p>
                  </div>

                  {/* Allow re-marking if it's the same teacher */}
                  {user.id === entry.teacher_id && (
                    <div className="alert alert-info">
                      <small>
                        <i className="bx bx-info-circle me-1"></i>
                        You can update this mark and comment.
                      </small>
                    </div>
                  )}
                </div>
              ) : (
                /* Entry not submitted yet */
                !entry.is_submitted && (
                  <div className="alert alert-warning">
                    <i className="bx bx-info-circle me-2"></i>
                    This entry has not been submitted yet and cannot be marked.
                  </div>
                )
              )}

              {/* Marking Form */}
              {canMark && (
                <form onSubmit={handleSubmitMark}>
                  <div className="mb-3">
                    <label htmlFor="mark" className="form-label">
                      Mark (0-100) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="mark"
                      name="mark"
                      value={markData.mark}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="teacher_comment" className="form-label">
                      Comment
                    </label>
                    <textarea
                      className="form-control"
                      id="teacher_comment"
                      name="teacher_comment"
                      rows="4"
                      value={markData.teacher_comment}
                      onChange={handleInputChange}
                      placeholder="Provide feedback on the student's work..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isMarking}
                  >
                    {isMarking ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        {entry.mark !== null ? 'Updating...' : 'Marking...'}
                      </>
                    ) : (
                      <>
                        <i className="bx bx-check me-1"></i>
                        {entry.mark !== null ? 'Update Mark' : 'Submit Mark'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewEntryPage;
