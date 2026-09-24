import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Bot, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthBrandingPanel } from '../../components/auth/AuthBrandingPanel';
import './ResetPassword.css';

export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    if (!password) {
      setPasswordError('Please enter a new password.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.');
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

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setGeneralError(error);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch {
      setGeneralError('Failed to update password. The reset link may have expired.');
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
                <Lock size={26} className="auth-badge-icon" />
              </div>
              <h2 className="auth-card-title">Reset Password</h2>
              <p className="auth-card-subtitle">
                Enter and confirm your new account password below.
              </p>
            </div>

            {success ? (
              <div className="auth-state-box">
                <div className="state-icon-circle success">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="state-title">Password Updated</h3>
                <p className="state-desc">
                  Your password has been changed successfully. Redirecting you to the sign in page...
                </p>
              </div>
            ) : (
              <>
                {generalError && (
                  <div className="auth-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                  {/* New Password */}
                  <div className="form-group">
                    <label htmlFor="reset-new-password" className="form-label">
                      New Password
                    </label>
                    <div className={`input-field-wrapper ${passwordError ? 'has-error' : ''}`}>
                      <Lock size={18} className="input-prefix-icon" aria-hidden="true" />
                      <input
                        id="reset-new-password"
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
                    <label htmlFor="reset-confirm-password" className="form-label">
                      Confirm New Password
                    </label>
                    <div className={`input-field-wrapper ${confirmPasswordError ? 'has-error' : ''}`}>
                      <Lock size={18} className="input-prefix-icon" aria-hidden="true" />
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        placeholder="Re-enter your new password"
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
                    {confirmPasswordError && (
                      <span className="field-error-text">{confirmPasswordError}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="reset-submit-btn"
                    className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="submit-btn-content">
                        <span className="btn-spinner" aria-hidden="true" />
                        <span>Updating Password...</span>
                      </span>
                    ) : (
                      <span className="submit-btn-content">
                        <span>Update Password</span>
                        <ArrowRight size={18} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
