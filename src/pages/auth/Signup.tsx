import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Bot, ArrowRight, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthBrandingPanel } from '../../components/auth/AuthBrandingPanel';
import './Signup.css';

export const Signup: React.FC = () => {
  const { signup, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    if (!fullName.trim()) {
      setNameError('Please enter your full name.');
      valid = false;
    }

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
      setPasswordError('Please enter a password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const result = await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (result.error) {
        setGeneralError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.needsEmailVerification) {
        setSuccessMessage(
          'Account created successfully! Supabase sent a verification link to your email. Please verify your email before signing in, or disable "Confirm email" in Supabase Auth settings to sign in immediately.'
        );
        setIsLoading(false);
      } else {
        // Direct session available -> proceed to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      console.error('[Signup Error]', err);
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setGeneralError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Branding Panel */}
      <div className="auth-branding-col">
        <AuthBrandingPanel />
      </div>

      {/* Right Form Column */}
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
            <div className="auth-card-header">
              <div className="auth-logo-badge">
                <Bot size={26} className="auth-badge-icon" />
              </div>
              <h2 className="auth-card-title">Create an Account</h2>
              <p className="auth-card-subtitle">
                Join to practice technical, aptitude, and AI HR interviews.
              </p>
            </div>

            {/* Supabase Configuration Warning */}
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

            {/* Success Message Banner */}
            {successMessage && (
              <div className="auth-success-banner" role="status">
                <CheckCircle2 size={18} className="success-icon" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {generalError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} className="error-icon" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="signup-name" className="form-label">
                  Full Name
                </label>
                <div className={`input-field-wrapper ${nameError ? 'has-error' : ''}`}>
                  <UserIcon size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="Enter your full name"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    disabled={isLoading}
                  />
                </div>
                {nameError && <span className="field-error-text">{nameError}</span>}
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="signup-email" className="form-label">
                  Email Address
                </label>
                <div className={`input-field-wrapper ${emailError ? 'has-error' : ''}`}>
                  <Mail size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="signup-email"
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

              {/* Password */}
              <div className="form-group">
                <label htmlFor="signup-password" className="form-label">
                  Password
                </label>
                <div className={`input-field-wrapper ${passwordError ? 'has-error' : ''}`}>
                  <Lock size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="At least 6 characters"
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
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <span className="field-error-text">{passwordError}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="signup-confirm-password" className="form-label">
                  Confirm Password
                </label>
                <div className={`input-field-wrapper ${confirmPasswordError ? 'has-error' : ''}`}>
                  <Lock size={18} className="input-prefix-icon" aria-hidden="true" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    placeholder="Confirm your password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <span className="field-error-text">{confirmPasswordError}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="signup-submit-btn"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="submit-btn-content">
                    <span className="btn-spinner" aria-hidden="true" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <span className="submit-btn-content">
                    <span>Create Account</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-card-footer">
              <span className="footer-prompt">Already have an account?</span>{' '}
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
