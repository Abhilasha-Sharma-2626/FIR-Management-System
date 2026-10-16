import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import publicHallImg from '../assets/images/stitch_public_hall.jpg';

export function ServicesPage() {
  const [caseSearchId, setCaseSearchId] = useState('FIR-DL-2025-4401');
  const [activeResult, setActiveResult] = useState({
    id: 'FIR-DL-2025-4401',
    statusPill: 'FIR REGISTERED',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    subtitle: 'Under Active Police Investigation • Jurisdictional Police Station Vasant Vihar',
    section: 'Sec. 380 / 457 BNS (Theft & Housebreaking)',
    io: 'Inspector Rajesh K. Sharma (Badge #DL-4412)',
    nextStep: 'Forensic Lab Device Analysis (FSL Rohini)',
    dueDate: '20 July 2025 (60-Day Statutory Cap)',
    hash: 'SHA256:7b9d4e19...c812a04f',
    milestones: [
      { date: '20 May 2025 • 09:20 AM', title: 'Complaint Lodged Online', desc: 'Authenticated via DigiLocker e-Sign.', done: true },
      { date: '20 May 2025 • 12:45 PM', title: 'SHO Verification Passed', desc: 'Cognizable offense established under Sec 173(1).', done: true },
      { date: '21 May 2025 • 08:30 AM', title: 'FIR Formally Registered', desc: 'Transmitted to MM Court, Patiala House.', done: true },
      { date: 'Active Investigation', title: 'Field Investigation & Forensics', desc: 'CCTV analysis & witness deposition underway.', inProgress: true },
    ],
  });

  const handleSimulateSearch = (idToSearch) => {
    const query = (idToSearch || caseSearchId).trim().toUpperCase();
    if (query.includes('CR') || query.includes('0982')) {
      setActiveResult({
        id: 'CR-2025-0982',
        statusPill: 'PRELIMINARY INQUIRY',
        statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
        subtitle: 'Under Statutory Preliminary Inquiry • Cyber Crime Investigation Cell (SW District)',
        section: 'Sec. 66D IT Act & Sec. 318(4) BNS (Cyber Phishing Fraud)',
        io: 'Sub-Inspector Anil Rawat (Cyber Desk)',
        nextStep: 'Nodal Bank 1930 Transaction Freeze Confirmation',
        dueDate: '27 May 2025 (14-Day Inquiry Window)',
        hash: 'SHA256:4b227777...cfacdabf',
        milestones: [
          { date: '12 May 2025 • 11:20 AM', title: 'Cyber Incident Filed', desc: 'Transaction advice & phishing URL attached.', done: true },
          { date: '12 May 2025 • 11:45 AM', title: 'Axis Bank Freeze Trigger', desc: '1930 Citizen Financial Cyber Fraud reporting sync.', done: true },
          { date: 'Active Inquiry', title: 'Nodal Intermediary Response', desc: 'Awaiting beneficiary bank KYC logs.', inProgress: true },
        ],
      });
      setCaseSearchId('CR-2025-0982');
    } else {
      setActiveResult({
        id: 'FIR-DL-2025-4401',
        statusPill: 'FIR REGISTERED',
        statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        subtitle: 'Under Active Police Investigation • Jurisdictional Police Station Vasant Vihar',
        section: 'Sec. 380 / 457 BNS (Theft & Housebreaking)',
        io: 'Inspector Rajesh K. Sharma (Badge #DL-4412)',
        nextStep: 'Forensic Lab Device Analysis (FSL Rohini)',
        dueDate: '20 July 2025 (60-Day Statutory Cap)',
        hash: 'SHA256:7b9d4e19...c812a04f',
        milestones: [
          { date: '20 May 2025 • 09:20 AM', title: 'Complaint Lodged Online', desc: 'Authenticated via DigiLocker e-Sign.', done: true },
          { date: '20 May 2025 • 12:45 PM', title: 'SHO Verification Passed', desc: 'Cognizable offense established under Sec 173(1).', done: true },
          { date: '21 May 2025 • 08:30 AM', title: 'FIR Formally Registered', desc: 'Transmitted to MM Court, Patiala House.', done: true },
          { date: 'Active Investigation', title: 'Field Investigation & Forensics', desc: 'CCTV analysis & witness deposition underway.', inProgress: true },
        ],
      });
      setCaseSearchId('FIR-DL-2025-4401');
    }
  };

  const services = [
    {
      icon: 'edit_document',
      title: 'Online e-FIR & Complaint Filing',
      code: 'SEC-173 BNSS',
      desc: 'Lodge First Information Reports for cognizable offences including theft, burglary, cyber financial fraud, and missing property with digital e-Sign validation.',
      badge: 'Immediate Token',
      link: '/file-complaint',
      btnText: 'File e-FIR Online',
    },
    {
      icon: 'travel_explore',
      title: 'Live Case & FIR Tracking',
      code: 'CCPS REAL-TIME',
      desc: 'Track statutory milestones from preliminary inquiry to chargesheet submission, view assigned investigating officer contact, and download certified case summaries.',
      badge: '24×7 Active',
      link: '/live-tracking',
      btnText: 'Track Active Docket',
    },
    {
      icon: 'apartment',
      title: 'Police Station Jurisdiction Directory',
      code: 'GIS TERRITORIAL BEAT',
      desc: 'Identify your exact territorial police station through street address, pincode, or automatic GPS location. View station house officer contact and territorial beat maps.',
      badge: 'Zero-FIR Support',
      link: '/dashboard/jurisdiction',
      btnText: 'Locate Police Station',
    },
    {
      icon: 'calendar_month',
      title: 'Station Facilitation Desk Appointments',
      code: 'CFC FAST-TRACK',
      desc: 'Pre-schedule a visit with your designated Investigating Officer or Station House Officer for statement recording and property inspection without waiting in line.',
      badge: 'QR Pass Entry',
      link: '/dashboard/appointments',
      btnText: 'Book Desk Appointment',
    },
    {
      icon: 'verified_user',
      title: 'Evidence Vault & 65B Certificates',
      code: 'BSA SEC. 65B',
      desc: 'Forensically secure CCTV footage, financial transaction receipts, audio depositions, and scene photos with SHA-256 cryptographic non-repudiation hashes.',
      badge: 'Court Admissible',
      link: '/dashboard/evidence',
      btnText: 'Open Evidence Vault',
    },
    {
      icon: 'gavel',
      title: 'Court Notices & Judicial Summons',
      code: 'BNSS SEC. 64 & 193',
      desc: 'Receive electronic court summons from Metropolitan Magistrate Benches, acknowledge service digitally, and apply for remote Video-Conferencing court appearance.',
      badge: 'DLSA Legal Aid',
      link: '/dashboard/court-notices',
      btnText: 'View Legal Notices',
    },
    {
      icon: 'flag',
      title: 'Supervisory Grievance (ACP / DCP)',
      code: 'BNSS SEC. 173(4)',
      desc: 'Direct statutory escalation to the Assistant Commissioner of Police (ACP) or District Deputy Commissioner (DCP) in case of station inaction or non-registration.',
      badge: '72-Hour Mandate',
      link: '/dashboard/grievance',
      btnText: 'Lodge Grievance Petition',
    },
    {
      icon: 'badge',
      title: 'Citizen Identity & DigiLocker e-KYC',
      code: 'UIDAI SECTION 4',
      desc: 'Manage authenticated demographic profile, linked Aadhaar Virtual ID, driving licence credentials, and statutory summons notification channels.',
      badge: 'Tier-1 Verified',
      link: '/dashboard/profile',
      btnText: 'Manage Profile',
    },
  ];

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HEADER HERO BANNER                                                        */}
        {/* ========================================================================= */}
        <section className="bg-surface py-12 lg:py-16 border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-semibold uppercase tracking-wider font-label-sm mb-4">
              <span className="material-symbols-outlined text-sm text-primary">policy</span>
              National Civic Safety &amp; Legal Infrastructure
            </div>

            <h1 className="font-headline-xl text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
              Statutory Police Services &amp; Citizen Dossiers
            </h1>

            <p className="font-body-lg text-base sm:text-lg text-secondary mt-3 leading-relaxed">
              Transparent, tamper-proof First Information Report management and police liaison services under the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CORE PLATFORM CAPABILITIES TICKER                                         */}
        {/* ========================================================================= */}
        <section className="py-10 bg-surface-container-lowest border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: 'bolt', title: 'Zero-Friction E-Filing', sub: 'Instant preliminary tokens 24×7' },
                { icon: 'timeline', title: 'Verifiable Audit Trail', sub: 'Timestamped SHA-256 ledger' },
                { icon: 'balance', title: 'Citizen Rights & Guidance', sub: 'Free DLSA legal aid links' },
                { icon: 'lock', title: 'Cryptographic Integrity', sub: 'Sec. 65B BSA court certified' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-outline-variant/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-xl">{c.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-xs sm:text-sm font-bold text-primary">{c.title}</h4>
                    <p className="text-[11px] text-secondary mt-0.5">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE CASE TRACKER SANDBOX                                          */}
        {/* ========================================================================= */}
        <section className="py-14 lg:py-20 bg-surface border-b border-outline-variant" id="live-tracker">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            
            <div className="max-w-3xl mb-8">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                Real-Time Civic Inquiry Sandbox
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold mt-1 tracking-tight">
                Track a Complaint or FIR Status
              </h2>
              <p className="font-body-md text-xs sm:text-sm text-secondary mt-1">
                Enter your reference token or FIR ID to review the active statutory stage, assigned officer contact, and next scheduled procedural date.
              </p>
            </div>

            {/* Input Box Container */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 lg:p-8 shadow-sm">
              <div className="max-w-2xl">
                <label className="block font-title-md text-xs font-semibold text-primary uppercase mb-2">
                  Case Number / Complaint Token
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-lg">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary font-mono outline-none"
                      placeholder="e.g. FIR-DL-2025-4401 or CR-2025-0982"
                      type="text"
                      value={caseSearchId}
                      onChange={(e) => setCaseSearchId(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handleSimulateSearch()}
                    className="px-6 py-2.5 bg-primary-container text-white font-title-md text-sm rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-1.5 shadow-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-base">saved_search</span>
                    Track Case
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
                  <span>Quick Sample IDs:</span>
                  <button
                    className="underline hover:text-primary font-mono font-medium"
                    onClick={() => handleSimulateSearch('FIR-DL-2025-4401')}
                  >
                    FIR-DL-2025-4401 (Theft)
                  </button>
                  <span>•</span>
                  <button
                    className="underline hover:text-primary font-mono font-medium"
                    onClick={() => handleSimulateSearch('CR-2025-0982')}
                  >
                    CR-2025-0982 (Cyber Fraud)
                  </button>
                </div>
              </div>

              {/* Status Result Display */}
              <div className="mt-8 pt-8 border-t border-outline-variant space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                      <span className="material-symbols-outlined text-2xl">verified</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline-sm text-base sm:text-lg font-bold text-primary font-mono">
                          {activeResult.id}
                        </h4>
                        <span className={`px-2.5 py-0.5 text-[11px] font-semibold tracking-wider rounded-full border ${activeResult.statusColor} uppercase font-mono`}>
                          {activeResult.statusPill}
                        </span>
                      </div>
                      <span className="text-xs text-secondary mt-0.5 block">{activeResult.subtitle}</span>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    <span>Open in Citizen Dashboard</span>
                  </Link>
                </div>

                {/* Structured 4-Column Metadata Dossier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-surface border border-outline-variant text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-label-sm text-secondary block font-bold">Statutory Section</span>
                    <span className="font-medium text-primary font-mono mt-0.5 block">{activeResult.section}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-label-sm text-secondary block font-bold">Investigating Officer (IO)</span>
                    <span className="font-medium text-primary mt-0.5 block">{activeResult.io}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-label-sm text-secondary block font-bold">Next Procedural Step</span>
                    <span className="font-medium text-primary mt-0.5 block">{activeResult.nextStep}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-label-sm text-secondary block font-bold">Statutory Due Date</span>
                    <span className="font-medium text-primary font-mono mt-0.5 block">{activeResult.dueDate}</span>
                  </div>
                </div>

                {/* Case Progression Log */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider block font-label-sm">
                    Case Progression Log
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {activeResult.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 bg-surface-container-lowest rounded-xl border ${
                          m.done
                            ? 'border-l-4 border-l-emerald-600 border-outline-variant'
                            : 'border-l-4 border-l-amber-500 border-outline-variant'
                        }`}
                      >
                        <span className="text-[10px] text-secondary font-mono block">{m.date}</span>
                        <span className="font-semibold text-primary block mt-0.5">{m.title}</span>
                        <p className="text-[11px] text-secondary mt-0.5">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Sign-off Stamp */}
                <div className="p-3 bg-surface-container-low rounded-lg border border-dashed border-outline flex flex-wrap items-center justify-between text-xs text-secondary gap-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">encrypted</span>
                    <span>Electronic Audit Hash: <strong className="text-primary">{activeResult.hash}</strong></span>
                  </div>
                  <span className="text-[11px]">National Case Registry Node: Verified</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* STATUTORY SERVICES CATALOGUE GRID                                         */}
        {/* ========================================================================= */}
        <section className="py-16 lg:py-24 bg-surface-container-lowest border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            
            <div className="max-w-3xl mb-12">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                Citizen Portal Services Catalogue
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl text-primary font-bold mt-1 tracking-tight">
                Public Safety &amp; Statutory Legal Services
              </h2>
              <p className="font-body-md text-xs sm:text-sm text-secondary mt-2 leading-relaxed">
                Empowering citizens with direct digital access to police processes, evidence safekeeping, court notice management, and supervisory oversight without intermediation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((srv, idx) => (
                <div
                  key={idx}
                  className="bg-surface rounded-2xl border border-outline-variant/80 p-6 flex flex-col justify-between hover:border-primary/60 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-sm group-hover:bg-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl text-tertiary-fixed">{srv.icon}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-container text-secondary">
                        {srv.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-secondary tracking-wider uppercase font-bold">
                        {srv.code}
                      </span>
                      <h3 className="font-title-md text-sm sm:text-base font-bold text-primary mt-0.5">
                        {srv.title}
                      </h3>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant/60">
                    <Link
                      to={srv.link}
                      className="w-full py-2 bg-surface-container-lowest hover:bg-primary hover:text-white text-primary border border-outline-variant text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>{srv.btnText}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* TRANSPARENCY & PUBLIC SERVICE ACCOUNTABILITY                              */}
        {/* ========================================================================= */}
        <section className="py-16 lg:py-24 bg-surface border-b border-outline-variant" id="transparency">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Editorial & Standards */}
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">
                  Open Public Oversight
                </span>
                <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Designed for public trust. Built on statutory transparency.
                </h2>
                <p className="font-body-lg text-sm sm:text-base text-secondary leading-relaxed">
                  Modern policing requires an open civic contract. Citizen Service Centers operate with real-time electronic queue monitors, eliminating backroom ambiguity and empowering every individual with certified records.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">timer</span>
                    <div>
                      <h4 className="font-title-md text-xs sm:text-sm font-semibold text-primary">Mandatory 48-Hour Response SLA</h4>
                      <p className="text-xs text-secondary mt-0.5">Every non-emergency complaint receives an official action note or summons update within statutory timeline caps.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">policy</span>
                    <div>
                      <h4 className="font-title-md text-xs sm:text-sm font-semibold text-primary">Zero-FIR Protocol Across Any Jurisdiction</h4>
                      <p className="text-xs text-secondary mt-0.5">Lodging cannot be declined due to territorial boundary limits; files are auto-transferred through the backend gateway.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">fingerprint</span>
                    <div>
                      <h4 className="font-title-md text-xs sm:text-sm font-semibold text-primary">Role-Based Evidence Vault</h4>
                      <p className="text-xs text-secondary mt-0.5">Complainant personal telephone and address data are restricted to investigating ranks to protect civic privacy.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Real Public Service Hall Photo */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border-2 border-outline-variant bg-surface-container-lowest shadow-md">
                  <div className="h-3 bg-primary w-full"></div>
                  <img
                    alt="Citizen service center reception counter with open public desks and citizens receiving assistance"
                    className="w-full h-80 sm:h-96 object-cover"
                    src={publicHallImg}
                  />
                  <div className="p-5 bg-surface-container-lowest border-t border-outline-variant">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-primary block">Citizen Service Center — Information &amp; Guidance Desks</span>
                        <span className="text-secondary text-[11px]">Real-time token display system and direct public accountability counter</span>
                      </div>
                      <span className="px-2.5 py-1 bg-surface-container text-primary font-mono text-[10px] font-semibold rounded shrink-0">
                        ISO-9001:2015
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default ServicesPage;
