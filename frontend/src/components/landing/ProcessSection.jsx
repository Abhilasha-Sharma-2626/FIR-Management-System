import React from 'react';
import { FileEdit, ShieldCheck, Activity, BellRing, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CORE_CAPABILITIES = [
  {
    step: '01',
    icon: <FileEdit className="w-6 h-6 text-navy" />,
    title: 'Submit a Complaint',
    description:
      'Structured intake capturing critical incident parameters, witness information, and attachments without intimidating station paperwork.',
    highlight: 'Data-Minimized Intake',
  },
  {
    step: '02',
    icon: <ShieldCheck className="w-6 h-6 text-navy" />,
    title: 'Station Intake Review',
    description:
      'Duty desk verifies territorial jurisdiction and checks for cognizable offence elements according to Bharatiya Nyaya Sanhita provisions.',
    highlight: 'Zero Arbitrary Refusals',
  },
  {
    step: '03',
    icon: <Activity className="w-6 h-6 text-navy" />,
    title: 'Case Workflow Tracking',
    description:
      'Track investigative milestones, assigned officer details, and evidence exhibits through an immutable state-machine model.',
    highlight: 'ACID State Machine',
  },
  {
    step: '04',
    icon: <BellRing className="w-6 h-6 text-navy" />,
    title: 'Dispatches & Notifications',
    description:
      'Receive transparent status dispatches when key investigative milestones conclude, leading to charge sheet or formal closure.',
    highlight: 'Instant Status Transparency',
  },
];

export function ProcessSection() {
  return (
    <section id="capabilities" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark block mb-2">
              System Capabilities & Architecture
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Designed for Public Trust & Administrative Precision
            </h2>
          </div>
          <p className="text-slate text-sm sm:text-base max-w-md leading-relaxed">
            Every step is supported by database constraints, role-based boundaries, and a continuous audit trail to guarantee consistency.
          </p>
        </div>

        {/* 4-Column Architectural Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_CAPABILITIES.map((cap) => (
            <div
              key={cap.step}
              className="group relative bg-ivory/60 hover:bg-ivory border border-borderSoft rounded-2xl p-7 transition-all duration-300 hover:shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white border border-borderSoft shadow-subtle flex items-center justify-center group-hover:scale-105 transition-transform">
                    {cap.icon}
                  </div>
                  <span className="font-mono text-2xl font-bold text-slate-muted/40 group-hover:text-navy/60 transition-colors">
                    {cap.step}
                  </span>
                </div>

                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-saffron-dark bg-saffron/10 px-2 py-0.5 rounded mb-2">
                  {cap.highlight}
                </span>

                <h3 className="font-display text-lg font-bold text-navy mb-2.5">
                  {cap.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  {cap.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-borderSoft/60 flex items-center justify-between text-xs font-semibold text-navy group-hover:text-orangeAccent transition-colors">
                <span>Learn specification</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default ProcessSection;
