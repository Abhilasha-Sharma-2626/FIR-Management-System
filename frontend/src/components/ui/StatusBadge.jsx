import React from 'react';

/**
 * Standardized StatusBadge component for CaseSync.
 * Supports all 13 BNSS 2023 complaint / FIR lifecycle states and P1/P2/P3 priorities.
 * Adheres strictly to CaseSync brand tokens and accessibility standards.
 */

const STATUS_CONFIGS = {
  DRAFT: {
    label: 'Draft Saved',
    classes: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-400',
    icon: 'edit_note'
  },
  SUBMITTED: {
    label: 'Intake Submitted',
    classes: 'bg-sky-50 text-sky-900 border-sky-300',
    dot: 'bg-sky-500 animate-pulse motion-reduce:animate-none',
    icon: 'inbox'
  },
  UNDER_REVIEW: {
    label: 'Legal Review in Progress',
    classes: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    dot: 'bg-indigo-500 animate-pulse motion-reduce:animate-none',
    icon: 'gavel'
  },
  INFO_REQUESTED: {
    label: 'Clarification Required',
    classes: 'bg-amber-100 text-amber-950 border-amber-400 font-semibold',
    dot: 'bg-amber-600 animate-ping motion-reduce:animate-none',
    icon: 'help_outline'
  },
  REGISTERED: {
    label: 'FIR Registered',
    classes: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold',
    dot: 'bg-emerald-600',
    icon: 'verified'
  },
  ASSIGNED: {
    label: 'IO Assigned',
    classes: 'bg-blue-50 text-blue-900 border-blue-300',
    dot: 'bg-blue-600',
    icon: 'badge'
  },
  UNDER_INVESTIGATION: {
    label: 'Under Active Investigation',
    classes: 'bg-teal-50 text-teal-900 border-teal-300 font-semibold',
    dot: 'bg-teal-500 animate-pulse motion-reduce:animate-none',
    icon: 'manage_search'
  },
  PENDING_APPROVAL: {
    label: 'Report Pending SHO Review',
    classes: 'bg-purple-50 text-purple-900 border-purple-300',
    dot: 'bg-purple-600',
    icon: 'hourglass_top'
  },
  CHARGESHEET_FILED: {
    label: 'Chargesheet Filed in Court',
    classes: 'bg-blue-100 text-blue-950 border-blue-400 font-bold',
    dot: 'bg-blue-700',
    icon: 'balance'
  },
  CLOSURE_FILED: {
    label: 'Closure Report Filed',
    classes: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    dot: 'bg-zinc-500',
    icon: 'folder_zip'
  },
  QUASHED: {
    label: 'Judicially Quashed',
    classes: 'bg-rose-50 text-rose-900 border-rose-300',
    dot: 'bg-rose-600',
    icon: 'cancel'
  },
  REJECTED: {
    label: 'Triage Disposed / Non-Cognizable',
    classes: 'bg-rose-50 text-rose-900 border-rose-300',
    dot: 'bg-rose-500',
    icon: 'block'
  },
  CLOSED: {
    label: 'Concluded & Disposed',
    classes: 'bg-emerald-50 text-emerald-950 border-emerald-300',
    dot: 'bg-emerald-700',
    icon: 'task_alt'
  }
};

const PRIORITY_CONFIGS = {
  1: {
    label: 'P1 - High / Urgent',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500 animate-pulse motion-reduce:animate-none'
  },
  2: {
    label: 'P2 - Standard Priority',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  3: {
    label: 'P3 - Routine Inquiry',
    classes: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  }
};

export function StatusBadge({
  status,
  priority,
  size = 'md',
  showDot = true,
  showIcon = false,
  customLabel,
  className = ''
}) {
  // If priority is specified without status, render priority badge
  if (priority && !status) {
    const config = PRIORITY_CONFIGS[priority] || PRIORITY_CONFIGS[3];
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
    return (
      <span
        role="status"
        aria-label={`Priority: ${config.label}`}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${config.classes} ${className}`}
      >
        {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />}
        <span>{customLabel || config.label}</span>
      </span>
    );
  }

  const normalizedStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIGS[normalizedStatus] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-400',
    icon: 'info'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }[size] || 'px-2.5 py-1 text-xs';

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${sizeClasses} ${config.classes} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        </span>
      )}
      {showIcon && config.icon && (
        <span className="material-symbols-outlined text-[13px] leading-none shrink-0" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span className="truncate">{customLabel || config.label}</span>
    </span>
  );
}

export default StatusBadge;
