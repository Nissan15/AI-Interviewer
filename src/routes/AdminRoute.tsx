import React from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button/Button';
import './AdminRoute.css';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, role, isAdmin, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-forbidden-container">
        <div className="admin-forbidden-card">
          <div className="forbidden-icon-badge">
            <ShieldAlert size={36} className="forbidden-icon" />
          </div>
          <h2 className="forbidden-title">Administrator Access Required</h2>
          <p className="forbidden-description">
            The question management and test administration portal is restricted to authorized
            administrators. Your account is currently operating with the{' '}
            <strong className="role-highlight">{role || 'student'}</strong> role.
          </p>

          <div className="forbidden-actions">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/dashboard')}
            >
              Return to Candidate Dashboard
            </Button>

            {switchRole && (
              <Button
                variant="primary"
                leftIcon={<KeyRound size={16} />}
                onClick={() => switchRole('admin')}
              >
                Switch to Admin Role (Demo Mode)
              </Button>
            )}
          </div>

          <div className="forbidden-footnote">
            <Sparkles size={14} className="footnote-icon" />
            <span>
              Role-based access control is actively enforced at both the application router and Supabase RLS level.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
