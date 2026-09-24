import React from 'react';
import './LoadingState.css';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
  size = 'md',
  fullPage = false,
  className = '',
}) => {
  return (
    <div className={`app-loading-state size-${size} ${fullPage ? 'full-page' : ''} ${className}`}>
      <div className="loading-spinner-rings">
        <div className="ring ring-outer" />
        <div className="ring ring-middle" />
        <div className="ring ring-inner" />
      </div>
      {message && <div className="loading-message">{message}</div>}
      {subMessage && <div className="loading-submessage">{subMessage}</div>}
    </div>
  );
};
