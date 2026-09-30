import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FileCheck,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Plus,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button/Button';
import './AdminLayout.css';

interface AdminLayoutProps {
  onOpenAddQuestion?: () => void;
  onOpenBulkUpload?: () => void;
  onOpenCreateTest?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const { user, profile, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    {
      label: 'Overview',
      path: '/admin',
      end: true,
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: 'Question Bank',
      path: '/admin/questions',
      end: false,
      icon: <Layers size={16} />,
    },
    {
      label: 'Test Management',
      path: '/admin/tests',
      end: false,
      icon: <FileCheck size={16} />,
    },
  ];

  return (
    <div className="admin-portal-wrapper animate-fade-in">
      {/* Top Banner / Admin Sub-header */}
      <div className="admin-portal-header">
        <div className="admin-title-area">
          <div className="admin-badge-container">
            <span className="admin-pill-badge">
              <ShieldCheck size={14} />
              ADMIN CONTROL PANEL
            </span>
            <span className="admin-version-tag">Aptitude &amp; Technical System</span>
          </div>
          <h1 className="admin-main-title">Assessment Management Console</h1>
          <p className="admin-subtitle">
            Manage standardized question repositories, configure technical topics, and author
            published placement tests for candidates.
          </p>
        </div>

        <div className="admin-header-actions">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ExternalLink size={14} />}
            onClick={() => navigate('/dashboard')}
          >
            Candidate Portal
          </Button>

          {switchRole && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserCheck size={14} />}
              onClick={() => switchRole('student')}
              title="Test the student experience"
            >
              Switch to Student View
            </Button>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-nav-bar">
        <div className="admin-tabs-list">
          {navTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `admin-tab-item ${isActive ? 'admin-tab-active' : ''}`
              }
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Admin Content Canvas */}
      <div className="admin-content-canvas">
        <Outlet />
      </div>
    </div>
  );
};
