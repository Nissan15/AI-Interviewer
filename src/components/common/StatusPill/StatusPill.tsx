import React from 'react';
import './StatusPill.css';

export interface StatusPillProps {
  label: string;
  variant?: 'cyan' | 'green' | 'yellow' | 'red' | 'neutral';
  icon?: React.ReactNode;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'cyan',
  icon,
  pulse = false,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`status-pill pill-${variant} size-${size} ${className}`}>
      {pulse && <span className={`status-pill-dot dot-${variant}`} />}
      {icon && <span className="status-pill-icon">{icon}</span>}
      <span className="status-pill-text">{label}</span>
    </div>
  );
};
