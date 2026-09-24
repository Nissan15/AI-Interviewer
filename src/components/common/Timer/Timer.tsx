import React from 'react';
import { Clock } from 'lucide-react';
import './Timer.css';

export interface TimerProps {
  seconds: number;
  label?: string;
  isUrgent?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  label = 'Time Remaining',
  isUrgent = false,
  className = '',
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLow = isUrgent || seconds < 120;

  return (
    <div className={`app-timer ${isLow ? 'timer-urgent' : ''} ${className}`}>
      <Clock size={16} className="timer-icon" />
      {label && <span className="timer-label">{label}:</span>}
      <span className="timer-digits">{formatTime(seconds)}</span>
    </div>
  );
};
