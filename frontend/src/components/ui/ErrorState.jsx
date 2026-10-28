import React from 'react';
import Button from './Button';

/**
 * Standardized ErrorState component for CaseSync.
 * Displays honest, actionable error states when API calls fail,
 * avoiding silent mock fallbacks.
 */

export function ErrorState({
  title = 'Service Unavailable',
  message = 'An unexpected error occurred while communicating with the CaseSync secure ledger. Please check your connection and retry.',
  onRetry,
  compact = false,
  className = '',
}) {
  if (compact) {
    return (
      <div
        role="alert"
        className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5" aria-hidden="true">
            error
          </span>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-rose-950">{title}</h4>
            <p className="text-xs text-rose-850 leading-relaxed">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`p-8 sm:p-12 rounded-2xl bg-white border border-rose-200 text-center space-y-4 max-w-lg mx-auto shadow-subtle ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
        <span className="material-symbols-outlined text-2xl leading-none" aria-hidden="true">
          cloud_off
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<span className="material-symbols-outlined text-sm leading-none">refresh</span>}
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
