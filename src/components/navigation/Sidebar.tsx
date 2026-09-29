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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '/technical': location.pathname.startsWith('/technical'),
  });

  const toggleGroup = (path: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

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
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Preparation Modules</div>
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            const isChildActive = location.pathname.startsWith(item.path);
            const isExpanded = Boolean(expandedGroups[item.path]);

            return (
              <div key={item.path} className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-parent-btn ${isChildActive ? 'parent-active' : ''}`}
                  onClick={() => toggleGroup(item.path)}
                >
                  <span className="nav-icon">{renderIcon(item.iconName)}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-arrow">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="nav-sub-list">
                    {item.children.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end={subItem.path === item.path}
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
        </div>
      </div>
    </aside>
  );
};
