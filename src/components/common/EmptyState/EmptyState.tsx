import React from 'react';
import { Button } from '../Button/Button';
import './EmptyState.css';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  badge?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  badge,
  className = '',
}) => {
  return (
    <div className={`app-empty-state ${className}`}>
      <div className="empty-state-icon-wrapper">
        <div className="empty-state-icon-glow" />
        <div className="empty-state-icon">{icon}</div>
      </div>
      {badge && <span className="empty-state-badge">{badge}</span>}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {(actionText || secondaryActionText) && (
        <div className="empty-state-actions">
          {actionText && onAction && (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
