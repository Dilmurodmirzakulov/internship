import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AccountWrapper } from '../../components/wrapper/AccountWrapper';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import API_BASE_URL from '../../config/api';

// Validation schemas will be created inside the component to access translations

export const AccountPage = () => {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Validation schemas with translations
  const passwordSchema = Yup.object().shape({
    currentPassword: Yup.string().required(t('forms.required')),
    newPassword: Yup.string()
      .min(6, t('forms.passwordTooShort'))
      .required(t('forms.required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], t('forms.passwordsDoNotMatch'))
      .required(t('forms.required')),
  });

  const profileSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, t('forms.required'))
      .max(100, t('forms.required'))
      .required(t('forms.required')),
    email: Yup.string()
      .email(t('forms.invalidEmail'))
      .required(t('forms.required')),
  });

  useEffect(() => {
    // Set initial profile image preview
    if (user?.profile_image) {
      setProfileImagePreview(`${API_BASE_URL}/uploads/${user.profile_image}`);
    }
  }, [user]);

  const handleProfileImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError(t('forms.fileTooLarge'));
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(t('forms.invalidFileType'));
        return;
      }

      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleResetImage = () => {
    setProfileImage(null);
    if (user?.profile_image) {
      setProfileImagePreview(`${API_BASE_URL}/uploads/${user.profile_image}`);
    } else {
      setProfileImagePreview(null);
    }
    // Reset file input
    const fileInput = document.getElementById('upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handlePasswordChange = async (values, { setSubmitting, resetForm }) => {
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSuccess('Password changed successfully!');
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (values, { setSubmitting }) => {
    setError('');
    setSuccess('');

    try {
      const { token } = useAuthStore.getState();
      const formData = new FormData();

      // Add text fields
      formData.append('name', values.name);
      formData.append('email', values.email);

      // Add profile image if selected
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Profile updated successfully!');

        // Update the auth store with new user data
        updateUser(data.user);

        // Reset profile image state
        setProfileImage(null);

        // Update preview with new image
        if (data.user.profile_image) {
          setProfileImagePreview(
            `${API_BASE_URL}/uploads/${data.user.profile_image}`
          );
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || t('account.failedToUpdateProfile'));
      }
    } catch (err) {
      setError(t('common.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountWrapper title={t('account.profile')}>
      <>
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

        <div className="card mb-4">
          <h5 className="card-header">{t('account.profileDetails')}</h5>
          <div className="card-body">
            <div className="d-flex align-items-start align-items-sm-center gap-4">
              <img
                src={profileImagePreview || '../assets/img/avatars/1.png'}
                alt="user-avatar"
                className="d-block rounded"
                height="100"
                width="100"
                aria-label="Account image"
              />
              <div className="button-wrapper">
                <label
                  htmlFor="upload"
                  className="btn btn-primary me-2 mb-4"
                  tabIndex="0"
                >
                  <span className="d-none d-sm-block">
                    {t('user.uploadPhoto')}
                  </span>
                  <i className="bx bx-upload d-block d-sm-none"></i>
                  <input
                    type="file"
                    id="upload"
                    className="account-file-input"
                    hidden
                    accept="image/png, image/jpeg"
                    onChange={handleProfileImageChange}
                  />
                </label>
                <button
                  aria-label="Click me"
                  type="button"
                  className="btn btn-outline-secondary account-image-reset mb-4"
                  onClick={handleResetImage}
                >
                  <i className="bx bx-reset d-block d-sm-none"></i>
                  <span className="d-none d-sm-block">
                    {t('account.resetImage')}
                  </span>
                </button>
                <p className="text-muted mb-0">{t('user.allowedFormats')}</p>
              </div>
            </div>
          </div>
          <hr className="my-0" />
          <div className="card-body">
            <Formik
              initialValues={{
                name: user?.name || '',
                email: user?.email || '',
              }}
              validationSchema={profileSchema}
              onSubmit={handleProfileUpdate}
              enableReinitialize={true}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="name" className="form-label">
                        {t('user.fullName')}
                      </label>
                      <Field
                        className="form-control"
                        type="text"
                        name="name"
                        placeholder={t('user.fullName')}
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="email" className="form-label">
                        {t('auth.email')}
                      </label>
                      <Field
                        className="form-control"
                        type="email"
                        name="email"
                        placeholder="john.doe@example.com"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="role" className="form-label">
                        {t('user.role')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={
                          user?.role?.replace('_', ' ').toUpperCase() || ''
                        }
                        disabled
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="group" className="form-label">
                        {t('user.group')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={user?.group?.name || t('user.notAssigned')}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? t('common.saving')
                        : t('common.saveChanges')}
                    </button>
                    <button type="reset" className="btn btn-outline-secondary">
                      {t('account.cancel')}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="card mb-4">
          <h5 className="card-header">{t('account.changePassword')}</h5>
          <div className="card-body">
            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              }}
              validationSchema={passwordSchema}
              onSubmit={handlePasswordChange}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="currentPassword" className="form-label">
                        {t('account.currentPassword')}
                      </label>
                      <Field
                        type="password"
                        className="form-control"
                        name="currentPassword"
                        placeholder={t('account.enterCurrentPassword')}
                      />
                      <ErrorMessage
                        name="currentPassword"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="newPassword" className="form-label">
                        {t('account.newPassword')}
                      </label>
                      <Field
                        type="password"
                        className="form-control"
                        name="newPassword"
                        placeholder={t('account.enterNewPassword')}
                      />
                      <ErrorMessage
                        name="newPassword"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="confirmPassword" className="form-label">
                        {t('account.confirmNewPassword')}
                      </label>
                      <Field
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        placeholder={t('account.confirmPassword')}
                      />
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="text-danger small mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? t('account.changingPassword')
                        : t('account.changePasswordButton')}
                    </button>
                    <button type="reset" className="btn btn-outline-secondary">
                      {t('account.cancel')}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        <div className="card">
          <h5 className="card-header">{t('account.deleteAccount')}</h5>
          <div className="card-body">
            <div className="mb-3 col-12 mb-0">
              <div className="alert alert-warning">
                <h6 className="alert-heading mb-1">
                  {t('account.deleteAccountWarning')}
                </h6>
                <p className="mb-0">{t('account.deleteAccountWarningText')}</p>
              </div>
            </div>
            <form
              id="formAccountDeactivation"
              onSubmit={e => e.preventDefault()}
            >
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="accountActivation"
                  id="accountActivation"
                />
                <label className="form-check-label" htmlFor="accountActivation">
                  {t('account.confirmAccountDeletion')}
                </label>
              </div>
              <button
                aria-label="Click me"
                type="submit"
                className="btn btn-danger deactivate-account"
              >
                {t('account.deactivateAccount')}
              </button>
            </form>
          </div>
        </div>
      </>
    </AccountWrapper>
  );
};

export default AccountPage;
