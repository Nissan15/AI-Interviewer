import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Desktop Persistent Sidebar */}
      <div className="desktop-sidebar-container">
        <Sidebar />
      </div>

      {/* Mobile Responsive Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main-viewport">
        <Header onToggleMobileMenu={() => setMobileDrawerOpen(true)} />
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
