import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import heroOfficerImg from '../assets/images/stitch_hero_officer.jpg';
import stitchVerificationImg from '../assets/images/stitch_verification_counter.jpg';
import stitchDeskOfficerImg from '../assets/images/stitch_desk_officer.jpg';

export function HomePage() {
  const navigate = useNavigate();
  const [trackingInput, setTrackingInput] = useState('');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [isPipelinePaused, setIsPipelinePaused] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

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
      icon: 'edit_note',
      sla: 'Instant Digital Receipt',
      statute: 'BNSS Section 154(1)',
      trigger: 'TG_COMPLAINT_INTAKE_GEN_ID',
      actionLink: '/file-complaint',
      actionLabel: 'Lodge e-FIR'
    },
    {
      num: '02',
      title: 'Desk Officer Preliminary Triage',
      badge: '24-Hour SLA',
      desc: 'Station desk personnel examine cognizable criteria, verify duplicate records, tag penal sections, or request clarification.',
      icon: 'fact_check',
      sla: 'Strict 24h Inquiry Limit',
      statute: 'BNSS Sec. 173 Preliminary Enquiry',
      trigger: 'TG_TRIAGE_DUPLICATE_CHECK',
      actionLink: '/live-tracking',
      actionLabel: 'Track Triage Status'
    },
    {
      num: '03',
      title: 'SHO FIR Approval & Locking',
      badge: 'Atomic Sequence',
      desc: 'Station House Officer approves registration. Unique FIR number is generated with database-level sequence locks.',
      icon: 'local_police',
      sla: 'Statutory Immediate Lock',
      statute: 'BNS 2023 Penal Cognizance',
      trigger: 'TG_SHO_FIR_SEQUENCE_LOCK',
      actionLink: '/services',
      actionLabel: 'Explore Services'
    },
    {
      num: '04',
      title: 'Investigation & Case Diaries',
      badge: 'Evidence Vault',
      desc: 'Assigned IO logs field diary entries, profiles accused/witnesses, and submits exhibits with SHA-256 custody tracking.',
      icon: 'manage_search',
      sla: 'Continuous Malkhana Logging',
      statute: 'BNSS Sec. 105 Digital Exhibits',
      trigger: 'TG_EVIDENCE_SHA256_HASH',
      actionLink: '/dashboard/evidence',
      actionLabel: 'Evidence Vault'
    },
    {
      num: '05',
      title: 'Judicial Closure & Transparency',
      badge: 'Magistrate Filing',
      desc: 'Final chargesheet or closure report filed before court. Complainant receives full chronological timeline and feedback rights.',
      icon: 'gavel',
      sla: '60/90 Days Statutory Mandate',
      statute: 'BNSS Sec. 193 Final Report',
      trigger: 'TG_CHARGESHEET_MAGISTRATE_DISPATCH',
      actionLink: '/live-tracking',
      actionLabel: 'Inspect Timeline'
    }
  ];

  const metrics = [
    { label: 'Registered e-FIRs & Dockets', value: '18,450+', icon: 'local_police', sub: 'Across 14 Metropolitan Stations' },
    { label: 'Average Preliminary Triage SLA', value: '< 2.8 Hrs', icon: 'timer', sub: 'BNSS 24h Mandate Adherence' },
    { label: 'Cryptographically Sealed Exhibits', value: '54,200+', icon: 'lock_clock', sub: 'SHA-256 Malkhana Fingerprints' },
    { label: 'Zero FIR Cross-Station Transfers', value: '2,140+', icon: 'sync_alt', sub: 'Seamless Inter-Territorial Routing' }
  ];

  const crimeCategories = [
    {
      title: 'Theft & Lost Property',
      code: 'SEC-303 BNS',
      icon: 'wallet',
      desc: 'Snatched mobile phones, pickpocketing, stolen luggage, residential housebreaking, and commercial burglary.',
      badge: 'Fast Track e-Slip'
    },
    {
      title: 'Cyber Crime & Financial Fraud',
      code: 'IT ACT & BNS',
      icon: 'phishing',
      desc: 'UPI payment deception, unauthorized credit transactions, social impersonation, and fraudulent investment schemes.',
      badge: 'Helpline: 1930'
    },
    {
      title: 'Motor Vehicle Theft',
      code: 'AUTOMOBILE',
      icon: 'directions_car',
      desc: 'Two-wheelers, four-wheelers, commercial transports, and registered vehicle tracking through VAHAN integrated registers.',
      badge: 'Auto Police Lookup'
    },
    {
      title: 'Women & Child Safety',
      code: 'PRIORITY-1',
      icon: 'shield_with_heart',
      desc: 'Cyber stalking, harassment, distress reporting, and domestic dispute intake with mandatory female desk officer assignment.',
      badge: 'Helpline: 1091 / 112'
    },
    {
      title: 'Physical Assault & Affray',
      code: 'COGNIZABLE',
      icon: 'personal_injury',
      desc: 'Bodily injury, public brawls, threats to life, road rage incidents, and weapon recovery statements under BNSS protocols.',
      badge: 'Immediate Response'
    },
    {
      title: 'Missing Persons & Lost Children',
      code: 'URGENT-TRACE',
      icon: 'person_search',
      desc: 'Immediate state-wide bulletin generation, biometric reference records, and transit hub alert notifications.',
      badge: 'Statewide Net'
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

  const faqs = [
    {
      q: 'Can a police station refuse to register my e-FIR because the crime happened elsewhere?',
      a: 'No. Under the Supreme Court mandate and Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 Section 173, any police station must register a Zero FIR regardless of territorial jurisdiction and immediately transmit the case to the concerned jurisdictional station within 24 hours.'
    },
    {
      q: 'Is an electronic FIR filed on CaseSync legally valid in judicial court proceedings?',
      a: 'Yes. e-FIRs generated through CaseSync carry a cryptographically timestamped electronic seal and SHA-256 hash certificate compliant with Section 63/65B of the Indian Evidence Act, eliminating the requirement of immediate paper deposition.'
    },
    {
      q: 'How does CaseSync protect my Aadhaar number and contact information?',
      a: 'In strict compliance with the Digital Personal Data Protection (DPDP) Act 2023, personal national IDs are redacted and masked at the service layer (e.g. XXXX-XXXX-9941). Complainant phone numbers and physical residences are withheld from public docket tracking.'
    },
    {
      q: 'What should I do if station triage personnel reject my electronic complaint?',
      a: 'Under BNSS Section 154(3), citizens possess an immediate statutory right to file a Supervisory Rejection Appeal directly to the Station House Officer (SHO) and Assistant Commissioner of Police (ACP) through the portal grievance desk.'
    },
    {
      q: 'Are digital evidence photos and invoices safe from tampering?',
      a: 'All files uploaded into the CaseSync Malkhana Evidence Vault are hashed using mathematical SHA-256 algorithms upon receipt. Database procedural triggers prohibit SQL-level updates or deletion, guaranteeing court-ready non-repudiation.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed">
      <Navbar />

      <main className="flex-1 space-y-20 py-10 w-full">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-primary tracking-tight leading-[1.12]">
                Transparent Criminal Justice &amp; Electronic FIR Platform
              </h1>

              {/* Subtitle */}
              <p className="text-secondary text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Direct statutory complaint lodgment, atomic FIR numbering, tamper-evident investigation case diaries, and real-time citizen tracking under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.
              </p>

              {/* Instant Public Tracking Search with Microinteractions */}
              <form onSubmit={handleTrackSubmit} className="pt-1 flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="relative flex-1 group">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-lg group-focus-within:text-primary transition-colors">
                    search
                  </span>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. TRK-2026-PS01-00001)..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-mono shadow-xs transition-all"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 shrink-0 interactive-btn"
                >
                  <span>Track Docket</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </motion.button>
              </form>

              {/* Quick Links with Hover Animations */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/file-complaint"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-white font-semibold hover:bg-primary transition-all shadow-xs interactive-btn"
                  >
                    <span className="material-symbols-outlined text-base text-tertiary-fixed-dim">edit_document</span>
                    <span>+ File New Complaint</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/live-tracking"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-all interactive-btn"
                  >
                    <span className="material-symbols-outlined text-base">radar</span>
                    <span>Live Tracking</span>
                  </Link>
                </motion.div>
                <Link
                  to="/services"
                  className="text-secondary hover:text-primary transition-colors text-xs font-semibold py-2 px-1 hover:underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Explore Citizen Services</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-outline-variant/80 shadow-xl bg-surface-container-low interactive-card">
                <img
                  src={heroOfficerImg}
                  alt="Station House Officer Law Enforcement"
                  className="w-full h-84 sm:h-[420px] object-cover object-top transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/35 to-transparent flex flex-col justify-end p-7 text-white space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-tertiary-fixed font-bold">
                    Statutory Governance Standard
                  </div>
                  <div className="text-lg font-bold">
                    State Police Department &amp; Criminal Justice Records
                  </div>
                  <p className="text-xs text-surface-variant/90 font-normal">
                    Cryptographic SHA-256 hash chain verified. Zero tampering tolerance.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. REAL-TIME STATUTORY METRICS COUNTER                                    */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                className="interactive-card p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-secondary">
                  <span className="material-symbols-outlined text-xl text-primary">{m.icon}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                    {m.value}
                  </div>
                  <div className="text-xs font-bold text-primary mt-1">{m.label}</div>
                  <div className="text-[10px] text-secondary font-mono mt-0.5">{m.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. STATUTORY 5-STAGE WORKFLOW LIFECYCLE (SCROLLING PIPELINE ANIMATION)    */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/60 pb-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-mono uppercase font-bold tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active State Machine Pipeline</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                Strictly Enforced Criminal Investigation Pipeline
              </h2>
              <p className="text-xs sm:text-sm text-secondary">
                Complaints progress through an immutable state machine guarded by database-level procedural triggers.
              </p>
            </div>

            {/* Animation Controls & Stage Switchers */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPipelinePaused(!isPipelinePaused)}
                className="interactive-btn px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-primary text-xs font-semibold hover:bg-surface-container-low flex items-center gap-1.5 shadow-xs cursor-pointer"
                title={isPipelinePaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              >
                <span className="material-symbols-outlined text-base">
                  {isPipelinePaused ? 'play_arrow' : 'pause'}
                </span>
                <span className="hidden sm:inline">{isPipelinePaused ? 'Resume Scroll' : 'Pause Scroll'}</span>
              </button>

              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowStep((prev) => (prev === 0 ? workflowSteps.length - 1 : prev - 1))}
                  className="interactive-btn p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface-container cursor-pointer"
                  title="Previous stage"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-primary px-1.5">
                  0{activeWorkflowStep + 1} / 0{workflowSteps.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveWorkflowStep((prev) => (prev === workflowSteps.length - 1 ? 0 : prev + 1))}
                  className="interactive-btn p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface-container cursor-pointer"
                  title="Next stage"
                >
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Jump Stage Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {workflowSteps.map((s, idx) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  setActiveWorkflowStep(idx);
                  setIsPipelinePaused(true);
                }}
                className={`interactive-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeWorkflowStep === idx
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'bg-surface-container-lowest border border-outline-variant/70 text-secondary hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{s.num}</span>
                <span>{s.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Scrolling Marquee Container with Gradient Edge Fades */}
          <div className="relative overflow-hidden py-3">
            {/* Ambient Edge Gradient Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10"></div>

            {/* Continuous Marquee Track */}
            <div
              className={`animate-marquee flex items-stretch gap-4 ${
                isPipelinePaused ? 'animate-marquee-paused' : ''
              }`}
              onMouseEnter={() => setIsPipelinePaused(true)}
              onMouseLeave={() => setIsPipelinePaused(false)}
            >
              {[...workflowSteps, ...workflowSteps].map((step, idx) => {
                const actualStepIndex = idx % workflowSteps.length;
                const isSelected = activeWorkflowStep === actualStepIndex;
                return (
                  <motion.div
                    key={`${step.num}-${idx}`}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveWorkflowStep(actualStepIndex)}
                    className={`w-[290px] sm:w-[325px] shrink-0 p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 interactive-card shadow-xs ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/25 shadow-md'
                        : 'bg-surface-container-lowest border-outline-variant/70 hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="font-mono text-xs font-bold text-primary">Stage {step.num}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-primary uppercase">
                          {step.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container text-primary flex items-center justify-center shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-xl">{step.icon}</span>
                        </div>
                        <h3 className="text-sm font-bold text-primary tracking-tight leading-snug">
                          {step.title}
                        </h3>
                      </div>

                      <p className="text-[11px] text-secondary leading-relaxed font-normal line-clamp-3">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono text-secondary">
                      <span className="font-semibold text-primary">{step.sla}</span>
                      <span className="text-secondary opacity-75">{step.statute}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Active Step Deep Inspection Panel */}
          {workflowSteps[activeWorkflowStep] && (
            <motion.div
              key={activeWorkflowStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5 sm:p-6 rounded-3xl bg-surface-container-low border border-outline-variant/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">
                    {workflowSteps[activeWorkflowStep].icon}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary font-mono uppercase">
                      Stage {workflowSteps[activeWorkflowStep].num}: {workflowSteps[activeWorkflowStep].title}
                    </span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-outline-variant/60 font-semibold text-primary">
                      {workflowSteps[activeWorkflowStep].statute}
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed max-w-2xl">
                    {workflowSteps[activeWorkflowStep].desc}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-secondary font-mono">
                    <span>SLA: <strong className="text-primary">{workflowSteps[activeWorkflowStep].sla}</strong></span>
                    <span>•</span>
                    <span>Audit Trigger: <strong className="text-primary font-mono text-[10px]">{workflowSteps[activeWorkflowStep].trigger}</strong></span>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0 w-full md:w-auto">
                <Link
                  to={workflowSteps[activeWorkflowStep].actionLink}
                  className="interactive-btn w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-xs"
                >
                  <span>{workflowSteps[activeWorkflowStep].actionLabel}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. CIVIC CRIME DIRECTORY & FAST-TRACK INTAKE                             */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/60 pb-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-[10px] font-mono uppercase font-bold text-secondary tracking-widest">
                Categorical Reporting Desks
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                Specialized Incident Intakes
              </h2>
              <p className="text-xs sm:text-sm text-secondary">
                Select your crime classification for automated routing to dedicated jurisdictional investigation cells.
              </p>
            </div>
            <Link
              to="/file-complaint"
              className="interactive-btn px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-bold text-primary hover:bg-surface-container-low flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <span>View Full Legal Directory</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crimeCategories.map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="interactive-card p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-surface-container text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container-low text-secondary border border-outline-variant/60 uppercase">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-primary tracking-tight">{cat.title}</h3>
                    <span className="text-[10px] font-mono text-secondary uppercase font-semibold">{cat.code}</span>
                  </div>

                  <p className="text-xs text-secondary leading-relaxed font-normal">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                  <Link
                    to={`/file-complaint`}
                    className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Lodge Report</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                  <span className="text-[10px] font-mono text-secondary">Zero-Wait</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. MALKHANA DIGITAL EVIDENCE VAULT SHOWCASE                              */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-container-low border border-outline-variant shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-primary text-xs font-semibold font-mono tracking-wider border border-outline-variant/60 shadow-xs">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>BNSS SECTION 105 TAMPER-EVIDENCE</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight">
                Cryptographic Malkhana &amp; Digital Exhibit Custody
              </h2>

              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Eliminating paper diary tampering and evidence contamination. Every physical exhibit receipt, forensic photo, surveillance clip, and medical report is hashed with mathematical SHA-256 upon intake.
              </p>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">fingerprint</span>
                  <div>
                    <strong className="text-primary font-bold block">Client-Side SHA-256 Checksums</strong>
                    <span className="text-secondary text-[11px]">Evidentiary files are fingerprinted in the browser prior to transmission, guaranteeing absolute non-repudiation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">gavel</span>
                  <div>
                    <strong className="text-primary font-bold block">Section 65B Electronic Admissibility</strong>
                    <span className="text-secondary text-[11px]">One-click export of court-certified electronic records with verifying officer cryptographic signatures.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/services"
                  className="interactive-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  <span>Review Evidence Architecture</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-outline-variant shadow-lg bg-surface-container-lowest interactive-card">
                <img
                  src={stitchVerificationImg}
                  alt="Forensic Evidence Verification Counter"
                  className="w-full h-80 sm:h-96 object-cover object-center"
                  loading="lazy"
                />
                <div className="p-4 bg-primary text-white flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Forward-Chained Custody Active</span>
                  </div>
                  <span className="text-[10px] opacity-80">TLS 1.3 Strict</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CORE ARCHITECTURAL PILLARS (DEFENSE-IN-DEPTH)                         */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
          <div className="space-y-1.5 text-center max-w-2xl mx-auto">
            <div className="text-[10px] font-mono uppercase font-bold text-secondary tracking-widest">
              Institutional Security &amp; Compliance
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Engineered for Evidentiary Non-Repudiation
            </h2>
            <p className="text-xs sm:text-sm text-secondary">
              Strict compliance with statutory criminal procedure codes and civil protection standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillarCards.map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/70 shadow-xs space-y-3 flex flex-col justify-between interactive-card"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container text-primary flex items-center justify-center shadow-2xs">
                    <span className="material-symbols-outlined text-xl">{card.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-primary tracking-tight">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-secondary leading-relaxed font-normal">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED LEGAL QUESTIONS (FAQ ACCORDION)                      */}
        {/* ========================================================================= */}
        <section className="w-full max-w-5xl mx-auto px-6 lg:px-12 space-y-8">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <div className="text-[10px] font-mono uppercase font-bold text-secondary tracking-widest">
              Citizen Knowledge Base
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Frequently Asked Legal Questions
            </h2>
            <p className="text-xs sm:text-sm text-secondary">
              Essential statutory answers regarding electronic complaint thresholds, police station jurisdiction, and privacy rights.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-primary flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <span className="pr-4">{f.q}</span>
                    <span className="material-symbols-outlined text-secondary transition-transform duration-200 shrink-0">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs text-secondary leading-relaxed border-t border-outline-variant/40 pt-3 bg-surface-container-low/40"
                    >
                      {f.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. CITIZEN CALL-TO-ACTION                                                 */}
        {/* ========================================================================= */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            whileHover={{ scale: 1.005 }}
            className="p-8 sm:p-12 rounded-3xl bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden"
          >
            <div className="space-y-2.5 text-center md:text-left max-w-2xl z-10">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Need to report an incident or track an active FIR?
              </h3>
              <p className="text-xs sm:text-sm text-surface-variant/90 leading-relaxed font-normal">
                Access the official citizen portal to lodge e-FIRs, submit additional evidence, or review real-time case progression without station delays.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0 z-10">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/file-complaint"
                  className="px-6 py-3 rounded-xl bg-white text-primary text-xs font-bold hover:bg-surface-container-lowest transition-all shadow-sm interactive-btn block"
                >
                  + File Electronic Complaint
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/live-tracking"
                  className="px-6 py-3 rounded-xl border border-white/30 text-white text-xs font-bold hover:bg-white/10 transition-all interactive-btn block"
                >
                  Track Live Docket
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
