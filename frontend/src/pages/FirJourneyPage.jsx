import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import deskOfficerImg from '../assets/images/stitch_desk_officer.jpg';

export function FirJourneyPage() {
  const [activeStage, setActiveStage] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);

  const stages = [
    {
      num: 1,
      title: 'Incident Submission',
      subtitle: 'E-filing & digital receipt',
      badge: 'STAGE 01 / 06',
      icon: 'note_add',
      desc: 'Citizen submits initial complaint via e-Filing desk or station kiosk. The system logs geo-coordinates, identity affirmation, chronology of events, and generates an unalterable preliminary complaint token under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.',
      requiredData: [
        'Aadhaar / Voter ID electronic affirmation via DigiLocker',
        'Date, approximate hour, and precise incident location / GPS',
        'Witness particulars or digital photo/video/audio upload',
      ],
      securityWatermark: 'Timestamped: ISO-8601 UTC+05:30',
      securityDetail: 'Directly feeds to District Police Headquarters supervisory audit server.',
      statusTag: 'Immediate SMS & PDF Acknowledgment',
      actionLabel: 'Launch e-Filing Desk',
      actionLink: '/file-complaint',
    },
    {
      num: 2,
      title: 'Verification & Jurisdictional Review',
      subtitle: 'Preliminary inquiry by SHO',
      badge: 'STAGE 02 / 06',
      icon: 'fact_check',
      desc: 'Pursuant to Section 173(3) of BNSS, the Station House Officer (SHO) assesses cognizable gravity within statutory timeline. If incident falls beyond territorial beat, the Zero-FIR protocol guarantees backend transfer to appropriate police station without citizen hardship.',
      requiredData: [
        'Cognizability assessment: Cognizable vs. Non-Cognizable (NCR)',
        'Territorial jurisdiction validation via GIS Police Grid',
        'Preliminary fact check (conducted within 14 days maximum)',
      ],
      securityWatermark: 'Sec. 173(3) BNSS Non-Declination Protocol',
      securityDetail: 'Zero-FIR Boundary Protection Active across National Police Grid.',
      statusTag: 'Zero-FIR Guarantee Verified',
      actionLabel: 'Locate Station Jurisdiction',
      actionLink: '/dashboard/jurisdiction',
    },
    {
      num: 3,
      title: 'FIR Registration & Judicial Dispatch',
      subtitle: 'Statutory FIR Number & Seal',
      badge: 'STAGE 03 / 06',
      icon: 'verified',
      desc: 'Upon establishing prima facie cognizable facts, a formal First Information Report (FIR) is generated under official digital signature. An uneditable copy is immediately and simultaneously dispatched electronically to the jurisdictional Judicial Magistrate Court and complainant.',
      requiredData: [
        'Court of Judicial Magistrate cognizance transmission',
        'Free certified digital copy dispatched to citizen under Sec 173(2)',
        'Designation of primary Investigating Officer (IO)',
      ],
      securityWatermark: 'Officially Sealed with Verified Checksum under BNSS',
      securityDetail: 'Transmitted to Metropolitan Magistrate Court Bench Registry.',
      statusTag: 'Judicial Bench Synchronized',
      actionLabel: 'Track Existing FIR',
      actionLink: '/live-tracking',
    },
    {
      num: 4,
      title: 'Investigation & Chain of Custody',
      subtitle: 'Officer assignment & evidence log',
      badge: 'STAGE 04 / 06',
      icon: 'biotech',
      desc: 'The designated Investigating Officer inspects scene of crime, requisitions CCTV footage, gathers forensic evidence, and records eyewitness statements under Section 180 BNSS. All electronic proofs are hashed under Section 65B Bharatiya Sakshya Adhiniyam.',
      requiredData: [
        'Forensic Science Laboratory (FSL) intake logs',
        'Section 180 BNSS witness audio-video recording',
        'Digital evidence vault chain-of-custody ledger',
      ],
      securityWatermark: 'BSA Sec. 61 & 65B Admissible Evidence Hash',
      securityDetail: 'Tamper-evident custody handoffs recorded in judicial docket.',
      statusTag: 'FSL Laboratory Node Active',
      actionLabel: 'Open Evidence Vault',
      actionLink: '/dashboard/evidence',
    },
    {
      num: 5,
      title: 'Citizen Case Progress & Legal Liaison',
      subtitle: 'Live milestones & SMS alerts',
      badge: 'STAGE 05 / 06',
      icon: 'radar',
      desc: 'No need to make physical visits to verify progress. The CaseSync portal delivers automated notifications at critical milestones, preserving transparency while shielding classified operational techniques and accused privacy.',
      requiredData: [
        'Direct encrypted liaison message channel with assigned IO',
        'E-Summons & Witness Appearance Notices delivery',
        'Statutory 60/90-Day Investigation SLA Progress Meter',
      ],
      securityWatermark: 'Citizen SMS/WhatsApp Automated Gateway',
      securityDetail: 'Privacy Safeguard: Accused details redacted until charge file.',
      statusTag: 'End-to-End Status Push Active',
      actionLabel: 'Open Citizen Dashboard',
      actionLink: '/dashboard',
    },
    {
      num: 6,
      title: 'Outcome & Statutory Closure',
      subtitle: 'Final charge sheet or closure note',
      badge: 'STAGE 06 / 06',
      icon: 'assignment_turned_in',
      desc: 'Investigation concludes with submission of a Final Report under Section 193 BNSS to the Court of Judicial Magistrate. The complainant is notified to review either the Charge Sheet for prosecution or Closure Report, with full statutory right to file a Protest Petition.',
      requiredData: [
        'Charge Sheet filed before trial court (Prosecution initiated)',
        'Closure Report with grounds (complainant notified)',
        'Citizen Right to file Protest Petition under Section 193 BNSS',
      ],
      securityWatermark: 'Metropolitan Magistrate Trial Bench Transmission',
      securityDetail: 'Statutory right of Protest Petition preserved for aggrieved complainant.',
      statusTag: 'Judicial Resolution Bench',
      actionLabel: 'View Court Notices',
      actionLink: '/dashboard/court-notices',
    },
  ];

  const currentStage = stages[activeStage - 1];

  const handleNextStage = () => {
    if (activeStage < stages.length) setActiveStage(activeStage + 1);
    else setActiveStage(1);
  };

  const handlePrevStage = () => {
    if (activeStage > 1) setActiveStage(activeStage - 1);
  };

  const faqs = [
    {
      q: 'How do I submit an online complaint?',
      a: "Click on 'File Complaint' on this portal. Authenticate using your mobile OTP and provide details: incident location, date, time, and witness statement. Upon submission, an acknowledgment token is generated immediately with zero queue time.",
    },
    {
      q: 'Does every complaint automatically become an FIR?',
      a: 'No. Under the Bharatiya Nagarik Suraksha Sanhita (BNSS), an FIR is registered strictly for cognizable offenses (such as burglary, robbery, cyber extortion). Non-cognizable matters are registered as Non-Cognizable Reports (NCR) and require permission from a Judicial Magistrate to investigate.',
    },
    {
      q: 'How can I track my complaint without visiting the police station?',
      a: 'Use the Live Tracking portal. Enter your unique acknowledgment token or FIR number to check the current stage, assigned Investigating Officer badge number, and statutory milestones. You also receive SMS and WhatsApp notifications at every supervisory checkpoint.',
    },
    {
      q: 'Who has access to view my personal details and evidence?',
      a: 'Personal identity credentials and contact information are encrypted under role-based access controls. Only the Investigating Officer, the Station House Officer, and the designated Judicial Magistrate can access unredacted identity files. Sensitive victim data is shielded under Section 72 BNS provisions.',
    },
    {
      q: 'What is a Zero-FIR and when can I use it?',
      a: 'A Zero-FIR allows a citizen to lodge an FIR at any police station regardless of where the incident occurred. The receiving station cannot refuse the report; it assigns a temporary zero serial number and transfers the docket to the jurisdictional station through the automated police network.',
    },
  ];

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary flex flex-col">
      <Navbar />

      <main className="flex-1">
        
        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <section className="relative bg-surface py-12 lg:py-20 border-b border-outline-variant overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
            <span className="material-symbols-outlined text-[720px] select-none text-primary">gavel</span>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Editorial Column (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  Statutory Digital FIR Framework under BNSS, 2023 &amp; Indian Evidence Acts
                </div>

                <h1 className="font-headline-xl text-3xl sm:text-4xl lg:text-[44px] lg:leading-[52px] text-primary font-bold tracking-tight">
                  Justice begins with <br className="hidden sm:inline" />
                  <span className="underline decoration-tertiary-fixed-dim decoration-4 underline-offset-8">being heard.</span>
                </h1>

                <p className="font-body-lg text-base sm:text-lg text-secondary max-w-2xl leading-relaxed">
                  Report incidents, follow your complaint's progress, and stay informed through a transparent, accountable case-management journey. Designed to safeguard citizen dignity, victim rights, and judicial integrity.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/file-complaint"
                    className="px-6 py-3 bg-primary-container text-white font-title-md rounded hover:bg-primary transition-all duration-150 shadow-sm flex items-center gap-2 border-l-4 border-tertiary-fixed-dim text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    File a Complaint / e-FIR
                  </Link>
                  <Link
                    to="/live-tracking"
                    className="px-6 py-3 bg-surface-container-lowest text-primary font-title-md border border-outline-variant rounded hover:bg-surface-container-low transition-colors duration-150 flex items-center gap-2 shadow-sm text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">manage_search</span>
                    Track a Case
                  </Link>
                </div>

                {/* Academic & Trust Note */}
                <div className="pt-4 flex items-start gap-3 text-secondary text-xs border-t border-outline-variant/60">
                  <span className="material-symbols-outlined text-secondary text-base mt-0.5">verified_user</span>
                  <span>
                    <strong>Civic Integrity Assurance:</strong> Statutory citizen portal prototype under digital public governance frameworks. Certified chain of custody, timestamped non-repudiation, and protected whistle-blower provisions.
                  </span>
                </div>

                {/* Quick Stat Tickers */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                  <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant">
                    <div className="font-headline-sm text-primary font-bold text-lg sm:text-xl">24 Hrs</div>
                    <div className="font-label-sm text-secondary uppercase text-[10px]">Supervisory Review Window</div>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant">
                    <div className="font-headline-sm text-primary font-bold text-lg sm:text-xl">100%</div>
                    <div className="font-label-sm text-secondary uppercase text-[10px]">Digital Acknowledgment</div>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant">
                    <div className="font-headline-sm text-primary font-bold text-lg sm:text-xl">Verified</div>
                    <div className="font-label-sm text-secondary uppercase text-[10px]">Protected Dossier</div>
                  </div>
                </div>
              </div>

              {/* Right Visual Dossier Column (5 Cols) */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-lg overflow-hidden border-2 border-outline-variant bg-surface-container-lowest shadow-md">
                  <div className="h-3 bg-primary-container w-full"></div>
                  <img
                    alt="Police Sub-Inspector listening to and documenting an elder citizen complaint at modern public police station desk"
                    className="w-full h-80 object-cover object-top"
                    src={deskOfficerImg}
                  />
                  <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span className="text-xs font-semibold text-primary">Station Front-Desk Verified</span>
                    </div>
                    <span className="text-xs text-secondary font-mono">Sec. 173 BNSS Subsystem</span>
                  </div>
                </div>

                {/* Floating Interactive Quick-Check Dossier Card */}
                <div className="mt-4 sm:absolute sm:-bottom-6 sm:-left-6 sm:right-4 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">#CR-2025-0982</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-amber-100 text-amber-800 uppercase font-mono">
                        Under Review
                      </span>
                    </div>
                    <span className="text-[11px] text-secondary font-mono">Today, 10:24 AM</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-secondary block text-[10px] uppercase font-label-sm">Jurisdiction</span>
                      <span className="font-medium text-primary">Central Division (PS-04)</span>
                    </div>
                    <div>
                      <span className="text-secondary block text-[10px] uppercase font-label-sm">Designated Officer</span>
                      <span className="font-medium text-primary">SI M. Verma (Desk #3)</span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-outline-variant/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span className="text-[11px] font-mono">Official Tracking ID Assigned</span>
                    </div>
                    <Link to="/live-tracking" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                      <span>Inspect</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SIGNATURE FEATURE: SCROLL-DRIVEN & INTERACTIVE FIR JOURNEY                */}
        {/* ========================================================================= */}
        <section className="py-16 lg:py-24 bg-surface-container-lowest border-b border-outline-variant" id="fir-journey">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            
            {/* Section Header */}
            <div className="max-w-3xl mb-12">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                Structured Procedural Pathway
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl text-primary font-bold mt-1 tracking-tight">
                From Your First Report to Resolution.
              </h2>
              <p className="font-body-lg text-secondary text-sm sm:text-base mt-2 leading-relaxed">
                Every report follows a clear, accountable journey. Understand what happens next, track meaningful updates, and stay informed at every stage without jurisdictional ambiguity.
              </p>
            </div>

            {/* Dossier Split Layout: 4-Column Stepper Rail + 8-Column Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left: 4-Column Timeline Navigation Rail */}
              <div className="lg:col-span-4 bg-surface rounded-xl border border-outline-variant p-4 space-y-2 lg:sticky lg:top-24 shadow-sm">
                <div className="px-3 py-2 border-b border-outline-variant flex items-center justify-between">
                  <span className="font-title-md text-xs uppercase tracking-wider text-secondary font-semibold">
                    Statutory Milestones
                  </span>
                  <span className="text-xs font-mono text-primary font-bold">6 Stages</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {stages.map((stg) => {
                    const isActive = activeStage === stg.num;
                    return (
                      <button
                        key={stg.num}
                        onClick={() => setActiveStage(stg.num)}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-surface-container text-primary font-semibold border-l-4 border-primary shadow-sm'
                            : 'hover:bg-surface-container-low text-secondary'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                            isActive
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-variant text-primary'
                          }`}
                        >
                          {stg.num}
                        </span>
                        <div className="min-w-0">
                          <div className={`text-xs sm:text-sm font-medium truncate ${isActive ? 'text-primary font-bold' : 'text-on-surface'}`}>
                            {stg.title}
                          </div>
                          <div className="text-[11px] text-secondary truncate">{stg.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg text-xs text-secondary mt-3 border border-outline-variant/60">
                  <span className="font-semibold text-primary block mb-0.5">Note on Cognizability:</span>
                  Non-cognizable complaints require formal Judicial Magistrate endorsement before FIR escalation.
                </div>
              </div>

              {/* Right: 8-Column Document Canvas */}
              <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="h-1.5 bg-primary-container w-full"></div>

                <div className="p-6 lg:p-8 space-y-6">
                  {/* Header of Stage */}
                  <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">
                        {currentStage.badge}
                      </span>
                      <h3 className="font-headline-md text-xl sm:text-2xl text-primary font-bold mt-1">
                        {currentStage.title}
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-3xl text-secondary">
                      {currentStage.icon}
                    </span>
                  </div>

                  {/* Stage Narrative Description */}
                  <p className="text-secondary font-body-md text-sm sm:text-base leading-relaxed">
                    {currentStage.desc}
                  </p>

                  {/* Mock Sub-dossier Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-2">
                      <span className="font-label-sm text-secondary uppercase block text-xs font-bold">
                        Procedural Criteria &amp; Evidence Log
                      </span>
                      <ul className="text-xs space-y-2 text-primary">
                        {currentStage.requiredData.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-700 shrink-0 mt-0.5">check_circle</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-outline bg-surface-container-low flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-label-sm text-secondary uppercase block text-xs font-bold">
                          System Security Watermark
                        </span>
                        <p className="text-xs text-primary font-mono font-semibold mt-1">
                          {currentStage.securityWatermark}
                        </p>
                        <p className="text-[11px] text-secondary mt-1">
                          {currentStage.securityDetail}
                        </p>
                      </div>

                      <div className="text-xs font-semibold text-primary flex items-center gap-1.5 pt-2 border-t border-outline-variant/60">
                        <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">verified</span>
                        <span>{currentStage.statusTag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action banner within step */}
                  <div className="p-4 bg-surface-container rounded-xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-semibold text-primary block">Ready to proceed with this procedure?</span>
                      <p className="text-secondary">Statutory compliance safeguards your civil rights throughout inquiry.</p>
                    </div>
                    <Link
                      to={currentStage.actionLink}
                      className="px-4 py-2 bg-primary-container text-white text-xs font-semibold rounded-lg hover:bg-primary transition-colors shrink-0 text-center shadow-sm"
                    >
                      {currentStage.actionLabel}
                    </Link>
                  </div>

                </div>

                {/* Bottom Stage Navigation Controls */}
                <div className="bg-surface px-6 py-4 border-t border-outline-variant flex items-center justify-between">
                  <button
                    onClick={handlePrevStage}
                    disabled={activeStage === 1}
                    className="px-4 py-1.5 text-xs font-semibold text-secondary hover:text-primary border border-outline-variant rounded-lg disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">west</span>
                    <span>Previous Stage</span>
                  </button>

                  <span className="text-xs text-secondary font-mono font-bold" id="stage-counter">
                    Stage {activeStage} of {stages.length}
                  </span>

                  <button
                    onClick={handleNextStage}
                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-container flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <span>{activeStage === stages.length ? 'Restart Journey' : 'Next Stage'}</span>
                    <span className="material-symbols-outlined text-sm">east</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* PLATFORM CORE CAPABILITIES SECTION                                        */}
        {/* ========================================================================= */}
        <section className="py-16 bg-surface border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                Institutional Standards
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary mt-1">
                Platform Core Capabilities
              </h2>
              <p className="font-body-md text-xs sm:text-sm text-secondary mt-2">
                Engineered to satisfy high-reliability police operations, judicial compliance, and direct accessibility for citizens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: 'electric_bolt',
                  title: 'Zero-Friction E-Filing',
                  desc: 'Citizen complaints recorded with geo-tagging, audio-statement transcription, and instant digital tokens 24/7 without desk delays.',
                  tag: 'Statutory Art. 21 Compliance',
                },
                {
                  icon: 'timeline',
                  title: 'Verifiable Audit Trail',
                  desc: 'Every supervisor review, station endorsement, and evidence handover creates an immutable, timestamped ledger record.',
                  tag: 'Anti-Tamper Protocol',
                },
                {
                  icon: 'menu_book',
                  title: 'Citizen Rights & Guidance',
                  desc: 'Integrated legal plain-language explainers clarifying bail rights, zero-FIR protocols, and women-safety protections.',
                  tag: 'Free Legal Advisory Link',
                },
                {
                  icon: 'shield_check',
                  title: 'Evidence Integrity',
                  desc: 'Digital evidence files verified with checksums upon ingestion, ensuring admissibility under Section 65B of Evidence Act.',
                  tag: 'Sec. 65B Certified',
                },
              ].map((cap, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary transition-all duration-150 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-4">
                      <span className="material-symbols-outlined text-2xl">{cap.icon}</span>
                    </div>
                    <h3 className="font-title-md text-primary font-bold text-sm sm:text-base">{cap.title}</h3>
                    <p className="text-secondary font-body-sm text-xs mt-2 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-outline-variant text-[11px] font-mono text-secondary">
                    {cap.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* STATUTORY INQUIRIES & FAQ ACCORDION                                       */}
        {/* ========================================================================= */}
        <section className="py-16 bg-surface-container-lowest border-b border-outline-variant" id="faq">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                Frequently Asked Legal Questions
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary mt-1">
                Statutory Inquiries &amp; Guidance
              </h2>
              <p className="font-body-md text-xs sm:text-sm text-secondary mt-1">
                Clear answers to common questions regarding filing rules, personal privacy, and citizen rights.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-outline-variant rounded-xl overflow-hidden bg-surface shadow-sm">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-title-md text-sm font-semibold text-primary flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <span>{f.q}</span>
                      <span className="material-symbols-outlined text-secondary transition-transform duration-200">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-1 text-xs text-secondary border-t border-outline-variant/60 bg-surface-container-lowest leading-relaxed">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EMERGENCY HELPLINE & IMMEDIATE CONTACT STRIP                              */}
        {/* ========================================================================= */}
        <section className="bg-primary-container text-white py-10 border-t border-outline" id="helpline">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary flex items-center justify-center font-bold text-xl shadow">
                112
              </div>
              <div>
                <h3 className="font-headline-sm text-base sm:text-lg font-bold text-white">
                  Immediate Emergency Support
                </h3>
                <p className="text-xs text-slate-300">
                  National Emergency Response Support System (ERSS) operates 24x7 across all states and union territories.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                className="px-5 py-2.5 bg-error text-white font-medium text-xs rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-sm"
                href="tel:112"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Dial 112 (Police)</span>
              </a>
              <a
                className="px-4 py-2.5 bg-surface-container-lowest text-primary font-medium text-xs rounded-lg hover:bg-surface-container-low flex items-center gap-1.5 shadow-sm"
                href="tel:1091"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                <span>Women Helpline 1091</span>
              </a>
              <a
                className="px-4 py-2.5 bg-surface-container-lowest text-primary font-medium text-xs rounded-lg hover:bg-surface-container-low flex items-center gap-1.5 shadow-sm"
                href="tel:1930"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                <span>Cyber Fraud 1930</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default FirJourneyPage;
