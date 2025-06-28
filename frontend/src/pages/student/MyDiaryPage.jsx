import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import API_BASE_URL from '../../config/api';

const MyDiaryPage = () => {
  const { t } = useTranslation();
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [programDates, setProgramDates] = useState([]);
  const [program, setProgram] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiaryEntries();
    fetchProgramDates();
  }, []);

  const fetchDiaryEntries = async () => {
    try {
      setLoading(true);
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/diary/my-entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDiaryEntries(data.entries || []);
      } else {
        setError(t('diary.failedToFetch'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDates = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/diary/program-dates/${user.group_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgramDates(data.dates || []);
        // Handle multiple programs - use the first one for display or create a combined view
        if (data.programs && data.programs.length > 0) {
          // For display purposes, show info about all programs
          const combinedProgram = {
            name:
              data.programs.length === 1
                ? data.programs[0].name
                : t('diary.multipleActivePrograms', {
                    count: data.programs.length,
                  }),
            start_date: Math.min(
              ...data.programs.map(p => new Date(p.start_date))
            ),
            end_date: Math.max(...data.programs.map(p => new Date(p.end_date))),
            programs: data.programs,
          };
          setProgram(combinedProgram);
        } else {
          // Fallback for backward compatibility
          setProgram(data.program);
        }
      }
    } catch (err) {
      console.error('Failed to fetch program dates:', err);
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
      return <span className="badge bg-warning">{t('diary.draft')}</span>;
    }
    if (entry.mark !== null) {
      return (
        <span className="badge bg-success">
          {t('diary.marked')} ({entry.mark}/100)
        </span>
      );
    }
    return <span className="badge bg-info">{t('diary.submitted')}</span>;
  };

  const getDateStatus = dateStr => {
    const entry = diaryEntries.find(e => e.entry_date === dateStr);
    const dateInfo = programDates.find(d => d.date === dateStr);

    if (dateInfo?.is_disabled) return 'disabled';
    if (dateInfo?.is_weekend) return 'weekend';
    if (entry?.is_submitted && entry?.mark !== null) return 'completed';
    if (entry?.is_submitted) return 'submitted';
    if (entry && !entry.is_submitted) return 'draft';

    const today = new Date().toISOString().split('T')[0];
    if (dateStr > today) return 'future';
    return 'missing';
  };

  const getDateStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'submitted':
        return 'warning';
      case 'draft':
        return 'info';
      case 'missing':
        return 'danger';
      case 'disabled':
        return 'secondary';
      case 'weekend':
        return 'light';
      case 'future':
        return 'light';
      default:
        return 'light';
    }
  };

  const getDateStatusText = status => {
    switch (status) {
      case 'completed':
        return t('diary.status.completed');
      case 'submitted':
        return t('diary.status.submitted');
      case 'draft':
        return t('diary.status.draft');
      case 'missing':
        return t('diary.status.missing');
      case 'disabled':
        return t('diary.status.holiday');
      case 'weekend':
        return t('diary.status.weekend');
      case 'future':
        return t('diary.status.upcoming');
      default:
        return '';
    }
  };

  const renderCalendar = () => {
    if (!program || !programDates.length) return null;

    const startDate = new Date(program.start_date);
    const endDate = new Date(program.end_date);
    const weeks = [];

    // Generate calendar weeks
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday

    while (currentDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInProgram = currentDate >= startDate && currentDate <= endDate;

        week.push({
          date: new Date(currentDate),
          dateStr,
          isInProgram,
          status: isInProgram ? getDateStatus(dateStr) : 'outside',
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return (
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{t('diary.programCalendar')}</h5>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {showCalendar ? t('diary.hideCalendar') : t('diary.showCalendar')}
          </button>
        </div>

        {showCalendar && (
          <div className="card-body">
            <div className="mb-3">
              <h6>{program.name}</h6>
              <p className="text-muted mb-2">
                {new Date(program.start_date).toLocaleDateString()} -{' '}
                {new Date(program.end_date).toLocaleDateString()}
              </p>

              {/* Show multiple programs if available */}
              {program.programs && program.programs.length > 1 && (
                <div className="mb-3">
                  <small className="text-muted">
                    {t('diary.activePrograms')}:
                  </small>
                  <div className="mt-1">
                    {program.programs.map((prog, index) => (
                      <span key={index} className="badge bg-primary me-1 mb-1">
                        {prog.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge bg-success">
                  {t('diary.status.completed')}
                </span>
                <span className="badge bg-warning">
                  {t('diary.status.submitted')}
                </span>
                <span className="badge bg-info">{t('diary.status.draft')}</span>
                <span className="badge bg-danger">
                  {t('diary.status.missing')}
                </span>
                <span className="badge bg-secondary">
                  {t('diary.status.holiday')}
                </span>
                <span className="badge bg-light text-dark">
                  {t('diary.status.weekend')}
                </span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th className="text-center">Sun</th>
                    <th className="text-center">Mon</th>
                    <th className="text-center">Tue</th>
                    <th className="text-center">Wed</th>
                    <th className="text-center">Thu</th>
                    <th className="text-center">Fri</th>
                    <th className="text-center">Sat</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      {week.map((day, dayIndex) => (
                        <td
                          key={dayIndex}
                          className="text-center p-1"
                          style={{ width: '14.28%', height: '60px' }}
                        >
                          {day.isInProgram ? (
                            <div
                              className={`d-flex flex-column justify-content-center align-items-center h-100 rounded ${
                                day.status !== 'outside'
                                  ? `bg-${getDateStatusColor(day.status)}`
                                  : ''
                              } ${day.status === 'light' ? 'text-dark' : day.status !== 'outside' ? 'text-white' : ''}`}
                              style={{
                                minHeight: '50px',
                                cursor:
                                  day.status === 'missing' ||
                                  day.status === 'draft' ||
                                  day.status === 'submitted' ||
                                  day.status === 'completed' ||
                                  day.status === 'future'
                                    ? 'pointer'
                                    : 'default',
                              }}
                              onClick={() => {
                                // Allow creating entries for any date that's not disabled or weekend
                                if (
                                  day.status === 'missing' ||
                                  day.status === 'draft' ||
                                  day.status === 'submitted' ||
                                  day.status === 'completed' ||
                                  day.status === 'future'
                                ) {
                                  navigate(
                                    `/student/diary/entry/${day.dateStr}`
                                  );
                                }
                              }}
                            >
                              <div className="fw-bold">
                                {day.date.getDate()}
                              </div>
                              <small className="text-xs">
                                {getDateStatusText(day.status)}
                              </small>
                            </div>
                          ) : (
                            <div className="text-muted">
                              {day.date.getDate()}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
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
          <h4 className="fw-bold mb-1">{t('diary.myInternshipDiary')}</h4>
          <p className="text-muted mb-0">
            {t('diary.trackActivitiesAndProgress')}
          </p>
        </div>
        <Link to="/student/diary/entry" className="btn btn-primary">
          <i className="bx bx-plus me-1"></i>
          {t('diary.newEntry')}
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('diary.totalEntries')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">{diaryEntries.length}</h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-primary">
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
                  <span>{t('diary.submitted')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {diaryEntries.filter(entry => entry.is_submitted).length}
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

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span>{t('diary.marked')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {diaryEntries.filter(entry => entry.mark !== null).length}
                    </h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-star bx-sm"></i>
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
                  <span>{t('diary.averageMark')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {diaryEntries.filter(entry => entry.mark !== null)
                        .length > 0
                        ? Math.round(
                            diaryEntries
                              .filter(entry => entry.mark !== null)
                              .reduce((sum, entry) => sum + entry.mark, 0) /
                              diaryEntries.filter(entry => entry.mark !== null)
                                .length
                          )
                        : 0}
                    </h4>
                  </div>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-trophy bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diary Entries List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{t('diary.diaryEntries')}</h5>
          <small className="text-muted">
            {diaryEntries.length} {t('diary.entries')}
          </small>
        </div>
        <div className="card-body">
          {diaryEntries.length === 0 ? (
            <div className="text-center py-4">
              <div className="avatar avatar-xl mx-auto mb-3">
                <span className="avatar-initial rounded-circle bg-label-secondary">
                  <i className="bx bx-book-open bx-lg"></i>
                </span>
              </div>
              <h5 className="mb-2">{t('diary.noDiaryEntries')}</h5>
              <p className="text-muted mb-4">{t('diary.startDocumenting')}</p>
              <Link to="/student/diary/entry" className="btn btn-primary">
                <i className="bx bx-plus me-1"></i>
                {t('diary.createFirstEntry')}
              </Link>
            </div>
          ) : (
            <div className="table-responsive text-nowrap">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>{t('common.date')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('diary.mark')}</th>
                    <th>{t('diary.teacherComment')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diaryEntries
                    .sort(
                      (a, b) => new Date(b.entry_date) - new Date(a.entry_date)
                    )
                    .map(entry => (
                      <tr key={entry.id}>
                        <td>
                          <div>
                            <h6 className="mb-0">
                              {formatDate(entry.entry_date)}
                            </h6>
                            {entry.submitted_at && (
                              <small className="text-muted">
                                {t('diary.submitted')}:{' '}
                                {new Date(
                                  entry.submitted_at
                                ).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(entry)}</td>
                        <td>
                          {entry.mark !== null ? (
                            <span className="fw-medium">{entry.mark}/100</span>
                          ) : (
                            <span className="text-muted">
                              {t('diary.notMarked')}
                            </span>
                          )}
                        </td>
                        <td>
                          {entry.teacher_comment ? (
                            <div
                              className="text-truncate"
                              style={{ maxWidth: '200px' }}
                            >
                              {entry.teacher_comment}
                            </div>
                          ) : (
                            <span className="text-muted">
                              {t('diary.noComment')}
                            </span>
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
                                to={`/student/diary/entry/${entry.entry_date}`}
                              >
                                <i className="bx bx-show me-1"></i>{' '}
                                {t('common.view')}
                              </Link>
                              {!entry.is_submitted && (
                                <Link
                                  className="dropdown-item"
                                  to={`/student/diary/entry/${entry.entry_date}`}
                                >
                                  <i className="bx bx-edit-alt me-1"></i>{' '}
                                  {t('common.edit')}
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

      {renderCalendar()}
    </div>
  );
};

export default MyDiaryPage;
