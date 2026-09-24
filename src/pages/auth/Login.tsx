import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Bot, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthBrandingPanel } from '../../components/auth/AuthBrandingPanel';
import './Login.css';

export const Login: React.FC = () => {
  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address.');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const { error } = await login({ email: email.trim(), password });
      if (error) {
        setGeneralError(error);
        setIsLoading(false);
        return;
      }

      // Successful login -> redirect to intended route or dashboard
      const state = location.state as { from?: { pathname?: string } } | undefined;
      const destination = state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      console.error('[Login Error]', err);
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setGeneralError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Branding Panel (Desktop & Tablet) */}
      <div className="auth-branding-col">
        <AuthBrandingPanel />
      </div>

      {/* Right Login Form Column */}
      <div className="auth-form-col">
        {/* Mobile Header */}
        <div className="auth-mobile-header">
          <div className="mobile-brand-icon">
            <Bot size={22} />
          </div>
          <span className="mobile-brand-name">AI Mock Interviewer</span>
        </div>

        <div className="auth-card-wrapper">
          <div className="auth-card">
            {/* Brand Logo / Icon */}
            <div className="auth-card-header">
              <div className="auth-logo-badge">
                <Bot size={26} className="auth-badge-icon" />
              </div>
              <h2 className="auth-card-title">Welcome Back</h2>
              <p className="auth-card-subtitle">
                Sign in to continue your interview preparation.
              </p>
            </div>

            {/* Supabase Configuration Warning (If keys not provided yet) */}
            {!isConfigured && (
              <div className="auth-notice-banner" role="alert">
                <Info size={18} className="notice-icon" />
                <div className="notice-content">
                  <span className="notice-title">Supabase Credentials Required</span>
                  <span className="notice-text">
                    Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to your <code>.env</code> file.
                  </span>
                </div>
              </div>
            )}

            {/* General Submission Error */}
            {generalError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} className="error-icon" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email Address
                </label>
                <div className={`input-field-wrapper ${emailError ? 'has-error' : ''}`}>
                  <Mail size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your email address"
                    className="form-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    disabled={isLoading}
                  />
                </div>
                {emailError && <span className="field-error-text">{emailError}</span>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <Link to="/forgot-password" className="forgot-password-link" tabIndex={0}>
                    Forgot password?
                  </Link>
                </div>
                <div className={`input-field-wrapper ${passwordError ? 'has-error' : ''}`}>
                  <Lock size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="form-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <span className="field-error-text">{passwordError}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="submit-btn-content">
                    <span className="btn-spinner" aria-hidden="true" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="submit-btn-content">
                    <span>Sign In</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </span>
                )}
              </button>
            </form>

            {/* Card Footer / Signup Navigation */}
            <div className="auth-card-footer">
              <span className="footer-prompt">Don't have an account?</span>{' '}
              <Link to="/signup" className="auth-switch-link">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
