import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const DiaryEntryPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    entry_date: date || new Date().toISOString().split('T')[0],
    text_report: '',
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [programDates, setProgramDates] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetchProgramDates();
    if (date) {
      fetchExistingEntry();
    }
  }, [date]);

  const fetchProgramDates = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `/api/diary/program-dates/${user.group_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgramDates(data.dates || []);
        setPrograms(data.programs || [data.program].filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to fetch program dates:', err);
    }
  };

  const fetchExistingEntry = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`/api/diary/entry/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.entry) {
          setExistingEntry(data.entry);
          setIsEditing(true);
          setFormData({
            entry_date: data.entry.entry_date,
            text_report: data.entry.text_report || '',
            file: null,
          });
          if (data.entry.file_url) {
            setFilePreview(data.entry.file_url);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch entry:', err);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file,
      }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const formDataToSend = new FormData();

      formDataToSend.append('entry_date', formData.entry_date);
      formDataToSend.append('text_report', formData.text_report);
      formDataToSend.append('is_submitted', !isDraft);

      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const url = isEditing
        ? `/api/diary/entry/${existingEntry.id}`
        : '/api/diary/entry';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(
          isDraft ? 'Entry saved as draft!' : 'Entry submitted successfully!'
        );

        setTimeout(() => {
          navigate('/student/diary');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = !existingEntry || !existingEntry.is_submitted;

  // Get valid date range from programs
  const getValidDateRange = () => {
    if (!programs || programs.length === 0) return { min: null, max: null };

    const startDates = programs.map(p => new Date(p.start_date));
    const endDates = programs.map(p => new Date(p.end_date));

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0],
    };
  };

  const isDateDisabled = dateStr => {
    const dateInfo = programDates.find(d => d.date === dateStr);
    return dateInfo?.is_disabled || dateInfo?.is_weekend;
  };

  const validDateRange = getValidDateRange();

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {isEditing ? 'Edit Diary Entry' : 'New Diary Entry'}
          </h4>
          <p className="text-muted mb-0">
            {isEditing
              ? `Editing entry for ${new Date(formData.entry_date).toLocaleDateString()}`
              : 'Document your internship activities and learnings'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate('/student/diary')}
        >
          <i className="bx bx-arrow-back me-1"></i>
          Back to Diary
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

      {/* Program Information */}
      {programs.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="mb-2">
              <i className="bx bx-calendar me-1"></i>
              Active Programs
            </h6>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {programs.map((program, index) => (
                <span key={index} className="badge bg-primary">
                  {program.name}
                </span>
              ))}
            </div>
            <small className="text-muted">
              Valid dates:{' '}
              {validDateRange.min
                ? new Date(validDateRange.min).toLocaleDateString()
                : 'N/A'}{' '}
              -{' '}
              {validDateRange.max
                ? new Date(validDateRange.max).toLocaleDateString()
                : 'N/A'}
            </small>
          </div>
        </div>
      )}

      {/* Entry Status */}
      {existingEntry && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h6 className="mb-1">Entry Status</h6>
                <div className="d-flex align-items-center">
                  {existingEntry.is_submitted ? (
                    <>
                      <span className="badge bg-success me-2">Submitted</span>
                      <small className="text-muted">
                        on{' '}
                        {new Date(
                          existingEntry.submitted_at
                        ).toLocaleDateString()}
                      </small>
                    </>
                  ) : (
                    <span className="badge bg-warning">Draft</span>
                  )}
                </div>
              </div>
              {existingEntry.mark !== null && (
                <div className="col-md-6">
                  <h6 className="mb-1">Teacher Evaluation</h6>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-info me-2">
                      Mark: {existingEntry.mark}/100
                    </span>
                    {existingEntry.marked_at && (
                      <small className="text-muted">
                        on{' '}
                        {new Date(existingEntry.marked_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
            {existingEntry.teacher_comment && (
              <div className="mt-3">
                <h6 className="mb-1">Teacher Comment</h6>
                <p className="text-muted mb-0">
                  {existingEntry.teacher_comment}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entry Form */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Diary Entry Details</h5>
        </div>
        <div className="card-body">
          <form onSubmit={e => handleSubmit(e, false)}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="entry_date" className="form-label">
                  Entry Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="entry_date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                  min={validDateRange.min}
                  max={validDateRange.max}
                  disabled={!canEdit}
                  required
                />
                <div className="form-text">
                  Select a date within the active program period. Weekends and
                  holidays are disabled.
                </div>
                {formData.entry_date && isDateDisabled(formData.entry_date) && (
                  <div className="text-warning small mt-1">
                    <i className="bx bx-warning me-1"></i>
                    This date may be disabled (weekend/holiday). Please check
                    with your supervisor.
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="text_report" className="form-label">
                Daily Report <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                id="text_report"
                name="text_report"
                rows="8"
                value={formData.text_report}
                onChange={handleInputChange}
                disabled={!canEdit}
                placeholder="Describe your activities, learnings, challenges, and achievements for this day..."
                required
              />
              <div className="form-text">
                Provide a detailed description of your internship activities,
                what you learned, challenges faced, and key achievements.
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="file" className="form-label">
                Attachment (Optional)
              </label>
              <input
                type="file"
                className="form-control"
                id="file"
                name="file"
                onChange={handleFileChange}
                disabled={!canEdit}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <div className="form-text">
                Upload images, documents, or other files related to your
                internship activities. Maximum file size: 5MB
              </div>
            </div>

            {/* File Preview */}
            {filePreview && (
              <div className="mb-3">
                <label className="form-label">File Preview</label>
                <div className="border rounded p-3">
                  {filePreview.startsWith('data:image') ||
                  filePreview.includes('/uploads/') ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="img-fluid"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : (
                    <div className="d-flex align-items-center">
                      <i className="bx bx-file me-2"></i>
                      <span>File attached</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Existing file info */}
            {existingEntry && existingEntry.file_url && !formData.file && (
              <div className="mb-3">
                <label className="form-label">Current Attachment</label>
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <i className="bx bx-file me-2"></i>
                      <span>{existingEntry.file_name || 'Attachment'}</span>
                      {existingEntry.file_size && (
                        <small className="text-muted ms-2">
                          ({Math.round(existingEntry.file_size / 1024)} KB)
                        </small>
                      )}
                    </div>
                    <a
                      href={existingEntry.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bx bx-download me-1"></i>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-send me-1"></i>
                      Submit Entry
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={e => handleSubmit(e, true)}
                  disabled={loading}
                >
                  <i className="bx bx-save me-1"></i>
                  Save as Draft
                </button>
              </div>
            )}

            {!canEdit && (
              <div className="alert alert-info">
                <i className="bx bx-info-circle me-2"></i>
                This entry has been submitted and cannot be edited.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiaryEntryPage;
