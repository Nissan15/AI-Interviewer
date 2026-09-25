import React from 'react';
import './SectionHeader.css';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  tag,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`section-header-block ${className}`}>
      <div className="section-header-content">
        {tag && <span className="section-header-tag">{tag}</span>}
        <div className="section-title-row">
          {icon && <span className="section-header-icon">{icon}</span>}
          <h2 className="section-header-title">{title}</h2>
        </div>
        {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="section-header-action">{action}</div>}
    </div>
  );
};
