import React from 'react';
import { Menu, ShieldCheck, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle/ThemeToggle';
import './Header.css';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Candidate Dashboard';
    if (path === '/technical' || path === '/technical/quiz') return 'Technical Quiz Assessment';
    if (path === '/aptitude') return 'Aptitude & Reasoning Assessment';
    if (path === '/hr') return 'AI HR Live Interview';
    if (path.startsWith('/hr/history')) return 'Interview Report History';
    if (path.startsWith('/hr/interview')) return 'Live AI Interview Session';
    if (path.startsWith('/hr/report')) return 'Interview Assessment Report';
    if (path === '/settings') return 'Platform & Provider Settings';
    if (path === '/admin') return 'Admin Overview - Assessment Management';
    if (path.startsWith('/admin/questions')) return 'Admin Question Bank Management';
    if (path.startsWith('/admin/tests')) return 'Admin Test Authoring & Management';
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
        </div>
        
        {/* Light / Dark Mode Toggle Button */}
        <ThemeToggle size="md" />

        {isAdmin && (
          <button
            type="button"
            className="tech-status-pill pill-admin-link"
            onClick={() => navigate(location.pathname.startsWith('/admin') ? '/dashboard' : '/admin')}
            title="Switch between Admin Panel and Candidate Dashboard"
            style={{
              cursor: 'pointer',
              background: 'rgba(36, 222, 251, 0.12)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            <span>{location.pathname.startsWith('/admin') ? 'Candidate Portal' : 'Admin Panel'}</span>
          </button>
        )}

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
