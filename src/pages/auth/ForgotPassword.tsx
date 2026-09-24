import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Bot, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthBrandingPanel } from '../../components/auth/AuthBrandingPanel';
import './ForgotPassword.css';

export const ForgotPassword: React.FC = () => {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    setEmailError(null);
    setGeneralError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setGeneralError(error);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch {
      setGeneralError('Failed to send password reset link. Please try again.');
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
                <Mail size={26} className="auth-badge-icon" />
              </div>
              <h2 className="auth-card-title">Forgot Password</h2>
              <p className="auth-card-subtitle">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            {/* Supabase Notice */}
            {!isConfigured && (
              <div className="auth-notice-banner" role="alert">
                <Info size={18} className="notice-icon" />
                <div className="notice-content">
                  <span className="notice-title">Supabase Credentials Required</span>
                  <span className="notice-text">
                    Add your Supabase keys to <code>.env</code> to send recovery emails.
                  </span>
                </div>
              </div>
            )}

            {/* Success State */}
            {isSuccess ? (
              <div className="auth-state-box">
                <div className="state-icon-circle success">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="state-title">Reset Link Sent</h3>
                <p className="state-desc">
                  If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password.
                </p>
                <Link to="/login" className="state-action-link">
                  <ArrowLeft size={16} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Error Banner */}
                {generalError && (
                  <div className="auth-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="forgot-email" className="form-label">
                      Email Address
                    </label>
                    <div className={`input-field-wrapper ${emailError ? 'has-error' : ''}`}>
                      <Mail size={18} className="input-prefix-icon" aria-hidden="true" />
                      <input
                        id="forgot-email"
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

                  <button
                    type="submit"
                    id="forgot-submit-btn"
                    className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="submit-btn-content">
                        <span className="btn-spinner" aria-hidden="true" />
                        <span>Sending Link...</span>
                      </span>
                    ) : (
                      <span className="submit-btn-content">
                        <span>Send Reset Link</span>
                        <ArrowRight size={18} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="auth-card-footer">
                  <Link to="/login" className="back-to-login-link">
                    <ArrowLeft size={16} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
