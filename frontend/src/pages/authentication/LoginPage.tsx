import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import './page-auth.css';

// Validation schema will be created inside the component to access translations

// Initial form values
const initialValues = {
  email: '',
  password: '',
  rememberMe: false,
};

const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, clearError } =
    useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Validation schema with translations
  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email(t('forms.invalidEmail'))
      .required(t('forms.required')),
    password: Yup.string()
      .min(6, t('forms.passwordTooShort'))
      .required(t('forms.required')),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any
  ) => {
    console.log('Form submitted with:', {
      email: values.email,
      password: '***',
    });
    clearError();

    try {
      const success = await login(values.email, values.password);
      console.log('Login result:', success);

      if (success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/', { replace: true });
      } else {
        console.log('Login failed - form will not reset');
        // Don't reset form on failure so user can try again
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    console.log('Container clicked:', e.target);
    // Prevent any unwanted behavior
  };

  return (
    <div
      className="authentication-wrapper authentication-basic"
      onClick={handleContainerClick}
    >
      <div className="authentication-inner py-4">
        <div className="card" onClick={e => e.stopPropagation()}>
          <div className="card-body">
            <div className="app-brand justify-content-center">
              <a href="/" className="app-brand-link gap-2">
                <span className="app-brand-logo demo">
                  <i
                    className="bx bx-book-open"
                    style={{ fontSize: '2rem', color: '#696cff' }}
                  ></i>
                </span>
                <span className="app-brand-text demo text-body fw-bolder">
                  TECHAMAL
                </span>
              </a>
            </div>

            <h4 className="mb-2">{t('auth.welcomeBack')} 👋</h4>
            <p className="mb-4">{t('auth.pleaseSignIn')}</p>

            {error && (
              <div className="alert alert-danger" role="alert">
                <div className="alert-body">{error}</div>
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={loginSchema}
              onSubmit={handleSubmit}
              enableReinitialize={false}
              validateOnChange={true}
              validateOnBlur={false}
            >
              {({ isSubmitting, touched, errors, values }) => {
                console.log('Current form values:', values);
                return (
                  <Form className="mb-3">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        {t('auth.email')}
                      </label>
                      <Field
                        type="email"
                        name="email"
                        className={`form-control ${
                          touched.email && errors.email ? 'is-invalid' : ''
                        }`}
                        placeholder={t('auth.email')}
                        autoFocus
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="invalid-feedback"
                      />
                    </div>

                    <div className="mb-3 form-password-toggle">
                      <div className="d-flex justify-content-between">
                        <label className="form-label" htmlFor="password">
                          {t('auth.password')}
                        </label>
                        <Link to="/auth/forgot-password">
                          <small>{t('auth.forgotPassword')}</small>
                        </Link>
                      </div>
                      <div className="input-group input-group-merge">
                        <Field
                          type="password"
                          name="password"
                          className={`form-control ${
                            touched.password && errors.password
                              ? 'is-invalid'
                              : ''
                          }`}
                          placeholder={t('auth.password')}
                        />
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <Field
                          type="checkbox"
                          name="rememberMe"
                          className="form-check-input"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="rememberMe"
                        >
                          {t('auth.rememberMe')}
                        </label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <button
                        className="btn btn-primary d-grid w-100"
                        type="submit"
                        disabled={isLoading || isSubmitting}
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          t('auth.signIn')
                        )}
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>

            <div className="text-center">
              <small className="text-muted">
                Need help? Contact your administrator or teacher.
              </small>
            </div>

            {/* Demo credentials */}
            <div className="mt-4">
              <div className="alert alert-info">
                <h6>Demo Credentials:</h6>
                <small>
                  <strong>Super Admin:</strong> admin@university.edu / admin123
                  <br />
                  <strong>Teacher:</strong> john.smith@university.edu /
                  teacher123
                  <br />
                  <strong>Student:</strong> alice.johnson@student.university.edu
                  / student123
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
