import React from 'react';
import { ShieldCheck, Lock, History, UserCheck, Database, Eye } from 'lucide-react';
import transparencyImage from '../../assets/images/transparency_records.jpg';

export function TransparencySection() {
  const pillars = [
    {
      icon: <History className="w-5 h-5 text-saffron" />,
      title: 'Tamper-Evident Audit Logging',
      description:
        'Every status transition, evidence movement, and administrative touchpoint writes an immutable entry capturing actor ID, timestamp, before/after states, and client IP.',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-saffron" />,
      title: 'Role-Based Access Boundaries',
      description:
        'Citizens view their own cases; Desk Staff handle intake; Investigating Officers record case diaries; Station House Officers grant formal approvals.',
    },
    {
      icon: <Lock className="w-5 h-5 text-saffron" />,
      title: 'Chain-of-Custody Integrity',
      description:
        'Physical and digital exhibits are indexed with cryptographic hashes. Physical handoffs between malkhana, forensic labs, and magistrate courts are verified step-by-step.',
    },
    {
      icon: <Database className="w-5 h-5 text-saffron" />,
      title: 'ACID State Machine Enforcement',
      description:
        'Case status progressions are strictly validated at the database layer. Illegal status leaps or unauthorized reversions are rejected automatically.',
    },
  ];

  return (
    <section id="transparency" className="py-20 lg:py-28 bg-navy text-ivory relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Editorial Text & 4 Pillars (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-light border border-saffron/30 text-saffron mb-4 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Institutional Accountability
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Built on Verified Records, Not Unchecked Authority.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                True civic trust requires absolute transparency. CaseSync enforces data integrity and public visibility by design, eliminating lost files and untraceable modifications.
              </p>
            </div>

            {/* 4 Architectural Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="bg-navy-light/60 border border-white/10 rounded-xl p-5 hover:bg-navy-light transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center mb-3 border border-white/10">
                    {pillar.icon}
                  </div>
                  <h3 className="font-display text-base font-bold text-white mb-1.5">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            {/* PO7 Ethics Note */}
            <div className="p-4 rounded-xl bg-navy-deep border border-white/10 flex items-start gap-3 text-xs text-slate-300">
              <Eye className="w-4 h-4 text-saffron mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <strong className="text-white">PO7 Ethics & Data Minimization:</strong> In compliance with responsible civic-tech standards, citizen identity numbers are never stored in full (only the last 4 digits are recorded), and sensitive juvenile or protected victim records remain strictly compartmentalized.
              </p>
            </div>
          </div>

          {/* Right Visual: Contextual Photography (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Curated Photograph */}
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-elevated bg-navy-light">
                <img
                  src={transparencyImage}
                  alt="Official case files and verified digital tracking tablet in an Indian public administration office"
                  className="w-full h-[380px] sm:h-[460px] object-cover object-center filter saturate-[0.95]"
                  width="600"
                  height="460"
                />
              </div>

              {/* Verified Audit Stamp Overlay */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-white text-navy p-4 rounded-xl shadow-modal border border-borderSoft max-w-[260px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-civicGreen animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-navy">
                    Audit Verification Pass
                  </span>
                </div>
                <p className="text-[11px] text-slate leading-snug">
                  1,480 audit log entries validated. Cryptographic hash chain verified untampered.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default TransparencySection;
