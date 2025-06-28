import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

const GroupsManagementPage = () => {
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
      const response = await fetch('/api/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        setError('Failed to fetch groups');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await fetch('/api/programs', {
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
        ? `/api/groups/${editingGroup.id}`
        : '/api/groups';
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
            ? 'Group updated successfully!'
            : 'Group created successfully!'
        );
        setShowModal(false);
        resetForm();
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save group');
      }
    } catch (err) {
      setError('Network error occurred');
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
    if (
      !confirm(
        'Are you sure you want to delete this group? This will affect all associated users.'
      )
    )
      return;

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Group deleted successfully!');
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete group');
      }
    } catch (err) {
      setError('Network error occurred');
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
        {isActive ? 'Active' : 'Inactive'}
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
          <h4 className="fw-bold mb-1">Groups Management</h4>
          <p className="text-muted mb-0">
            Manage internship groups and assign students to programs
          </p>
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
          Add Group
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
              <span className="visually-hidden">Loading...</span>
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
                <h5 className="mb-2">No Groups Found</h5>
                <p className="text-muted mb-4">
                  Create your first internship group to start organizing
                  students.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <i className="bx bx-plus me-1"></i>
                  Create First Group
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
                          <i className="bx bx-edit-alt me-1"></i> Edit
                        </button>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleDelete(group.id)}
                        >
                          <i className="bx bx-trash me-1"></i> Delete
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
                        <small className="text-muted">Students</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex flex-column">
                        <h6 className="mb-0">{group.max_students || 30}</h6>
                        <small className="text-muted">Max Capacity</small>
                      </div>
                    </div>
                  </div>

                  {group.program && (
                    <div className="mt-3">
                      <small className="text-muted">Program:</small>
                      <p className="mb-0 fw-medium">{group.program.name}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <small className="text-muted">Created:</small>
                    <p className="mb-0">
                      {new Date(group.created_at).toLocaleDateString()}
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
                  {editingGroup ? 'Edit Group' : 'Add New Group'}
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
                    <label className="form-label">Group Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Engineering Group A"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Brief description of the group..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Internship Program</label>
                    <select
                      className="form-select"
                      name="program_id"
                      value={formData.program_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Program</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Maximum Students</label>
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
                      Maximum number of students that can be assigned to this
                      group
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
                      <label className="form-check-label">Active Group</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingGroup ? 'Update Group' : 'Create Group'}
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
