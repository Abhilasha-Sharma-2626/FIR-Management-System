import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authApi } from '../lib/api';
import heroOfficerImg from '../assets/images/stitch_hero_officer.jpg';

export function HomePage() {
  const navigate = useNavigate();
  const [trackingInput, setTrackingInput] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  useEffect(() => {
    authApi.checkBackendHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    navigate(`/live-tracking?id=${encodeURIComponent(trackingInput.trim())}`);
  };

  const workflowSteps = [
    {
      num: '01',
      title: 'Online Complaint Lodgment',
      badge: 'Section 154 BNSS',
      desc: 'Submit incident particulars, timestamps, location coordinates, and digital evidentiary exhibits online with zero paperwork.',
      icon: 'edit_note'
    },
    {
      num: '02',
      title: 'Desk Officer Preliminary Triage',
      badge: '24-Hour SLA',
      desc: 'Station desk personnel examine cognizable criteria, verify duplicate records, tag penal sections, or request clarification.',
      icon: 'fact_check'
    },
    {
      num: '03',
      title: 'SHO FIR Approval & Locking',
      badge: 'Atomic Sequence',
      desc: 'Station House Officer approves registration. Unique FIR number is generated with database-level sequence locks.',
      icon: 'local_police'
    },
    {
      num: '04',
      title: 'Investigation & Case Diaries',
      badge: 'Evidence Vault',
      desc: 'Assigned IO logs field diary entries, profiles accused/witnesses, and submits exhibits with SHA-256 custody tracking.',
      icon: 'manage_search'
    },
    {
      num: '05',
      title: 'Judicial Closure & Transparency',
      badge: 'Magistrate Filing',
      desc: 'Final chargesheet or closure report filed before court. Complainant receives full chronological timeline and feedback rights.',
      icon: 'gavel'
    }
  ];

  const pillarCards = [
    {
      icon: 'lock_clock',
      title: 'Cryptographic SHA-256 Ledger',
      desc: 'Every state transition, diary entry, and custody handoff is cryptographically forward-chained. Mathematical immutability prevents unauthorized record alteration.'
    },
    {
      icon: 'shield_person',
      title: 'PII Protection & Data Privacy',
      desc: 'National IDs and contact coordinates are masked at the service boundary. Public tracking endpoints omit victim contact details under DPDP Act 2023.'
    },
    {
      icon: 'sync_alt',
      title: 'Zero FIR & Inter-Station Transfer',
      desc: 'Complaints filed outside territorial jurisdiction are immediately assigned a Zero FIR reference and transferred seamlessly to the concerned station.'
    },
    {
      icon: 'balance',
      title: 'Statutory Rejection Appeals',
      desc: 'If a complaint is rejected at desk review, citizens have an immediate statutory right to appeal directly to the Station House Officer and District ACP.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed">
      <Navbar />

      <main className="flex-1 space-y-16 py-8">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-5"
            >
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary text-xs font-semibold font-mono tracking-wider border border-outline-variant/60">
                <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                <span>{backendStatus === 'online' ? 'POSTGRESQL & AUDIT ENGINE ONLINE' : 'GOV RECORD SUBSYSTEM READY'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl font-extrabold text-primary tracking-tight leading-[1.15]">
                Transparent Criminal Justice &amp; Electronic FIR Platform
              </h1>

              {/* Subtitle */}
              <p className="text-secondary text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Direct statutory complaint lodgment, atomic FIR numbering, tamper-evident investigation case diaries, and real-time citizen tracking under BNSS 2023.
              </p>

              {/* Instant Public Tracking Search */}
              <form onSubmit={handleTrackSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. TRK-2026-PS01-00001)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Track Docket</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </form>

              {/* Quick Links */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <Link
                  to="/file-complaint"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-white font-semibold hover:bg-primary transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">edit_document</span>
                  <span>+ File New Complaint</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-all"
                >
                  <span className="material-symbols-outlined text-sm">dashboard</span>
                  <span>Citizen Dashboard</span>
                </Link>
                <Link
                  to="/privacy-policy"
                  className="text-secondary hover:text-primary transition-colors text-xs font-medium py-1"
                >
                  Privacy Charter →
                </Link>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-outline-variant/70 shadow-lg bg-surface-container-low">
                <img
                  src={heroOfficerImg}
                  alt="Station House Officer Law Enforcement"
                  className="w-full h-80 sm:h-96 object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-fixed font-bold">
                    Statutory Governance Standard
                  </div>
                  <div className="text-base font-bold">
                    State Police Department &amp; Criminal Justice Records
                  </div>
                  <p className="text-xs text-surface-variant/80 font-normal">
                    Cryptographic hash chain verified. Zero tampering tolerance.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* STATUTORY 5-STAGE WORKFLOW LIFECYCLE                                     */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="space-y-1.5 text-center max-w-2xl mx-auto">
            <div className="text-[11px] font-mono uppercase font-bold text-secondary tracking-widest">
              State Transition Life-Cycle
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Strictly Enforced Criminal Investigation Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-secondary">
              Complaints progress through an immutable state machine guarded by database-level procedural triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={step.num}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  activeWorkflowStep === idx
                    ? 'bg-surface-container-lowest border-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-surface-container-lowest/80 border-outline-variant/70 hover:border-primary/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-secondary">{step.num}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-container text-primary">
                      {step.badge}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">{step.icon}</span>
                  </div>
                  <h3 className="text-xs font-bold text-primary tracking-tight leading-snug">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed font-normal">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CORE ARCHITECTURAL PILLARS (DEFENSE-IN-DEPTH)                            */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="space-y-1.5 text-center max-w-2xl mx-auto">
            <div className="text-[11px] font-mono uppercase font-bold text-secondary tracking-widest">
              Institutional Security &amp; Compliance
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Engineered for Evidentiary Non-Repudiation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillarCards.map((card, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/70 shadow-xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{card.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-primary tracking-tight">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-secondary leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CITIZEN CALL-TO-ACTION                                                   */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="p-8 sm:p-10 rounded-3xl bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Need to report an incident or track an active FIR?
              </h3>
              <p className="text-xs sm:text-sm text-surface-variant/80 leading-relaxed font-normal">
                Access the official citizen portal to lodge e-FIRs, submit additional evidence, or review real-time case progression without station delays.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/file-complaint"
                className="px-5 py-2.5 rounded-xl bg-white text-primary text-xs font-bold hover:bg-surface-container-lowest transition-all shadow-sm"
              >
                + File Electronic Complaint
              </Link>
              <Link
                to="/live-tracking"
                className="px-5 py-2.5 rounded-xl border border-white/30 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                Track Live Docket
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
