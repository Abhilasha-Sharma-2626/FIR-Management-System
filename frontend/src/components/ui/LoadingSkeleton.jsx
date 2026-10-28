import React from 'react';

/**
 * Standardized LoadingSkeleton component for CaseSync.
 * Uses restrained pulse animation with motion-reduce safety.
 */

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-slate-200/80 animate-pulse motion-reduce:animate-none rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function MetricCardSkeleton({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      ))}
    </div>
  );
}

export function DocketCardSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton({ steps = 4, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            {i < steps - 1 && <div className="w-0.5 h-12 bg-slate-200 my-1" />}
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ lines = 4, className = '' }) {
  return (
    <div className={`space-y-3 p-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

LoadingSkeleton.Skeleton = Skeleton;
LoadingSkeleton.MetricCardSkeleton = MetricCardSkeleton;
LoadingSkeleton.DocketCardSkeleton = DocketCardSkeleton;
LoadingSkeleton.TimelineSkeleton = TimelineSkeleton;

