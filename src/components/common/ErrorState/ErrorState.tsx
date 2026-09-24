import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../Button/Button';
import './ErrorState.css';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  action?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  retryText = 'Try Again',
  action,
  className = '',
}) => {
  return (
    <div className={`app-error-state ${className}`} role="alert">
      <div className="error-icon-box">
        <AlertCircle size={24} />
      </div>
      <div className="error-content">
        <h4 className="error-title">{title}</h4>
        <p className="error-message">{message}</p>
      </div>
      {(onRetry || action) && (
        <div className="error-actions">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={onRetry}
            >
              {retryText}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
};
