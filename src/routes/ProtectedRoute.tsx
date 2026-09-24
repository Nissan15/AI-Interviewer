import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p className="auth-loading-text">Verifying candidate session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path in router state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Route wrapper for public auth pages (login, signup, forgot password).
 * Redirects authenticated candidates back to dashboard or their intended destination.
 */
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p className="auth-loading-text">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
