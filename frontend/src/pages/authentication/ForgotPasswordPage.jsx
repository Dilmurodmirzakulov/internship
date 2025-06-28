import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './page-auth.css';
import { AuthWrapper } from './AuthWrapper';
import API_BASE_URL from '../../config/api';

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export const ForgotPasswordPage = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    setSuccess('');
    setResetUrl('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // In development, show the reset URL for testing
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthWrapper>
      <h4 className="mb-2">Forgot Password? 🔒</h4>
      <p className="mb-4">
        Enter your email and we'll send you instructions to reset your password
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
          {resetUrl && (
            <div className="mt-3">
              <strong>Development Mode:</strong>
              <p className="mb-2">Copy this URL to reset your password:</p>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={resetUrl}
                  readOnly
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(resetUrl)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Formik
        initialValues={{ email: '' }}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="mb-3">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <Field
                type="email"
                className="form-control"
                name="email"
                placeholder="Enter your email"
                autoFocus
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-danger small mt-1"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary d-grid w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
