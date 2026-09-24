import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  BrainCircuit,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  Sparkles,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { NAV_ITEMS, NavItemConfig } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

interface SidebarProps {
  onNavClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [technicalExpanded, setTechnicalExpanded] = useState<boolean>(
    location.pathname.startsWith('/technical')
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    if (onNavClick) onNavClick();
  };

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Candidate';

  const renderIcon = (name: NavItemConfig['iconName']) => {
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard size={18} />;
      case 'Code2':
        return <Code2 size={18} />;
      case 'BrainCircuit':
        return <BrainCircuit size={18} />;
      case 'Users':
        return <Users size={18} />;
      case 'Settings':
        return <Settings size={18} />;
      default:
        return null;
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Bot size={22} className="brand-icon-svg" />
        </div>
        <div className="brand-text">
          <span className="brand-title">AI Mock</span>
          <span className="brand-subtitle">Interviewer</span>
        </div>
        <span className="brand-badge">SaaS</span>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Preparation Modules</div>
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            const isChildActive = location.pathname.startsWith(item.path);

            return (
              <div key={item.path} className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-parent-btn ${isChildActive ? 'parent-active' : ''}`}
                  onClick={() => setTechnicalExpanded(!technicalExpanded)}
                >
                  <span className="nav-icon">{renderIcon(item.iconName)}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-arrow">
                    {technicalExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>

                {technicalExpanded && (
                  <div className="nav-sub-list">
                    <NavLink
                      to="/technical"
                      end
                      className={({ isActive }) => `nav-sub-item ${isActive ? 'sub-active' : ''}`}
                      onClick={onNavClick}
                    >
                      <span className="sub-dot" />
                      Overview
                    </NavLink>
                    {item.children.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) => `nav-sub-item ${isActive ? 'sub-active' : ''}`}
                        onClick={onNavClick}
                      >
                        <span className="sub-dot" />
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onNavClick}
            >
              <span className="nav-icon">{renderIcon(item.iconName)}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className="nav-pill-badge">
                  <Sparkles size={10} />
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Candidate Profile & Sign Out Footer */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user-card">
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                <UserIcon size={16} />
              </div>
              <div className="sidebar-user-text">
                <span className="sidebar-user-name" title={displayName}>
                  {displayName}
                </span>
                <span className="sidebar-user-email" title={user.email || ''}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        <div className="system-status-indicator">
          <span className="status-dot-pulse" />
          <div className="status-text-group">
            <span className="status-label">System Architecture</span>
            <span className="status-sub">Zero Sample Data Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
