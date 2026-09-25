import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      className = '',
      wrapperClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`app-input-wrapper ${disabled ? 'disabled' : ''} ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="app-input-label">
            {label}
          </label>
        )}
        <div className={`app-input-inner ${error ? 'has-error' : ''}`}>
          {leftIcon && <span className="input-left-icon">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`app-input-element ${className}`}
            {...props}
          />
          {rightIcon && <span className="input-right-icon">{rightIcon}</span>}
        </div>
        {error && <span className="app-input-error">{error}</span>}
        {!error && hint && <span className="app-input-hint">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
