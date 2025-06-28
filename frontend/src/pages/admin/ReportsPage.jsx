import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState({
    overview: {},
    userStats: {},
    diaryStats: {},
    programStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');

  const { user } = useAuthStore();

  useEffect(() => {
    fetchReports();
  }, [selectedTimeframe]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Try to use the comprehensive analytics endpoint first
      try {
        const analyticsResponse = await fetch(
          `${API_BASE_URL}/api/users/admin/analytics?timeframe=${selectedTimeframe}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();

          setReports({
            userStats: analyticsData.userStats,
            diaryStats: analyticsData.diaryStats,
            programStats: analyticsData.programStats,
            overview: {
              engagementStats: analyticsData.engagementStats,
            },
          });
          return; // Success with comprehensive endpoint
        }
      } catch (comprError) {
        console.warn(
          'Comprehensive analytics endpoint failed, falling back to individual endpoints:',
          comprError
        );
      }

      // Fallback to individual endpoints if comprehensive endpoint fails
      const [overviewRes, usersRes, diaryAnalyticsRes, programsRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/diary/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `${API_BASE_URL}/api/diary/analytics?timeframe=${selectedTimeframe}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(`${API_BASE_URL}/api/programs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      // Now using real analytics endpoints

      if (usersRes.ok) {
        const userData = await usersRes.json();
        const users = userData.users || [];

        const userStats = {
          total: users.length,
          active: users.filter(u => u.is_active).length,
          students: users.filter(u => u.role === 'student').length,
          teachers: users.filter(u => u.role === 'teacher').length,
          admins: users.filter(u => u.role === 'super_admin').length,
          recentLogins: users.filter(u => {
            if (!u.last_login) return false;
            const loginDate = new Date(u.last_login);
            const daysAgo = parseInt(selectedTimeframe);
            const cutoff = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            return loginDate >= cutoff;
          }).length,
        };

        setReports(prev => ({ ...prev, userStats }));
      }

      if (programsRes.ok) {
        const programData = await programsRes.json();
        const programs = programData.programs || [];

        const programStats = {
          total: programs.length,
          active: programs.filter(p => p.is_active).length,
          upcoming: programs.filter(p => {
            if (!p.start_date) return false;
            return new Date(p.start_date) > new Date();
          }).length,
          ongoing: programs.filter(p => {
            if (!p.start_date || !p.end_date) return false;
            const now = new Date();
            return new Date(p.start_date) <= now && new Date(p.end_date) >= now;
          }).length,
          completed: programs.filter(p => {
            if (!p.end_date) return false;
            return new Date(p.end_date) < new Date();
          }).length,
        };

        setReports(prev => ({ ...prev, programStats }));
      }

      // Use real diary analytics data
      if (diaryAnalyticsRes.ok) {
        const diaryStats = await diaryAnalyticsRes.json();
        setReports(prev => ({ ...prev, diaryStats }));
      } else {
        // Fallback to basic calculation if analytics endpoint fails
        console.warn('Failed to fetch diary analytics, using fallback');
        const diaryStats = {
          totalEntries: 0,
          submittedEntries: 0,
          markedEntries: 0,
          avgMark: 0,
          entriesThisWeek: 0,
          pendingReviews: 0,
        };
        setReports(prev => ({ ...prev, diaryStats }));
      }

      // Process overview data if available
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setReports(prev => ({ ...prev, overview: overviewData }));
      }
    } catch (err) {
      setError(t('reports.failedToFetchReports'));
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementRate = () => {
    const { userStats } = reports;
    if (!userStats.total) return 0;
    return Math.round((userStats.recentLogins / userStats.total) * 100);
  };

  const getSubmissionRate = () => {
    const { diaryStats } = reports;
    if (!diaryStats.totalEntries) return 0;
    return Math.round(
      (diaryStats.submittedEntries / diaryStats.totalEntries) * 100
    );
  };

  const getMarkingProgress = () => {
    const { diaryStats } = reports;
    if (!diaryStats.submittedEntries) return 0;
    return Math.round(
      (diaryStats.markedEntries / diaryStats.submittedEntries) * 100
    );
  };

  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('reports.loading')}</span>
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
          <h4 className="fw-bold mb-1">{t('reports.analyticsAndReports')}</h4>
          <p className="text-muted mb-0">
            {t('reports.comprehensiveInsights')}
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value)}
          >
            <option value="7">{t('reports.last7Days')}</option>
            <option value="30">{t('reports.last30Days')}</option>
            <option value="90">{t('reports.last3Months')}</option>
            <option value="365">{t('reports.lastYear')}</option>
          </select>
          <button className="btn btn-primary">
            <i className="bx bx-download me-1"></i>
            {t('reports.export')}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span className="text-muted">{t('reports.totalUsers')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {reports.userStats.total || 0}
                    </h4>
                    <small className="text-success">(+12%)</small>
                  </div>
                  <small className="text-muted">
                    {reports.userStats.active || 0} {t('dashboard.active')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-user bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span className="text-muted">
                    {t('reports.diaryEntries')}
                  </span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {reports.diaryStats.totalEntries || 0}
                    </h4>
                    <small className="text-success">(+8%)</small>
                  </div>
                  <small className="text-muted">
                    {reports.diaryStats.entriesThisWeek || 0}{' '}
                    {t('reports.thisWeek')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-book-open bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span className="text-muted">
                    {t('reports.engagementRate')}
                  </span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {reports.overview?.engagementStats?.userEngagementRate ||
                        getEngagementRate()}
                      %
                    </h4>
                    <small className="text-warning">(±0%)</small>
                  </div>
                  <small className="text-muted">
                    {t('reports.usersActiveInDays', {
                      days: selectedTimeframe,
                    })}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-trending-up bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between">
                <div className="content-left">
                  <span className="text-muted">{t('reports.averageMark')}</span>
                  <div className="d-flex align-items-end mt-2">
                    <h4 className="mb-0 me-2">
                      {reports.diaryStats.avgMark || 0}
                    </h4>
                    <small className="text-success">(+2.1)</small>
                  </div>
                  <small className="text-muted">
                    {t('reports.outOfPoints')}
                  </small>
                </div>
                <div className="avatar">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-trophy bx-sm"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="row">
        {/* User Distribution */}
        <div className="col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">{t('reports.userDistribution')}</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="d-flex align-items-center">
                  <i className="bx bx-user-circle text-primary me-2"></i>
                  {t('reports.students')}
                </span>
                <div className="d-flex align-items-center">
                  <span className="me-2">
                    {reports.userStats.students || 0}
                  </span>
                  <div className="progress" style={{ width: '100px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{
                        width: `${reports.userStats.total ? (reports.userStats.students / reports.userStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="d-flex align-items-center">
                  <i className="bx bx-user-check text-success me-2"></i>
                  {t('reports.teachers')}
                </span>
                <div className="d-flex align-items-center">
                  <span className="me-2">
                    {reports.userStats.teachers || 0}
                  </span>
                  <div className="progress" style={{ width: '100px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{
                        width: `${reports.userStats.total ? (reports.userStats.teachers / reports.userStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center">
                  <i className="bx bx-crown text-warning me-2"></i>
                  {t('reports.admins')}
                </span>
                <div className="d-flex align-items-center">
                  <span className="me-2">{reports.userStats.admins || 0}</span>
                  <div className="progress" style={{ width: '100px' }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{
                        width: `${reports.userStats.total ? (reports.userStats.admins / reports.userStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Program Status */}
        <div className="col-md-6 col-12 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">{t('reports.programStatus')}</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <div className="avatar mx-auto mb-2">
                      <span className="avatar-initial rounded bg-label-primary">
                        <i className="bx bx-time-five"></i>
                      </span>
                    </div>
                    <span className="fw-bold">
                      {reports.programStats.upcoming || 0}
                    </span>
                    <small className="text-muted">
                      {t('reports.upcoming')}
                    </small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <div className="avatar mx-auto mb-2">
                      <span className="avatar-initial rounded bg-label-success">
                        <i className="bx bx-play-circle"></i>
                      </span>
                    </div>
                    <span className="fw-bold">
                      {reports.programStats.ongoing || 0}
                    </span>
                    <small className="text-muted">{t('reports.ongoing')}</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="d-flex flex-column">
                    <div className="avatar mx-auto mb-2">
                      <span className="avatar-initial rounded bg-label-info">
                        <i className="bx bx-check-circle"></i>
                      </span>
                    </div>
                    <span className="fw-bold">
                      {reports.programStats.completed || 0}
                    </span>
                    <small className="text-muted">
                      {t('reports.completed')}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">{t('reports.performanceMetrics')}</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-primary">
                        <i className="bx bx-file"></i>
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-0">{t('reports.submissionRate')}</h6>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-2">
                          {getSubmissionRate()}%
                        </span>
                        <div
                          className="progress flex-grow-1"
                          style={{ height: '6px' }}
                        >
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${getSubmissionRate()}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-success">
                        <i className="bx bx-check"></i>
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-0">{t('reports.markingProgress')}</h6>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-2">
                          {getMarkingProgress()}%
                        </span>
                        <div
                          className="progress flex-grow-1"
                          style={{ height: '6px' }}
                        >
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${getMarkingProgress()}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar flex-shrink-0 me-3">
                      <span className="avatar-initial rounded bg-label-warning">
                        <i className="bx bx-time"></i>
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-0">{t('reports.pendingReviews')}</h6>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-warning">
                          {reports.diaryStats.pendingReviews || 0}
                        </span>
                        <small className="text-muted ms-2">
                          {t('reports.entries')}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
