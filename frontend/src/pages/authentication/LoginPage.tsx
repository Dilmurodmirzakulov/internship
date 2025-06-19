import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import './page-auth.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const { login, isLoading, error, isAuthenticated, clearError } =
    useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
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
                    Internship Tracker
                  </span>
                </a>
              </div>

              <h4 className="mb-2">Welcome! 👋</h4>
              <p className="mb-4">
                Please sign-in to your account and start tracking your
                internship
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <div className="alert-body">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mb-3">
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3 form-password-toggle">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" htmlFor="password">
                      Password
                    </label>
                    <Link to="/auth/forgot-password">
                      <small>Forgot Password?</small>
                    </Link>
                  </div>
                  <div className="input-group input-group-merge">
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember Me
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    className="btn btn-primary d-grid w-100"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Sign in'}
                  </button>
                </div>
              </form>

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
                    <strong>Super Admin:</strong> admin@university.edu /
                    admin123
                    <br />
                    <strong>Teacher:</strong> john.smith@university.edu /
                    teacher123
                    <br />
                    <strong>Student:</strong>{' '}
                    alice.johnson@student.university.edu / student123
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
