import React from 'react';

/**
 * Standardized MetricCard component for CaseSync.
 * Used across Citizen, Desk Officer, SHO, IO, Supervisor, Admin, and Auditor dashboards.
 * Supports active filter state, interactive hover lift, and accessible aria attributes.
 */

const VARIANT_CONFIGS = {
  navy: {
    iconBg: 'bg-navy/5 text-navy border-navy/20',
    activeRing: 'ring-2 ring-navy border-navy bg-navy/5',
    accentText: 'text-navy',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    activeRing: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
    accentText: 'text-amber-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeRing: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40',
    accentText: 'text-emerald-700',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    activeRing: 'ring-2 ring-slate-500 border-slate-500 bg-slate-50',
    accentText: 'text-slate-700',
  },
  saffron: {
    iconBg: 'bg-saffron/15 text-saffron-dark border-saffron/30',
    activeRing: 'ring-2 ring-saffron border-saffron-dark bg-saffron/10',
    accentText: 'text-saffron-dark',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
    activeRing: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40',
    accentText: 'text-rose-700',
  },
};

export function MetricCard({
  title,
  label,
  value,
  icon,
  variant = 'navy',
  badge,
  description,
  onClick,
  isActive = false,
  loading = false,
  className = '',
}) {
  const cardTitle = title || label;
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.navy;
  const isClickable = typeof onClick === 'function';

  if (loading) {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 bg-slate-200 rounded w-24"></div>
          <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-32"></div>
      </div>
    );
  }

  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={`
        relative text-left p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 
        shadow-subtle transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy' : ''}
        ${isActive ? config.activeRing : 'border-slate-200'}
        ${className}
      `}
      aria-pressed={isClickable ? isActive : undefined}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold text-slate-600 truncate max-w-[calc(100%-2.5rem)]">{cardTitle}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${config.iconBg}`}>
            {typeof icon === 'string' ? (
              <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
          {value ?? 0}
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
          {description}
        </p>
      )}
    </Component>
  );
}

export default MetricCard;
