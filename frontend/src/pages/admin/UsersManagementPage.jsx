import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import API_BASE_URL from '../../config/api';

const UsersManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    group_id: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    group_id: '',
    assigned_group_ids: [], // For teachers' multiple group assignments
    is_active: true,
  });

  const { user } = useAuthStore();

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { token } = useAuthStore.getState();
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.role && { role: filters.role }),
        ...(filters.group_id && { group_id: filters.group_id }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`${API_BASE_URL}/api/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      } else {
        setError(t('errors.failedToFetchUsers'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
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
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMultiSelectChange = e => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);

    setFormData(prev => ({
      ...prev,
      [name]: selectedValues,
    }));
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = e => {
    const { value } = e.target;
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const url = editingUser
        ? `${API_BASE_URL}/api/users/${editingUser.id}`
        : `${API_BASE_URL}/api/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password; // Don't send empty password on update
      }

      // Only send assigned_group_ids for teachers
      if (submitData.role !== 'teacher') {
        delete submitData.assigned_group_ids;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSuccess(
          editingUser
            ? t('errors.userUpdatedSuccessfully')
            : t('errors.userCreatedSuccessfully')
        );
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('errors.failedToSaveUser'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
    }
  };

  const handleEdit = user => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      group_id: user.group_id || '',
      assigned_group_ids: user.assignedGroups
        ? user.assignedGroups.map(g => g.id)
        : [],
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = user => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(
        `${API_BASE_URL}/api/users/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSuccess(t('errors.userDeletedSuccessfully'));
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('errors.failedToDeleteUser'));
        setShowDeleteModal(false);
        setUserToDelete(null);
      }
    } catch (err) {
      setError(t('errors.networkErrorWhileDeleting'));
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      group_id: '',
      assigned_group_ids: [],
      is_active: true,
    });
    setEditingUser(null);
  };

  const getRoleBadge = role => {
    const colors = {
      super_admin: 'danger',
      teacher: 'primary',
      student: 'success',
    };
    const roleTexts = {
      super_admin: t('user.superAdmin'),
      teacher: t('user.teacher'),
      student: t('user.student'),
    };
    return (
      <span className={`badge bg-${colors[role] || 'secondary'}`}>
        {roleTexts[role] || role}
      </span>
    );
  };

  // Since we're doing server-side filtering, we don't need client-side filtering
  const filteredUsers = users;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('userManagement.title')}</h4>
          <p className="text-muted mb-0">{t('userManagement.subtitle')}</p>
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
          {t('userManagement.addUser')}
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

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">{t('common.search')}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('userManagement.searchPlaceholder')}
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">{t('user.role')}</label>
              <select
                className="form-select"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">{t('userManagement.allRoles')}</option>
                <option value="super_admin">{t('user.superAdmin')}</option>
                <option value="teacher">{t('user.teacher')}</option>
                <option value="student">{t('user.student')}</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">{t('user.group')}</label>
              <select
                className="form-select"
                name="group_id"
                value={filters.group_id}
                onChange={handleFilterChange}
              >
                <option value="">{t('userManagement.allGroups')}</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFilters({ role: '', group_id: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <i className="bx bx-refresh me-1"></i>
                {t('userManagement.clearFilters')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {t('userManagement.users')} ({pagination.total})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive text-nowrap">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{t('userManagement.user')}</th>
                      <th>{t('user.role')}</th>
                      <th>{t('user.group')}</th>
                      <th>{t('user.status')}</th>
                      <th>{t('userManagement.created')}</th>
                      <th>{t('userManagement.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm me-3">
                              <span className="avatar-initial rounded-circle bg-label-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h6 className="mb-0">
                                <Link
                                  to={`/admin/users/${user.id}`}
                                  className="text-decoration-none"
                                  style={{ cursor: 'pointer' }}
                                >
                                  {user.name}
                                </Link>
                              </h6>
                              <small className="text-muted">{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>
                          <div>
                            {user.role === 'student' && user.group && (
                              <span className="text-primary">
                                {user.group.name}
                              </span>
                            )}
                            {user.role === 'teacher' &&
                              user.assignedGroups &&
                              user.assignedGroups.length > 0 && (
                                <div>
                                  {user.assignedGroups.map(group => (
                                    <span
                                      key={group.id}
                                      className="badge bg-primary ms-1 mb-1"
                                    >
                                      {group.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            {((user.role === 'student' && !user.group) ||
                              (user.role === 'teacher' &&
                                (!user.assignedGroups ||
                                  user.assignedGroups.length === 0))) && (
                              <span className="text-muted">
                                {t('userManagement.noGroup')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {user.is_active ? (
                            <span className="badge bg-success">
                              {t('user.active')}
                            </span>
                          ) : (
                            <span className="badge bg-secondary">
                              {t('user.inactive')}
                            </span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(user.created_at).toLocaleDateString()}
                          </small>
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
                                to={`/admin/users/${user.id}`}
                                className="dropdown-item"
                              >
                                <i className="bx bx-show me-1"></i>{' '}
                                {t('userManagement.viewDetails')}
                              </Link>
                              <button
                                className="dropdown-item"
                                onClick={() => handleEdit(user)}
                              >
                                <i className="bx bx-edit-alt me-1"></i>{' '}
                                {t('common.edit')}
                              </button>
                              {user.role !== 'super_admin' &&
                                user.id !==
                                  useAuthStore.getState().user?.id && (
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDeleteClick(user)}
                                  >
                                    <i className="bx bx-trash me-1"></i>{' '}
                                    {t('common.delete')}
                                  </button>
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={pagination.page === 1}
                      >
                        {t('pagination.previous')}
                      </button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <li
                        key={i}
                        className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            setPagination(prev => ({ ...prev, page: i + 1 }))
                          }
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={pagination.page === pagination.totalPages}
                      >
                        {t('pagination.next')}
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
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
                  {editingUser
                    ? t('userManagement.editUser')
                    : t('userManagement.addNewUser')}
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
                    <label className="form-label">{t('user.name')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('user.email')} *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {t('auth.password')}{' '}
                      {editingUser ? t('userManagement.leaveBlankToKeep') : '*'}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('user.role')} *</label>
                    <select
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="student">{t('user.student')}</option>
                      <option value="teacher">{t('user.teacher')}</option>
                      <option value="super_admin">
                        {t('user.superAdmin')}
                      </option>
                    </select>
                  </div>
                  {formData.role === 'student' && (
                    <div className="mb-3">
                      <label className="form-label">{t('user.group')} *</label>
                      <select
                        className="form-select"
                        name="group_id"
                        value={formData.group_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">
                          {t('userManagement.selectGroup')}
                        </option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.role === 'teacher' && (
                    <div className="mb-3">
                      <label className="form-label">
                        {t('userManagement.assignedGroups')} *
                      </label>
                      <select
                        className="form-select"
                        name="assigned_group_ids"
                        value={formData.assigned_group_ids}
                        onChange={handleMultiSelectChange}
                        multiple
                        size="4"
                        style={{ minHeight: '100px' }}
                        required
                      >
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted">
                        {t('userManagement.holdCtrlToSelect')}
                      </small>
                    </div>
                  )}
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
                        {t('userManagement.activeUser')}
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
                    {editingUser
                      ? t('userManagement.updateUser')
                      : t('userManagement.createUser')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModal && <div className="modal-backdrop fade show"></div>}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="bx bx-trash me-2"></i>
                  {t('userManagement.confirmDeleteTitle')}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bx bx-info-circle me-2"></i>
                  <strong>{t('common.warning')}:</strong>{' '}
                  {t('userManagement.confirmDeleteWarning')}
                </div>
                {userToDelete && (
                  <p>
                    {t('userManagement.confirmDeleteMessage', {
                      name: userToDelete.name,
                      email: userToDelete.email,
                    })}
                  </p>
                )}
                <p className="text-muted mb-0">
                  {t('userManagement.deleteWarningText')}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  {t('userManagement.deleteUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default UsersManagementPage;
