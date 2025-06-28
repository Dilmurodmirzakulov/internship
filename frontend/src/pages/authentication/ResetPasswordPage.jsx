import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './page-auth.css';
import { AuthWrapper } from './AuthWrapper';
import API_BASE_URL from '../../config/api';

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const ResetPasswordPage = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(null);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setError('Invalid reset link');
      setIsValidToken(false);
      return;
    }

    // Token is present, assume valid for now
    // In a real app, you might want to validate the token with the server
    setIsValidToken(true);
  }, [token]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword: values.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (isValidToken === null) {
    return (
      <AuthWrapper>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Validating reset link...</p>
        </div>
      </AuthWrapper>
    );
  }

  if (isValidToken === false) {
    return (
      <AuthWrapper>
        <h4 className="mb-2">Invalid Reset Link ❌</h4>
        <div className="alert alert-danger" role="alert">
          This password reset link is invalid or has expired.
        </div>
        <div className="text-center">
          <Link to="/auth/forgot-password" className="btn btn-primary">
            Request New Reset Link
          </Link>
        </div>
        <div className="text-center mt-3">
          <Link
            to="/auth/login"
            className="d-flex align-items-center justify-content-center"
          >
            <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
            Back to login
          </Link>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <h4 className="mb-2">Reset Password 🔒</h4>
      <p className="mb-4">Enter your new password below</p>

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

      <Formik
        initialValues={{
          newPassword: '',
          confirmPassword: '',
        }}
        validationSchema={resetPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="mb-3">
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <Field
                type="password"
                className="form-control"
                name="newPassword"
                placeholder="Enter new password"
                autoFocus
              />
              <ErrorMessage
                name="newPassword"
                component="div"
                className="text-danger small mt-1"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <Field
                type="password"
                className="form-control"
                name="confirmPassword"
                placeholder="Confirm new password"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-danger small mt-1"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary d-grid w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </Form>
        )}
      </Formik>

      <div className="text-center">
        <Link
          to="/auth/login"
          className="d-flex align-items-center justify-content-center"
        >
          <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
          Back to login
        </Link>
      </div>
    </AuthWrapper>
  );
};

export default ResetPasswordPage;
