import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      children,
      id,
      className = '',
      wrapperClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`app-select-wrapper ${disabled ? 'disabled' : ''} ${wrapperClassName}`}>
        {label && (
          <label htmlFor={selectId} className="app-select-label">
            {label}
          </label>
        )}
        <div className={`app-select-inner ${error ? 'has-error' : ''}`}>
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`app-select-element ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className="select-arrow-icon" aria-hidden="true">
            <ChevronDown size={14} />
          </span>
        </div>
        {error && <span className="app-select-error">{error}</span>}
        {!error && hint && <span className="app-select-hint">{hint}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
