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
    if (path === '/technical') return 'Technical Assessment Hub';
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
          <Menu size={18} />
        </button>
        <div className="header-title-container">
          <h1 className="header-page-title">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Voice & AI Pipeline status pill: Green dot for ready, cyan AI indicator */}
        <div className="tech-status-pill pill-ai-ready" title="Continuous Speech & Internal AI Inference Active">
          <span className="status-dot green-dot" />
          <Cpu size={13} className="pill-cyan-icon" />
          <span className="pill-text">Voice & AI Pipeline: Ready</span>
        </div>

        {/* Zero Sample Data Mode pill */}
        <div className="tech-status-pill pill-zero-data" title="Zero Hardcoded Mock Data Mode Active">
          <ShieldCheck size={13} className="pill-green-icon" />
          <span className="pill-text">Zero Sample Data Mode</span>
        </div>

        {/* User profile pill & Sign Out */}
        {user && (
          <div className="header-user-section">
            <div className="tech-status-pill pill-user" title={user.email || undefined}>
              <div className="user-avatar-mini">
                <UserIcon size={12} />
              </div>
              <span className="user-display-name">{displayName.toUpperCase()}</span>
            </div>
            <button
              type="button"
              className="header-signout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out of session"
            >
              <LogOut size={13} />
              <span className="signout-label">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
