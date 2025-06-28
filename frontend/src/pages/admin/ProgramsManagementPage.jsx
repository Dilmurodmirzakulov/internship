import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';
import { formatDate } from '../../utils/dateUtils';

const ProgramsManagementPage = () => {
  const { t } = useTranslation();
  const [programs, setPrograms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    assigned_group_ids: [],
    disabled_days: [],
    is_active: true,
  });

  const { user } = useAuthStore();

  const daysOfWeek = [
    { value: 'sunday', label: t('common.days.sunday') },
    { value: 'monday', label: t('common.days.monday') },
    { value: 'tuesday', label: t('common.days.tuesday') },
    { value: 'wednesday', label: t('common.days.wednesday') },
    { value: 'thursday', label: t('common.days.thursday') },
    { value: 'friday', label: t('common.days.friday') },
    { value: 'saturday', label: t('common.days.saturday') },
  ];

  useEffect(() => {
    fetchPrograms();
    fetchGroups();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      } else {
        setError(t('programs.failedToFetch'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        console.error('Failed to fetch groups');
      }
    } catch (err) {
      console.error('Network error occurred while fetching groups:', err);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGroupChange = groupId => {
    setFormData(prev => ({
      ...prev,
      assigned_group_ids: prev.assigned_group_ids.includes(groupId)
        ? prev.assigned_group_ids.filter(id => id !== groupId)
        : [...prev.assigned_group_ids, groupId],
    }));
  };

  const handleDisabledDayChange = day => {
    setFormData(prev => ({
      ...prev,
      disabled_days: prev.disabled_days.includes(day)
        ? prev.disabled_days.filter(d => d !== day)
        : [...prev.disabled_days, day],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.assigned_group_ids.length === 0) {
      setError(t('programs.selectAtLeastOneGroup'));
      return;
    }

    try {
      const { token } = useAuthStore.getState();
      const url = editingProgram
        ? `${API_BASE_URL}/api/programs/${editingProgram.id}`
        : `${API_BASE_URL}/api/programs`;
      const method = editingProgram ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(
          editingProgram
            ? t('programs.updatedSuccessfully')
            : t('programs.createdSuccessfully')
        );
        setShowModal(false);
        resetForm();
        fetchPrograms();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('programs.failedToSave'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    }
  };

  const handleEdit = program => {
    setEditingProgram(program);

    // Get assigned group IDs from both old and new structure
    const assignedGroupIds = [];
    if (program.group_id) {
      assignedGroupIds.push(program.group_id);
    }
    if (program.assignedGroups && program.assignedGroups.length > 0) {
      assignedGroupIds.push(...program.assignedGroups.map(g => g.id));
    }

    setFormData({
      name: program.name,
      description: program.description || '',
      start_date: program.start_date ? program.start_date.split('T')[0] : '',
      end_date: program.end_date ? program.end_date.split('T')[0] : '',
      assigned_group_ids: [...new Set(assignedGroupIds)], // Remove duplicates
      disabled_days: program.disabled_days || [],
      is_active: program.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async programId => {
    if (!confirm(t('programs.confirmDelete'))) return;

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/programs/${programId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSuccess(t('programs.deletedSuccessfully'));
        fetchPrograms();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('programs.failedToDelete'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      assigned_group_ids: [],
      disabled_days: [],
      is_active: true,
    });
    setEditingProgram(null);
  };

  const getStatusBadge = isActive => {
    return (
      <span className={`badge bg-${isActive ? 'success' : 'secondary'}`}>
        {isActive ? t('common.active') : t('common.inactive')}
      </span>
    );
  };

  const getProgramStatus = program => {
    if (!program.start_date || !program.end_date)
      return t('programs.notScheduled');

    const now = new Date();
    const start = new Date(program.start_date);
    const end = new Date(program.end_date);

    if (now < start) return t('programs.upcoming');
    if (now > end) return t('programs.completed');
    return t('programs.inProgress');
  };

  const getStatusColor = status => {
    switch (status) {
      case t('programs.upcoming'):
        return 'info';
      case t('programs.inProgress'):
        return 'primary';
      case t('programs.completed'):
        return 'success';
      default:
        return 'secondary';
    }
  };

  const formatDateSafe = dateString => {
    return formatDate(dateString, t('common.notSet'));
  };

  const getProgramGroups = program => {
    const groups = [];

    // Add primary group (backward compatibility)
    if (program.group && program.group.name) {
      groups.push(program.group.name);
    }

    // Add assigned groups
    if (program.assignedGroups && program.assignedGroups.length > 0) {
      groups.push(...program.assignedGroups.map(g => g.name));
    }

    // Remove duplicates and return
    return [...new Set(groups)];
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('programs.title')}</h4>
          <p className="text-muted mb-0">{t('programs.description')}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bx bx-plus me-1"></i>
          {t('programs.addProgram')}
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

      {/* Programs Grid */}
      <div className="row">
        {loading ? (
          <div className="col-12 d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="avatar avatar-xl mx-auto mb-3">
                  <span className="avatar-initial rounded-circle bg-label-secondary">
                    <i className="bx bx-calendar bx-lg"></i>
                  </span>
                </div>
                <h5 className="mb-2">{t('programs.noProgramsFound')}</h5>
                <p className="text-muted mb-4">
                  {t('programs.createFirstProgram')}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <i className="bx bx-plus me-1"></i>
                  {t('programs.createFirstProgramButton')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          programs.map(program => (
            <div key={program.id} className="col-lg-6 col-md-12 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="avatar">
                      <span className="avatar-initial rounded bg-label-primary">
                        <i className="bx bx-calendar bx-sm"></i>
                      </span>
                    </div>
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn p-0 dropdown-toggle hide-arrow"
                        data-bs-toggle="dropdown"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={() => handleEdit(program)}
                        >
                          <i className="bx bx-edit-alt me-1"></i>{' '}
                          {t('common.edit')}
                        </button>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleDelete(program.id)}
                        >
                          <i className="bx bx-trash me-1"></i>{' '}
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <h5 className="card-title mb-2">{program.name}</h5>

                  {program.description && (
                    <p className="text-muted small mb-3">
                      {program.description}
                    </p>
                  )}

                  <div className="mb-3">
                    {getStatusBadge(program.is_active)}
                    <span
                      className={`badge bg-${getStatusColor(getProgramStatus(program))} ms-2`}
                    >
                      {getProgramStatus(program)}
                    </span>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <small className="text-muted">
                        {t('programs.startDate')}:
                      </small>
                      <p className="mb-0 fw-medium">
                        {formatDateSafe(program.start_date)}
                      </p>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">
                        {t('programs.endDate')}:
                      </small>
                      <p className="mb-0 fw-medium">
                        {formatDateSafe(program.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">
                      {t('programs.assignedGroups')}:
                    </small>
                    <div className="mt-1">
                      {getProgramGroups(program).length > 0 ? (
                        getProgramGroups(program).map((groupName, index) => (
                          <span
                            key={index}
                            className="badge bg-primary me-1 mb-1"
                          >
                            {groupName}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">
                          {t('programs.noGroupsAssigned')}
                        </span>
                      )}
                    </div>
                  </div>

                  {program.disabled_days &&
                    program.disabled_days.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted">
                          {t('programs.disabledDays')}:
                        </small>
                        <div className="mt-1">
                          {program.disabled_days.map(day => (
                            <span
                              key={day}
                              className="badge bg-light text-dark me-1"
                            >
                              {t(`common.days.${day.toLowerCase()}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-3">
                    <small className="text-muted">
                      {t('programs.created')}:
                    </small>
                    <p className="mb-0">{formatDateSafe(program.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Program Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProgram
                    ? t('programs.editProgram')
                    : t('programs.addNewProgram')}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        {t('programs.programName')} *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={t('programs.programNamePlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('programs.assignedGroups')} *
                    </label>
                    <div className="form-text mb-2">
                      {t('programs.selectGroupsText')}
                    </div>
                    <div className="row">
                      {groups.map(group => (
                        <div key={group.id} className="col-md-6 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.assigned_group_ids.includes(
                                group.id
                              )}
                              onChange={() => handleGroupChange(group.id)}
                            />
                            <label className="form-check-label">
                              {group.name}
                              {group.description && (
                                <small className="text-muted d-block">
                                  {group.description}
                                </small>
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.assigned_group_ids.length === 0 && (
                      <div className="text-danger small mt-1">
                        {t('programs.selectAtLeastOneGroup')}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('programs.description')}
                    </label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder={t('programs.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t('programs.startDate')} *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {t('programs.endDate')} *
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('programs.disabledDays')}
                    </label>
                    <div className="form-text mb-2">
                      {t('programs.disabledDaysText')}
                    </div>
                    <div className="row">
                      {daysOfWeek.map(day => (
                        <div key={day.value} className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.disabled_days.includes(
                                day.value
                              )}
                              onChange={() =>
                                handleDisabledDayChange(day.value)
                              }
                            />
                            <label className="form-check-label">
                              {day.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        {t('programs.activeProgram')}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProgram
                      ? t('programs.updateProgram')
                      : t('programs.createProgram')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ProgramsManagementPage;
