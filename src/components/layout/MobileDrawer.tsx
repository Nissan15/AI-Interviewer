import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from '../navigation/Sidebar';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close-btn" onClick={onClose} aria-label="Close navigation">
          <X size={20} />
        </button>
        <Sidebar onNavClick={onClose} />
      </div>
    </div>
  );
};
