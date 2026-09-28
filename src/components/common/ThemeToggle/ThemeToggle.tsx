import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
  variant = 'icon',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const titleText = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const labelText = isDark ? 'Dark Mode' : 'Light Mode';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        className={`theme-toggle-pill size-${size} ${isDark ? 'is-dark' : 'is-light'} ${className}`}
        onClick={toggleTheme}
        aria-label={titleText}
        title={titleText}
      >
        <span className="pill-thumb">
          {isDark ? <Moon size={14} className="theme-icon moon-icon" /> : <Sun size={14} className="theme-icon sun-icon" />}
        </span>
        <span className="theme-pill-label">{labelText}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn size-${size} ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggleTheme}
      aria-label={titleText}
      title={titleText}
    >
      <div className="theme-icon-container">
        <Sun size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="theme-icon sun-icon" />
        <Moon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="theme-icon moon-icon" />
      </div>
      {showLabel && <span className="theme-toggle-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
};
