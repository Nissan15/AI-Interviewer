import React from 'react';
import './MetricCard.css';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  return (
    <div className={`metric-card variant-${variant} ${className}`}>
      <div className="metric-header-row">
        <span className="metric-title">{title}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {trend && (
          <span className={`metric-trend ${trend.positive ? 'trend-positive' : 'trend-negative'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <span className="metric-subtitle">{subtitle}</span>}
    </div>
  );
};
