import React from 'react';
import { Menu, ShieldCheck, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Candidate Dashboard';
    if (path === '/technical') return 'Technical Test Hub';
    if (path === '/technical/quiz') return 'Technical Quiz Assessment';
    if (path === '/technical/coding') return 'Coding Assessment Sandbox';
    if (path === '/aptitude') return 'Aptitude & Reasoning Assessment';
    if (path === '/hr') return 'AI HR Live Interview';
    if (path.startsWith('/hr/interview')) return 'Live AI Interview Session';
    if (path.startsWith('/hr/report')) return 'Interview Assessment Report';
    if (path === '/settings') return 'Platform & Provider Settings';
    return 'AI Mock Interviewer';
  };

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Candidate';

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-container">
          <h1 className="header-page-title">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="engine-status-pill">
          <Cpu size={14} className="engine-icon" />
          <span className="engine-text">Voice & AI Pipeline: Ready</span>
        </div>
        <div className="data-policy-tag">
          <ShieldCheck size={14} />
          <span>Zero Sample Data Mode</span>
        </div>

        {/* Candidate User Pill & Logout Button */}
        {user && (
          <div className="header-user-section">
            <div className="header-user-badge" title={user.email || undefined}>
              <div className="user-avatar-mini">
                <UserIcon size={14} />
              </div>
              <span className="user-display-name">{displayName}</span>
            </div>
            <button
              type="button"
              className="header-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out of session"
            >
              <LogOut size={16} />
              <span className="logout-text">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
