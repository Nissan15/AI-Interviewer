import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './SidebarItem.css';

export interface SidebarItemProps {
  to?: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  isActive?: boolean;
  isParent?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  label,
  icon,
  badge,
  isActive,
  isParent = false,
  isExpanded = false,
  onClick,
  className = '',
  children,
}) => {
  if (isParent) {
    return (
      <div className={`sidebar-item-group ${className}`}>
        <button
          type="button"
          className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
          onClick={onClick}
        >
          {icon && <span className="sidebar-item-icon">{icon}</span>}
          <span className="sidebar-item-label">{label}</span>
          <span className="sidebar-item-arrow">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {isExpanded && children && <div className="sidebar-sub-menu">{children}</div>}
      </div>
    );
  }

  if (to) {
    return (
      <NavLink
        to={to}
        end={to === '/technical'}
        className={({ isActive: navActive }) =>
          `sidebar-nav-btn ${(isActive ?? navActive) ? 'active' : ''} ${className}`
        }
        onClick={onClick}
      >
        {icon && <span className="sidebar-item-icon">{icon}</span>}
        <span className="sidebar-item-label">{label}</span>
        {badge && <span className="sidebar-item-badge">{badge}</span>}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={`sidebar-nav-btn ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="sidebar-item-icon">{icon}</span>}
      <span className="sidebar-item-label">{label}</span>
      {badge && <span className="sidebar-item-badge">{badge}</span>}
    </button>
  );
};
