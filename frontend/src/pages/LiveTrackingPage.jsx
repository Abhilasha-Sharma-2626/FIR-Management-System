import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';
import trackingOfficerImg from '../assets/images/stitch_tracking_officer.jpg';

export function LiveTrackingPage() {
  const [searchMode, setSearchMode] = useState('fir'); // 'fir' | 'token'
  const [searchInput, setSearchInput] = useState('FIR-DL-2025-4401');
  const [selectedCase, setSelectedCase] = useState('fir'); // 'fir' | 'complaint'
  const [notifySuccess, setNotifySuccess] = useState(false);

  const handleSelectCase = (type) => {
    setSelectedCase(type);
    if (type === 'fir') {
      setSearchMode('fir');
      setSearchInput('FIR-DL-2025-4401');
    } else {
      setSearchMode('token');
      setSearchInput('CR-2025-0982');
    }
  };

  const handleNotify = () => {
    setNotifySuccess(true);
    setTimeout(() => setNotifySuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="live-tracking" />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Navbar if screen < md */}
        <div className="md:hidden">
          <Navbar />
        </div>

        {/* Top Minimal Utility Header on Desktop */}
        <header className="hidden md:flex w-full bg-surface-container-lowest text-on-surface top-0 sticky z-30 shadow-sm border-b border-outline-variant px-6 py-2.5 items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-secondary font-medium hover:text-primary">Home</Link>
            <span className="text-outline-variant">/</span>
            <Link to="/dashboard" className="text-secondary font-medium hover:text-primary">Citizen Statutory Services</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">Live Status &amp; Investigation Tracking</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>CCPS Encrypted Ledger &amp; Judicial Sync</span>
            </div>
            <Link to="/file-complaint" className="px-3 py-1 rounded bg-primary-container text-white text-xs font-semibold hover:bg-primary">
              + File e-FIR
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Title & Subtitle */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-semibold font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Real-Time Case Intelligence
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold tracking-tight text-primary">
              Track Incident Complaint or Registered FIR
            </h1>
            <p className="font-body-md text-sm text-secondary max-w-4xl">
              Enter your 16-character acknowledgment token or formal FIR number to view live statutory milestones, assigned Investigating Officer (IO), and judicial forwarding dates.
            </p>
          </div>

          {/* Visual Context Dossier Banner with Real Administrative Presence */}
          <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-8 p-6 lg:p-8 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-bold">
                  <span className="material-symbols-outlined text-xs">account_balance</span>
                  CIVIC SERVICE DESK &amp; PUBLIC GRIEVANCE NETWORK
                </div>
                <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-primary">
                  Institutional Transparency &amp; Rapid Digital FIR Verification
                </h2>
                <p className="font-body-md text-xs sm:text-sm text-secondary leading-relaxed">
                  Citizen complaints are reviewed under statutory governance guidelines within 24 hours of submission. Directly liaise with your designated Investigating Officer or file evidence online without visiting the police station physically.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-secondary font-label-md text-xs pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span> 
                    Automated IO Assignment
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span> 
                    Judicial Magistrate Docket Export
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span> 
                    Tamper-proof SHA-256 Seal
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 h-48 lg:h-full relative overflow-hidden bg-surface-container-high border-t lg:border-t-0 lg:border-l border-outline-variant flex items-center justify-center">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Station House Officer assisting citizen at civic intake desk." 
                  src={trackingOfficerImg}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white font-label-sm text-[11px] backdrop-blur-sm bg-primary/40 px-2.5 py-1 rounded border border-white/20">
                    Desk #3: Station House Grievance Cell
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== LOOKUP HERO CARD ==================== */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 lg:p-7 border-t-[3px] border-t-primary-container shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-title-lg text-base font-bold text-primary">Statutory Docket Search</h3>
                <p className="font-body-sm text-xs text-secondary mt-0.5">
                  Search either by online pre-registration token or registered court-sanctioned FIR ID.
                </p>
              </div>

              {/* Dual Search Input Toggle */}
              <div className="inline-flex p-1 bg-surface-container-low rounded border border-outline-variant font-label-md text-xs">
                <button 
                  type="button"
                  onClick={() => setSearchMode('fir')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    searchMode === 'fir' 
                      ? 'font-semibold bg-primary-container text-white shadow-sm' 
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Formal FIR Number
                </button>
                <button 
                  type="button"
                  onClick={() => setSearchMode('token')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    searchMode === 'token' 
                      ? 'font-semibold bg-primary-container text-white shadow-sm' 
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Citizen Complaint Token
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-9 relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-secondary pointer-events-none text-lg">search</span>
                <input 
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter formal FIR (e.g. FIR-DL-2025-4401 or CR-2025-0982)"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-xs sm:text-sm text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/15 transition-all outline-none"
                />
                {searchInput && (
                  <button 
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 text-secondary hover:text-primary p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <div className="md:col-span-3">
                <button 
                  type="button"
                  onClick={() => alert(`Tracking requested for: ${searchInput}`)}
                  className="w-full h-full py-2.5 px-5 bg-primary-container text-white font-title-md text-xs sm:text-sm rounded hover:bg-primary active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">manage_search</span>
                  <span>Track Docket</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant">
              <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider mr-2 font-semibold">
                Quick Demonstrations:
              </span>
              <button 
                type="button"
                onClick={() => handleSelectCase('fir')}
                className={`px-3 py-1 rounded border font-label-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCase === 'fir' 
                    ? 'bg-surface-container border-primary-container text-primary font-bold' 
                    : 'bg-surface-container-low hover:bg-surface-container border-outline-variant text-primary'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Sample: FIR-DL-2025-4401 (Registered)
              </button>
              <button 
                type="button"
                onClick={() => handleSelectCase('complaint')}
                className={`px-3 py-1 rounded border font-label-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedCase === 'complaint' 
                    ? 'bg-surface-container border-primary-container text-primary font-bold' 
                    : 'bg-surface-container-low hover:bg-surface-container border-outline-variant text-secondary hover:text-primary'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Sample: CR-2025-0982 (Under Review)
              </button>
            </div>
          </section>

          {/* Toast */}
          {notifySuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
              <span>Docket status link dispatched via encrypted SMS to your registered mobile number.</span>
            </div>
          )}

          {/* ==================== COMPREHENSIVE CASE DOCKET RESULTS VIEW ==================== */}
          <section className="space-y-6">
            
            {/* Status Banner */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-full font-label-sm text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold ${
                    selectedCase === 'fir'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border border-amber-300'
                  }`}>
                    <span className="material-symbols-outlined text-sm">
                      {selectedCase === 'fir' ? 'check_circle' : 'pending'}
                    </span>
                    {selectedCase === 'fir' 
                      ? 'FIR REGISTERED — UNDER ACTIVE FIELD INVESTIGATION' 
                      : '48H CYBER CELL PRELIMINARY VERIFICATION'}
                  </span>
                  <span className="text-secondary text-xs">•</span>
                  <span className="font-label-sm text-xs text-secondary bg-surface-container-low px-2.5 py-0.5 rounded border border-outline-variant font-mono">
                    {selectedCase === 'fir' ? 'CRIMINAL DOCKET #DL-4401-25' : 'NCRP REF #NCRP-881923'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-secondary font-body-sm text-xs">
                  <span className="flex items-center gap-1 text-on-surface font-medium">
                    <span className="material-symbols-outlined text-base text-primary">account_balance</span>
                    Vasant Vihar Police Station (Station Code: PS-04)
                  </span>
                  <span className="hidden sm:inline text-outline-variant">|</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">gavel</span>
                    Jurisdictional Court: Patiala House Courts Complex
                  </span>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={handleNotify}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-lowest text-primary border border-outline-variant hover:border-primary-container font-label-lg text-xs font-semibold rounded hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                  Notify Contact
                </button>
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-container text-white font-label-lg text-xs font-semibold rounded hover:bg-primary transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Certified PDF
                </button>
              </div>
            </div>

            {/* 12-Column Dossier Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT 4-COLUMNS: METADATA, OFFICERS & CITIZEN ACTIONS */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Metadata Dossier Card */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                    <span className="font-title-md text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">folder_managed</span>
                      Case Particulars
                    </span>
                    <span className="font-label-sm text-xs px-2 py-0.5 rounded bg-surface-container text-primary font-mono font-bold">
                      {selectedCase === 'fir' ? 'SEC. 379 IPC' : 'SEC. 66D IT ACT'}
                    </span>
                  </div>

                  <div className="space-y-4 font-body-sm text-xs">
                    <div>
                      <div className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Incident Category</div>
                      <div className="font-medium text-on-surface text-xs mt-0.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-secondary">
                          {selectedCase === 'fir' ? 'devices' : 'account_balance'}
                        </span>
                        {selectedCase === 'fir' ? 'Lost Property & Property Theft' : 'Cyber Financial Fraud (UPI Debit)'}
                      </div>
                    </div>

                    <div>
                      <div className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Occurrence Timestamp</div>
                      <div className="font-medium text-on-surface text-xs mt-0.5">
                        {selectedCase === 'fir' ? '18 May 2025, 18:30 IST' : 'Yesterday, 16:10 IST'}
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        {selectedCase === 'fir' ? 'Location: Market Complex, Block C, Vasant Vihar' : 'Virtual UPI Channel • Beneficiary IFSC Flagged'}
                      </div>
                    </div>

                    <div>
                      <div className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Investigating Officer (IO)</div>
                      <div className="bg-surface-container-low p-3 rounded mt-1 border border-outline-variant">
                        <div className="font-semibold text-primary">Inspector Rajesh K. Sharma</div>
                        <div className="text-[11px] text-secondary mt-0.5">Badge #DL-4412 • Field Wing Sub-Division</div>
                        <div className="text-[11px] text-on-surface font-mono mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">call</span>
                          011-26154100 (Ext. 204)
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Supervisory Oversight</div>
                      <div className="font-medium text-on-surface mt-0.5">
                        SHO V. M. Verma <span className="text-[11px] text-secondary font-normal">(Desk #3, Station House)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary-container/40 rounded border border-secondary-fixed-dim">
                      <div className="font-label-sm text-[11px] text-on-secondary-container font-semibold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">hourglass_top</span>
                        Next Procedural SLA
                      </div>
                      <div className="font-semibold text-primary mt-1">
                        {selectedCase === 'fir' ? 'Forensic Phone IMEI Dispatch' : 'Bank Lien Confirmation Receipt'}
                      </div>
                      <div className="text-[11px] text-secondary mt-0.5">
                        Court Submission Due: <span className="font-bold text-on-surface">24 May 2025</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Citizen Action & Rights Box */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
                  <h4 className="font-title-md text-sm font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg">balance</span>
                    Citizen Actions &amp; Rights
                  </h4>
                  <p className="font-body-sm text-xs text-secondary leading-relaxed">
                    As the registered complainant, you hold statutory access rights to record updates under Section 154 CrPC / 173 BNS.
                  </p>
                  <div className="space-y-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => alert('Official Case Diary excerpt requested. Dispatched to registered email.')}
                      className="w-full text-left px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded font-label-lg text-xs text-primary flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">history_edu</span>
                        Request Case Diary Update
                      </span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alert('Supplementary evidence uploader initialized.')}
                      className="w-full text-left px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded font-label-lg text-xs text-primary flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">attach_file</span>
                        Add Supplementary Evidence
                      </span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alert('Supervisory appeal form opened. Forwarded to ACP Office, South West District.')}
                      className="w-full text-left px-3.5 py-2.5 bg-surface-container-low hover:bg-error-container/30 border border-outline-variant rounded font-label-lg text-xs text-error flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">report_problem</span>
                        Raise Grievance to Supervisory SP
                      </span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Digital Seal Verification Card */}
                <div className="bg-[#f8f7f3] border-dashed border-2 border-outline-variant rounded-xl p-5 space-y-2 text-xs text-secondary font-mono">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    JUDICIAL LEDGER HASH VERIFIED
                  </div>
                  <div className="break-all text-[11px] leading-tight text-on-surface-variant">
                    SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-outline-variant/60">
                    <span>Timestamp: 19-05-2025 14:02:11</span>
                    <span className="text-emerald-700 font-bold">Valid e-Sign</span>
                  </div>
                </div>

              </div>

              {/* RIGHT 8-COLUMNS: INTERACTIVE VERTICAL TIMELINE & CHAIN OF CUSTODY */}
              <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 lg:p-8 shadow-sm space-y-8 border-t-[3px] border-t-primary-container">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant gap-2">
                  <div>
                    <h3 className="font-headline-sm text-base font-bold text-primary">Chain of Custody &amp; Investigation Milestones</h3>
                    <p className="font-body-sm text-xs text-secondary mt-0.5">Chronological audit trail of statutory actions executed under police service protocols.</p>
                  </div>
                  <span className="font-label-sm text-xs px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant text-secondary self-start sm:self-auto font-mono">
                    Stage 4 of 6 Active
                  </span>
                </div>

                {/* Vertical Timeline Component */}
                <div className="relative pl-6 sm:pl-8 space-y-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                  {/* Step 1 */}
                  <div className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div className="bg-surface-container-low/60 rounded-lg p-4 border border-outline-variant space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="font-title-md text-xs font-bold text-primary">Step 1: Complaint Lodged Online</h5>
                        <span className="font-label-sm text-[11px] text-secondary font-mono">18 May 2025, 19:15 IST</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Complainant submitted formal theft statement via Web Portal. System issued acknowledgment token <code className="text-xs bg-surface-container px-1 py-0.5 rounded font-mono">CR-2025-0982-DELHI</code>.
                      </p>
                      <div className="text-[11px] font-mono text-secondary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">fingerprint</span>
                        SHA-256 Hash Digest: 9a20...c43b
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div className="bg-surface-container-low/60 rounded-lg p-4 border border-outline-variant space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="font-title-md text-xs font-bold text-primary">Step 2: Desk Review &amp; Cognizability Verification</h5>
                        <span className="font-label-sm text-[11px] text-secondary font-mono">19 May 2025, 10:30 IST</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Station House Officer verified jurisdictional bounds and classified offense as Cognizable under Indian Penal Code provisions. Electronic approval granted for formal First Information Report conversion.
                      </p>
                      <div className="flex items-center gap-2 font-label-sm text-[11px] text-secondary pt-0.5">
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <span className="material-symbols-outlined text-xs">verified</span> Verified by SHO V. M. Verma
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div className="bg-surface-container-low/60 rounded-lg p-4 border border-outline-variant space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="font-title-md text-xs font-bold text-primary">Step 3: Statutory FIR Registered</h5>
                        <span className="font-label-sm text-[11px] text-secondary font-mono">19 May 2025, 14:00 IST</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Numbered FIR generated in State Crime Database under Section 379 IPC / Section 303(2) Bharatiya Nyaya Sanhita (BNS). Copy electronically transmitted to the Metropolitan Magistrate.
                      </p>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold">
                        Docket ID: FIR-DL-2025-4401
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Active Stage */}
                  <div className="relative group">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center ring-4 ring-amber-300 shadow-md">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-5 border-2 border-primary-container shadow-sm space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            In Progress
                          </span>
                          <h5 className="font-title-lg text-sm font-bold text-primary">
                            Step 4: Investigating Officer Assigned &amp; Field Inspection
                          </h5>
                        </div>
                        <span className="font-label-sm text-xs text-primary font-mono font-bold">20 May 2025, 09:00 IST</span>
                      </div>
                      <p className="font-body-md text-xs sm:text-sm text-on-surface leading-relaxed">
                        Inspector Rajesh K. Sharma appointed as lead IO. Crime scene survey at Vasant Vihar Market initiated; request sent to commercial establishments for CCTV footage retrieval between 18:00 and 19:00 IST.
                      </p>
                      <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-primary">Current Action:</span> Technical CDR / Tower Dump analysis requested from Cyber Cell.
                        </div>
                        <span className="font-mono text-secondary text-[11px]">Updated 2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Pending */}
                  <div className="relative group opacity-65">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-surface-container-highest border border-outline text-secondary flex items-center justify-center ring-4 ring-white">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    </div>
                    <div className="bg-surface-container-low/30 rounded-lg p-4 border border-outline-variant space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="font-title-md text-xs font-bold text-secondary">Step 5: Evidence Examination &amp; Witness Statement</h5>
                        <span className="font-label-sm text-[11px] text-secondary font-mono">Pending Dispatch</span>
                      </div>
                      <p className="font-body-sm text-xs text-secondary">
                        Collection of formal statements under Section 161 CrPC / Section 180 BNS and recovery memo generation. Scheduled upon IMEI CDR disclosure.
                      </p>
                    </div>
                  </div>

                  {/* Step 6: Charge Sheet */}
                  <div className="relative group opacity-65">
                    <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-surface-container-highest border border-outline text-secondary flex items-center justify-center ring-4 ring-white">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    </div>
                    <div className="bg-surface-container-low/30 rounded-lg p-4 border border-outline-variant space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h5 className="font-title-md text-xs font-bold text-secondary">Step 6: Final Charge Sheet / Judicial Closure Report</h5>
                        <span className="font-label-sm text-[11px] text-secondary font-mono">Statutory SLA: 60 Days</span>
                      </div>
                      <p className="font-body-sm text-xs text-secondary">
                        Submission of Police Final Form to the Competent Magistrate Court for framing of judicial charges or case culmination.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Judicial SLA Tracker Progress Bar */}
                <div className="pt-4 border-t border-outline-variant space-y-2">
                  <div className="flex items-center justify-between text-xs font-label-md">
                    <span className="text-secondary font-semibold uppercase tracking-wider">Statutory Investigation Window Elapsed</span>
                    <span className="font-mono text-primary font-bold">Day 3 of 60 (5% Elapsed)</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full" style={{ width: '5%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-secondary">
                    <span>FIR Inception: 19 May 2025</span>
                    <span>Mandatory Court Status Due: 18 July 2025</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default LiveTrackingPage;
