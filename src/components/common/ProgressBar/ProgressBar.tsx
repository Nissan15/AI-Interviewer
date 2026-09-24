import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = false,
  color = 'primary',
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-container size-${size} ${className}`}>
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && <span className="progress-percentage">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`progress-fill progress-color-${color}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
