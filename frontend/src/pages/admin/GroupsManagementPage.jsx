import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';
import { formatDate } from '../../utils/dateUtils';

const GroupsManagementPage = () => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    program_id: '',
    max_students: 30,
    is_active: true,
  });

  const { user } = useAuthStore();

  useEffect(() => {
    fetchGroups();
    fetchPrograms();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
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
        setError(t('groups.failedToFetch'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const url = editingGroup
        ? `${API_BASE_URL}/api/groups/${editingGroup.id}`
        : `${API_BASE_URL}/api/groups`;
      const method = editingGroup ? 'PUT' : 'POST';

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
          editingGroup
            ? t('groups.updatedSuccessfully')
            : t('groups.createdSuccessfully')
        );
        setShowModal(false);
        resetForm();
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('groups.failedToSave'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    }
  };

  const handleEdit = group => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      program_id: group.program_id || '',
      max_students: group.max_students || 30,
      is_active: group.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async groupId => {
    if (!confirm(t('groups.confirmDelete'))) return;

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess(t('groups.deletedSuccessfully'));
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('groups.failedToDelete'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      program_id: '',
      max_students: 30,
      is_active: true,
    });
    setEditingGroup(null);
  };

  const getStatusBadge = isActive => {
    return (
      <span className={`badge bg-${isActive ? 'success' : 'secondary'}`}>
        {isActive ? t('common.active') : t('common.inactive')}
      </span>
    );
  };

  const getStudentCount = group => {
    // This would typically come from the backend with user counts
    return group.student_count || 0;
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('groups.title')}</h4>
          <p className="text-muted mb-0">{t('groups.subtitle')}</p>
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
          {t('groups.addGroup')}
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

      {/* Groups Grid */}
      <div className="row">
        {loading ? (
          <div className="col-12 d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="avatar avatar-xl mx-auto mb-3">
                  <span className="avatar-initial rounded-circle bg-label-secondary">
                    <i className="bx bx-group bx-lg"></i>
                  </span>
                </div>
                <h5 className="mb-2">{t('groups.noGroupsFound')}</h5>
                <p className="text-muted mb-4">
                  {t('groups.createFirstGroup')}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <i className="bx bx-plus me-1"></i>
                  {t('groups.createFirstGroupButton')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="avatar">
                      <span className="avatar-initial rounded bg-label-primary">
                        <i className="bx bx-group bx-sm"></i>
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
                          onClick={() => handleEdit(group)}
                        >
                          <i className="bx bx-edit-alt me-1"></i>{' '}
                          {t('common.edit')}
                        </button>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleDelete(group.id)}
                        >
                          <i className="bx bx-trash me-1"></i>{' '}
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <h5 className="card-title mb-2">{group.name}</h5>

                  {group.description && (
                    <p className="text-muted small mb-3">{group.description}</p>
                  )}

                  <div className="mb-3">{getStatusBadge(group.is_active)}</div>

                  <div className="row text-center">
                    <div className="col-6">
                      <div className="d-flex flex-column">
                        <h6 className="mb-0">{getStudentCount(group)}</h6>
                        <small className="text-muted">
                          {t('groups.students')}
                        </small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex flex-column">
                        <h6 className="mb-0">{group.max_students || 30}</h6>
                        <small className="text-muted">
                          {t('groups.maxCapacity')}
                        </small>
                      </div>
                    </div>
                  </div>

                  {group.program && (
                    <div className="mt-3">
                      <small className="text-muted">
                        {t('groups.program')}:
                      </small>
                      <p className="mb-0 fw-medium">{group.program.name}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <small className="text-muted">{t('groups.created')}:</small>
                    <p className="mb-0">
                      {formatDate(group.created_at, t('common.notSet'))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingGroup
                    ? t('groups.editGroup')
                    : t('groups.addNewGroup')}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      {t('groups.groupName')} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('groups.groupNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('groups.description')}
                    </label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder={t('groups.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('groups.internshipProgram')}
                    </label>
                    <select
                      className="form-select"
                      name="program_id"
                      value={formData.program_id}
                      onChange={handleInputChange}
                    >
                      <option value="">{t('groups.selectProgram')}</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      {t('groups.maximumStudents')}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="max_students"
                      value={formData.max_students}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                    />
                    <div className="form-text">
                      {t('groups.maximumStudentsHelp')}
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
                        {t('groups.activeGroup')}
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
                    {t('groups.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingGroup
                      ? t('groups.updateGroup')
                      : t('groups.createGroup')}
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

export default GroupsManagementPage;
