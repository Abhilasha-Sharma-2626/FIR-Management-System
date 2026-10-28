import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    className = '',
    required = false,
    leftIcon,
    rightIcon,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex justify-between items-center text-xs font-semibold text-ink">
          <label htmlFor={inputId}>
            {label}
            {required && <span className="text-civicRed ml-1">*</span>}
          </label>
        </div>
      )}

      <div className="relative rounded-lg shadow-subtle">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          required={required}
          className={`
            w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-slate-soft disabled:text-slate-muted disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${
              error
                ? 'border-civicRed focus:border-civicRed focus:ring-civicRed/30'
                : 'border-borderSoft focus:border-navy focus:ring-navy/20 hover:border-slate-muted/50'
            }
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <div id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs text-civicRed pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-xs text-slate-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
