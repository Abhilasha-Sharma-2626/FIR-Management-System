import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * Standardized EmptyState component for CaseSync.
 * Renders an honest, dignified civic empty state when an authenticated account
 * or filtered query has zero records.
 */

export function EmptyState({
  icon = 'folder_off',
  title = 'No records found',
  description = 'There are currently no records matching this view.',
  action,
  secondaryAction,
  className = '',
}) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`p-10 sm:p-14 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4 max-w-xl mx-auto shadow-subtle ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-ivory-warm border border-ivory-border flex items-center justify-center text-slate-muted mx-auto shadow-2xs">
        {typeof icon === 'string' ? (
          <span className="material-symbols-outlined text-3xl leading-none text-slate" aria-hidden="true">
            {icon}
          </span>
        ) : (
          icon
        )}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-muted leading-relaxed">
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Link
                to={action.href}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                {action.icon && (
                  <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                <span>{action.label}</span>
              </Link>
            ) : action.onClick ? (
              <Button
                variant="primary"
                size="sm"
                onClick={action.onClick}
                leftIcon={action.icon ? <span className="material-symbols-outlined text-sm leading-none">{action.icon}</span> : undefined}
              >
                {action.label}
              </Button>
            ) : (
              action
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                to={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-borderSoft hover:bg-ivory text-ink text-xs font-semibold shadow-subtle transition-colors"
              >
                {secondaryAction.icon && (
                  <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">
                    {secondaryAction.icon}
                  </span>
                )}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : secondaryAction.onClick ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={secondaryAction.onClick}
                leftIcon={secondaryAction.icon ? <span className="material-symbols-outlined text-sm leading-none">{secondaryAction.icon}</span> : undefined}
              >
                {secondaryAction.label}
              </Button>
            ) : (
              secondaryAction
            )
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
