import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function AuthLayout({
  children,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  quoteText,
  tagText = 'Official Civic Portal',
}) {
  return (
    <div className="h-screen max-h-screen w-full bg-ivory flex flex-col justify-between p-3 sm:p-4 lg:p-5 overflow-y-auto lg:overflow-hidden antialiased">
      {/* Top Compact Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between shrink-0 pb-2">
        <Link
          to="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-lg"
          aria-label="Return to CaseSync Home"
        >
          <div className="w-7 h-7 rounded-lg bg-navy flex items-center justify-center text-saffron shadow-subtle group-hover:scale-105 transition-transform">
            <Shield className="w-3.5 h-3.5 fill-saffron/20 stroke-saffron" />
          </div>
          <span className="font-display font-bold text-base text-navy tracking-tight">
            CaseSync
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-navy transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded px-2 py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>

      {/* Main Split-Screen Container — Strictly Fits Desktop Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto min-h-0 bg-white rounded-2xl border border-borderSoft shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Form Column */}
        <div className="lg:col-span-6 p-5 sm:p-8 lg:p-8 xl:p-10 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-saffron-dark bg-saffron/10 px-2 py-0.5 rounded mb-2">
                {tagText}
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-slate leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Injected Form Component */}
            {children}
          </div>
        </div>

        {/* Visual Column on Desktop */}
        <div className="hidden lg:block lg:col-span-6 relative bg-navy h-full overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-cover object-center filter saturate-[0.92] contrast-[1.04]"
            width="600"
            height="700"
          />
          {/* Subtle Contrast Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent pointer-events-none" />

          {/* Restrained Caption Pill */}
          <div className="absolute bottom-6 left-6 right-6 text-white p-4 rounded-xl bg-navy/80 backdrop-blur-md border border-white/10 shadow-elevated">
            <div className="flex items-center gap-1.5 mb-1.5 text-saffron text-[11px] font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Public Service Accountability</span>
            </div>
            <blockquote className="font-display text-xs sm:text-sm font-medium text-slate-100 leading-snug">
              "{quoteText}"
            </blockquote>
          </div>
        </div>

      </main>

      {/* Bottom Compact Trust Note */}
      <footer className="w-full max-w-7xl mx-auto shrink-0 pt-2 text-center text-[11px] text-slate-muted">
        <p>
          Academic Demonstration Prototype &bull; Protected under PO7 Data Minimization &amp; Role-Based Security
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;
