import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';
import FILE_BASE_URL from '../../config/file';

const DiaryEntryPage = () => {
  const { t } = useTranslation();
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
        `${API_BASE_URL}/diary/program-dates/${user.group_id}`,
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
      const response = await fetch(`${API_BASE_URL}/diary/entry/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.entry) {
          // Ensure file_url is absolute using FILE_BASE_URL
          const entryWithFullUrl = {
            ...data.entry,
            file_url: data.entry.file_url
              ? data.entry.file_url.startsWith('http')
                ? data.entry.file_url
                : `${FILE_BASE_URL}${data.entry.file_url}`
              : null,
          };

          setExistingEntry(entryWithFullUrl);
          setIsEditing(true);
          setFormData({
            entry_date: entryWithFullUrl.entry_date,
            text_report: entryWithFullUrl.text_report || '',
            file: null,
          });
          if (entryWithFullUrl.file_url) {
            setFilePreview(entryWithFullUrl.file_url);
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
        setError(t('diary.fileSizeError'));
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
        ? `${API_BASE_URL}/diary/entry/${existingEntry.id}`
        : `${API_BASE_URL}/diary/entry`;

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
          isDraft ? t('diary.savedAsDraft') : t('diary.submittedSuccessfully')
        );

        setTimeout(() => {
          navigate('/student/diary');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('diary.failedToSave'));
      }
    } catch (err) {
      setError(t('common.networkError'));
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
    // If the date is not part of any active program OR explicitly disabled/weekend, treat as disabled
    return !dateInfo || dateInfo.is_disabled || dateInfo.is_weekend;
  };

  const isDateValid = dateStr => !isDateDisabled(dateStr);

  // Ensure selected date is valid whenever programDates change
  useEffect(() => {
    if (programDates.length) {
      if (isDateDisabled(formData.entry_date)) {
        // Fallback to today if valid, otherwise first valid program date
        const todayStr = new Date().toISOString().split('T')[0];
        const fallbackDate = isDateValid(todayStr)
          ? todayStr
          : programDates.find(d => isDateValid(d.date))?.date;

        if (fallbackDate) {
          setFormData(prev => ({ ...prev, entry_date: fallbackDate }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programDates]);

  const validDateRange = getValidDateRange();

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {isEditing ? t('diary.editEntry') : t('diary.newEntry')}
          </h4>
          <p className="text-muted mb-0">
            {isEditing
              ? t('diary.editingEntryFor', {
                  date: new Date(formData.entry_date).toLocaleDateString(),
                })
              : t('diary.documentActivities')}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate('/student/diary')}
        >
          <i className="bx bx-arrow-back me-1"></i>
          {t('diary.backToDiary')}
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
              {t('diary.activePrograms')}
            </h6>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {programs.map((program, index) => (
                <span key={index} className="badge bg-primary">
                  {program.name}
                </span>
              ))}
            </div>
            <small className="text-muted">
              {t('diary.validDates')}{' '}
              {validDateRange.min
                ? new Date(validDateRange.min).toLocaleDateString()
                : t('common.notAvailable')}{' '}
              -{' '}
              {validDateRange.max
                ? new Date(validDateRange.max).toLocaleDateString()
                : t('common.notAvailable')}
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
                <h6 className="mb-1">{t('diary.entryStatus')}</h6>
                <div className="d-flex align-items-center">
                  {existingEntry.is_submitted ? (
                    <>
                      <span className="badge bg-success me-2">
                        {t('diary.submitted')}
                      </span>
                      <small className="text-muted">
                        {t('diary.on')}{' '}
                        {new Date(
                          existingEntry.submitted_at
                        ).toLocaleDateString()}
                      </small>
                    </>
                  ) : (
                    <span className="badge bg-warning">{t('diary.draft')}</span>
                  )}
                </div>
              </div>
              {existingEntry.mark !== null && (
                <div className="col-md-6">
                  <h6 className="mb-1">{t('diary.teacherEvaluation')}</h6>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-info me-2">
                      {t('diary.mark')}: {existingEntry.mark}/100
                    </span>
                    {existingEntry.marked_at && (
                      <small className="text-muted">
                        {t('diary.on')}{' '}
                        {new Date(existingEntry.marked_at).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
            {existingEntry.teacher_comment && (
              <div className="mt-3">
                <h6 className="mb-1">{t('diary.teacherComment')}</h6>
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
          <h5 className="mb-0">{t('diary.entryDetails')}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={e => handleSubmit(e, false)}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="entry_date" className="form-label">
                  {t('diary.entryDate')} <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={
                    !isDateValid(formData.entry_date)
                      ? 'form-control is-invalid'
                      : 'form-control'
                  }
                  id="entry_date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                  min={validDateRange.min}
                  max={validDateRange.max}
                  disabled={!canEdit}
                  required
                />
                <div className="form-text">{t('diary.selectDateHelp')}</div>
                {!isDateValid(formData.entry_date) && (
                  <div className="invalid-feedback d-block">
                    {t('diary.invalidDateSelection')}
                  </div>
                )}
                {formData.entry_date && isDateDisabled(formData.entry_date) && (
                  <div className="text-warning small mt-1">
                    <i className="bx bx-warning me-1"></i>
                    {t('diary.dateDisabledWarning')}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="text_report" className="form-label">
                {t('diary.dailyReport')} <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                id="text_report"
                name="text_report"
                rows="8"
                value={formData.text_report}
                onChange={handleInputChange}
                disabled={!canEdit}
                placeholder={t('diary.reportPlaceholder')}
                required
              />
              <div className="form-text">{t('diary.reportHelp')}</div>
            </div>

            <div className="mb-3">
              <label htmlFor="file" className="form-label">
                {t('diary.attachment')}
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
              <div className="form-text">{t('diary.attachmentHelp')}</div>
            </div>

            {/* File Preview */}
            {filePreview && (
              <div className="mb-3">
                <label className="form-label">{t('diary.filePreview')}</label>
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
                      <span>{t('diary.fileAttached')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Existing file info */}
            {existingEntry && existingEntry.file_url && !formData.file && (
              <div className="mb-3">
                <label className="form-label">
                  {t('diary.currentAttachment')}
                </label>
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <i className="bx bx-file me-2"></i>
                      <span>
                        {existingEntry.file_name || t('diary.attachment')}
                      </span>
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
                      {t('diary.download')}
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
                  disabled={loading || !isDateValid(formData.entry_date)}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      {t('diary.submitting')}
                    </>
                  ) : (
                    <>
                      <i className="bx bx-send me-1"></i>
                      {t('diary.submitEntry')}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={e => handleSubmit(e, true)}
                  disabled={loading || !isDateValid(formData.entry_date)}
                >
                  <i className="bx bx-save me-1"></i>
                  {t('diary.saveAsDraft')}
                </button>
              </div>
            )}

            {!canEdit && (
              <div className="alert alert-info">
                <i className="bx bx-info-circle me-2"></i>
                {t('diary.cannotEdit')}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiaryEntryPage;
