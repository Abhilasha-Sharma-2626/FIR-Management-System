import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';

export function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'
  const [activeSidebarNav, setActiveSidebarNav] = useState('dockets');
  const [ioMessage, setIoMessage] = useState('');
  const [ioMessageSent, setIoMessageSent] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Live portal clock simulation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() + 
        ' ' + 
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + 
        ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendIoMessage = (e) => {
    e.preventDefault();
    if (!ioMessage.trim()) return;
    setIoMessageSent(true);
    setIoMessage('');
    setTimeout(() => setIoMessageSent(false), 3500);
  };

  // Citizen displayName and avatar initials
  const displayName = user?.fullName || 'Ramesh Kumar Sundaram';
  const displayEmail = user?.email || 'citizen.ramesh@casesync.gov.in';
  const citizenId = user?.userId ? `CIT-${user.userId.toUpperCase()}` : 'CIT-DEL-984210';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'RK';

  return (
    <div className="min-h-screen flex bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      
      {/* ========================================================================= */}
      {/* 1. LEFT NAVIGATION SIDEBAR                                                */}
      {/* ========================================================================= */}
      <DashboardSidebar activeNav="dockets" />

      {/* ========================================================================= */}
      {/* 2. MAIN APPLICATION CONTENT AREA                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP MINIMAL UTILITY BAR */}
        <header className="w-full bg-surface-container-lowest text-on-surface top-0 sticky z-30 shadow-sm border-b border-outline-variant px-6 py-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Breadcrumb Navigation & Portal Scope */}
            <div className="flex items-center gap-2 text-xs">
              <Link to="/" className="text-secondary font-medium hover:text-primary transition-colors">Home</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-secondary font-medium">Citizen Statutory Services</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-bold">Active Dossier &amp; Case Management</span>
            </div>

            {/* Center Search */}
            <div className="flex flex-1 max-w-xl mx-0 md:mx-4 items-center">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-sm">search</span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FIR dockets, complaint reference, or IO name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Utility Cluster */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Statutory Clock */}
              <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Portal Clock: <strong className="text-on-surface">{currentTime || '24-MAY-2025 14:45 IST'}</strong></span>
              </div>

              {/* Language Switcher */}
              <button 
                type="button" 
                className="flex items-center gap-1 px-2 py-1 rounded border border-outline-variant hover:bg-surface-container-low text-secondary text-xs font-medium transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">language</span>
                <span className="font-label-sm">EN / हिन्दी</span>
              </button>

              {/* Notification Bell with Counter */}
              <button 
                type="button"
                onClick={() => setShowNotificationModal(!showNotificationModal)}
                className="relative w-8 h-8 rounded-lg border border-outline-variant flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
                title="Statutory Notifications"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  3
                </span>
              </button>

              {/* Back to Public Home */}
              <Link 
                to="/"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-primary text-xs font-semibold hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Public Site
              </Link>
            </div>

          </div>
        </header>

        {/* Notifications Drawer Modal if open */}
        {showNotificationModal && (
          <div className="bg-surface-container-lowest border-b border-outline-variant p-4 shadow-md px-6 lg:px-8 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <span className="font-title-md text-xs font-bold text-primary">Statutory Case Notifications (3)</span>
              <button type="button" onClick={() => setShowNotificationModal(false)} className="text-secondary text-xs hover:text-primary">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/60">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Notice Transmitted</span>
                <p className="font-semibold text-primary">IO Dispatched to Sector 4 Community Centre</p>
                <span className="text-[10px] text-secondary">Today, 11:30 AM</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/60">
                <span className="text-[10px] text-amber-700 font-bold uppercase">48h Verification</span>
                <p className="font-semibold text-primary">Cyber Fraud Bank Lien Request Forwarded</p>
                <span className="text-[10px] text-secondary">Yesterday, 16:10 IST</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/60">
                <span className="text-[10px] text-error font-bold uppercase">Court Summons</span>
                <p className="font-semibold text-primary">Witness Hearing Scheduled for 28-May-2025</p>
                <span className="text-[10px] text-secondary">Metropolitan Court #4</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN DOSSIER WORKSPACE CANVAS */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* 1. CITIZEN GREETING & VERIFIED RESIDENCE STATUS BANNER */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm border-t-[3px] border-t-primary-container flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-lg text-2xl font-bold text-primary">
                  Namaste, {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold border border-outline-variant">
                  <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">verified_user</span>
                  DigiLocker Tier-1 Identity Sealed
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-container-low text-secondary px-2 py-0.5 rounded-full text-[11px] font-medium border border-outline-variant">
                  <span className="material-symbols-outlined text-xs">sync</span>
                  Synced 10m ago
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-body-sm text-xs text-secondary">
                <span className="flex items-center gap-1 text-on-surface">
                  <span className="material-symbols-outlined text-sm text-primary">location_city</span>
                  Jurisdiction: <strong className="text-primary font-semibold">Vasant Vihar Police Station</strong> (South West District, New Delhi)
                </span>
                <span className="text-outline-variant">•</span>
                <span>Station Code: <strong className="font-mono text-on-surface">PS-DL-SW-04</strong></span>
                <span className="text-outline-variant">•</span>
                <span>Aadhaar Virtual ID Linked: <strong className="font-mono text-on-surface">•••• •••• 9812</strong></span>
              </div>
            </div>

            {/* Primary CTA Action Cluster */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link 
                to="/file-complaint"
                className="inline-flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded text-xs font-semibold hover:bg-primary transition-all shadow-sm active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>+ Lodge New e-FIR / Complaint</span>
              </Link>
              <Link 
                to="/services"
                className="inline-flex items-center gap-1.5 bg-surface-container-lowest text-primary border border-outline-variant px-3.5 py-2 rounded text-xs font-medium hover:bg-surface-container-low hover:border-secondary transition-all"
              >
                <span className="material-symbols-outlined text-base text-secondary">search</span>
                <span>Track Another Docket</span>
              </Link>
              <Link 
                to="/services"
                className="inline-flex items-center gap-1.5 bg-surface-container-lowest text-primary border border-outline-variant px-3.5 py-2 rounded text-xs font-medium hover:bg-surface-container-low hover:border-secondary transition-all"
              >
                <span className="material-symbols-outlined text-base text-secondary">calendar_month</span>
                <span>Book Station Desk</span>
              </Link>
            </div>
          </section>

          {/* 2. EXECUTIVE METRIC KPI CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Active Complaints */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">Complaints In-Progress</p>
                  <h3 className="font-headline-lg text-2xl text-primary mt-1 font-bold">02</h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">pending_actions</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-variant flex items-center justify-between text-xs">
                <span className="text-secondary">BNSS Sec. 173 Preliminary Inquiries</span>
                <span className="font-semibold text-primary">2 Active</span>
              </div>
            </div>

            {/* KPI 2: Formally Registered FIRs */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">Registered e-FIRs</p>
                  <h3 className="font-headline-lg text-2xl text-primary mt-1 font-bold">01</h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">local_police</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-variant flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Field Investigation On-Site
                </span>
                <span className="font-mono text-xs font-semibold text-primary">#FIR-4401</span>
              </div>
            </div>

            {/* KPI 3: Disposed / Closed Dockets */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">Disposed / Resolved</p>
                  <h3 className="font-headline-lg text-2xl text-primary mt-1 font-bold">03</h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-variant flex items-center justify-between text-xs">
                <span className="text-secondary">With Certified Digital Slips</span>
                <Link className="font-semibold text-primary hover:underline" to="/services">Download Slips →</Link>
              </div>
            </div>

            {/* KPI 4: Court Summons & Notices */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between ring-1 ring-tertiary-fixed-dim/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-label-sm text-[11px] uppercase tracking-wider text-error font-bold">Action Notice</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  </div>
                  <h3 className="font-headline-lg text-2xl text-primary mt-1 font-bold">01 Hearing</h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">gavel</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-surface-variant text-xs">
                <p className="text-on-surface font-medium truncate">Metropolitan Court #4, Patiala House</p>
                <p className="text-[11px] text-secondary font-mono mt-0.5">28 May 2025 • 11:00 AM IST</p>
              </div>
            </div>
          </section>

          {/* 3. MAIN DOSSIER SPLIT: 8-COLUMN CASE CANVAS + 4-COLUMN ASSISTANCE RAIL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT / CENTER CANVAS: ACTIVE DOCKETS & INVESTIGATION TRACKER (8 COLS) */}
            <div className="lg:col-span-8 space-y-6" id="dockets">
              
              {/* Tab Bar for Dockets */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className={`px-3.5 py-1.5 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'active' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    Active Cases &amp; Live Tracker (2)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('archive')}
                    className={`px-3.5 py-1.5 rounded-lg font-label-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'archive' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-secondary hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">history</span>
                    Resolved Archive (3)
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-secondary pr-2">
                  <span className="material-symbols-outlined text-sm text-primary">filter_list</span>
                  Sort: Most Recent First
                </div>
              </div>

              {activeTab === 'active' ? (
                <>
                  {/* MAJOR CARD 1: FORMAL REGISTERED FIR (#FIR-DL-2025-4401) */}
                  <article className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden border-t-[3px] border-t-primary-container" id="live-tracking">
                    {/* Dossier Header */}
                    <div className="p-5 bg-surface-container-low/40 border-b border-outline-variant">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-primary">#FIR-DL-2025-4401</span>
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                              Under Active Field Investigation
                            </span>
                            <span className="bg-surface-container text-primary text-xs px-2 py-0.5 rounded font-mono font-medium">
                              SLA Day 4 of 60
                            </span>
                          </div>
                          <h2 className="font-title-lg text-base font-bold text-primary mt-1.5">
                            Theft &amp; Housebreaking under BNS Sec. 380 / 457
                          </h2>
                          <p className="font-body-sm text-xs text-secondary mt-0.5">
                            Reported at: Sector 4 Residential Enclave, Vasant Vihar • Occurrence Date: 20-May-2025, 03:15 AM
                          </p>
                        </div>
                        <div className="shrink-0 flex sm:flex-col items-end gap-0.5">
                          <span className="text-[11px] text-secondary font-label-sm uppercase">Cognizance Judicial Bench</span>
                          <span className="text-xs font-semibold text-primary font-mono">Patiala House Judicial Court</span>
                        </div>
                      </div>

                      {/* Metadata Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-outline-variant/50 text-xs">
                        <div>
                          <p className="text-secondary font-label-sm uppercase text-[11px]">Police Station</p>
                          <p className="font-semibold text-primary mt-0.5">Vasant Vihar PS (SW)</p>
                        </div>
                        <div>
                          <p className="text-secondary font-label-sm uppercase text-[11px]">Investigating Officer (IO)</p>
                          <p className="font-semibold text-primary mt-0.5">Insp. Rajesh K. Sharma</p>
                          <span className="text-[10px] text-secondary font-mono">Badge #DL-4412</span>
                        </div>
                        <div>
                          <p className="text-secondary font-label-sm uppercase text-[11px]">Official Contact</p>
                          <p className="font-mono font-semibold text-primary mt-0.5">+91 11-26154100</p>
                        </div>
                        <div>
                          <p className="text-secondary font-label-sm uppercase text-[11px]">Cryptographic Audit ID</p>
                          <p className="font-mono text-secondary truncate mt-0.5">SHA256: 8f9b...a371e</p>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time 5-Stage Investigation Tracker */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-title-md text-sm font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-primary">route</span>
                          Statutory Milestone Progress Tracker
                        </h4>
                        <span className="text-xs text-secondary">Updated: Today at 11:30 AM by Station IO</span>
                      </div>

                      {/* Stages Desktop Flow */}
                      <div className="relative py-2">
                        <div className="absolute top-6 left-6 right-6 h-1 bg-outline-variant/60 -z-0 hidden md:block">
                          <div className="h-full bg-primary" style={{ width: '72%' }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                          {/* Stage 1 */}
                          <div className="flex md:flex-col items-start md:items-center gap-2.5 md:text-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white shrink-0">
                              <span className="material-symbols-outlined text-base">check</span>
                            </div>
                            <div>
                              <p className="font-title-md text-xs font-semibold text-primary">1. Lodged</p>
                              <p className="text-[11px] text-secondary mt-0.5">20 May, 09:20 AM</p>
                              <span className="inline-block text-[9px] bg-surface-container-high px-1 py-0.2 rounded font-mono text-primary mt-0.5">Verified OTP</span>
                            </div>
                          </div>

                          {/* Stage 2 */}
                          <div className="flex md:flex-col items-start md:items-center gap-2.5 md:text-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white shrink-0">
                              <span className="material-symbols-outlined text-base">check</span>
                            </div>
                            <div>
                              <p className="font-title-md text-xs font-semibold text-primary">2. Desk Endorsed</p>
                              <p className="text-[11px] text-secondary mt-0.5">20 May, 12:45 PM</p>
                              <span className="inline-block text-[9px] bg-surface-container-high px-1 py-0.2 rounded font-mono text-primary mt-0.5">SHO Clearance</span>
                            </div>
                          </div>

                          {/* Stage 3 */}
                          <div className="flex md:flex-col items-start md:items-center gap-2.5 md:text-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white shrink-0">
                              <span className="material-symbols-outlined text-base">check</span>
                            </div>
                            <div>
                              <p className="font-title-md text-xs font-semibold text-primary">3. FIR Registered</p>
                              <p className="text-[11px] text-secondary mt-0.5">21 May, 08:30 AM</p>
                              <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono font-medium mt-0.5">Court Transmitted</span>
                            </div>
                          </div>

                          {/* Stage 4: ACTIVE */}
                          <div className="flex md:flex-col items-start md:items-center gap-2.5 md:text-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-surface-container-high shrink-0 animate-pulse">
                              <span className="material-symbols-outlined text-base">search</span>
                            </div>
                            <div>
                              <p className="font-title-md text-xs font-bold text-primary">4. Forensic &amp; Survey</p>
                              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">IN PROGRESS</p>
                              <span className="inline-block text-[9px] bg-tertiary-fixed text-on-tertiary-fixed px-1 py-0.2 rounded font-medium mt-0.5">Evidence Logged</span>
                            </div>
                          </div>

                          {/* Stage 5: Pending */}
                          <div className="flex md:flex-col items-start md:items-center gap-2.5 md:text-center opacity-60">
                            <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant text-secondary flex items-center justify-center font-bold text-xs ring-4 ring-white shrink-0">
                              5
                            </div>
                            <div>
                              <p className="font-title-md text-xs font-medium text-secondary">5. Charge Sheet</p>
                              <p className="text-[11px] text-secondary mt-0.5">Pending IO Filing</p>
                              <span className="inline-block text-[9px] text-secondary mt-0.5">Due in 56 days</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current Stage Live Status Callout */}
                      <div className="mt-5 bg-surface-container-low rounded-lg p-3.5 border border-outline-variant/60 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-label-sm uppercase font-bold text-primary">Current Officer Dispatch Note (24-May-2025)</p>
                          <p className="text-xs text-on-surface">
                            &ldquo;Station Forensic Team analyzed physical entry points. CCTV footage from Enclave Sector 4 Main Gate retrieved successfully. Mobile Call Detail Record (CDR) dump logs requisitioned from telecom nodal officer.&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Action Toolbar for this Major FIR */}
                      <div className="mt-5 pt-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Download Certified QR FIR Copy</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => alert('Evidence upload dialog: Select CCTV MP4 or JPEG for Case #FIR-DL-2025-4401.')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">upload_file</span>
                            <span>Upload Supplementary Footage</span>
                          </button>
                          <a 
                            href="#vault"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span>Direct Message IO</span>
                          </a>
                        </div>
                        <button 
                          type="button"
                          onClick={() => alert('Supervisory appeal form opened. Forwarding complaint directly to ACP Office, South West District.')}
                          className="inline-flex items-center gap-1 text-xs text-error font-medium hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">flag</span>
                          <span>Raise Supervisory Grievance to ACP</span>
                        </button>
                      </div>

                    </div>
                  </article>

                  {/* SECONDARY DOCKET CARD: CYBER COMPLAINT */}
                  <article className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-5 hover:border-secondary transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary">#CR-2025-0982</span>
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            48h Cyber Cell Preliminary Verification
                          </span>
                          <span className="text-[11px] text-secondary font-mono">Acknowledged: Yesterday 16:10 IST</span>
                        </div>
                        <h3 className="font-title-lg text-sm font-bold text-primary">
                          Cyber Financial Fraud: Unauthorized UPI Transaction (₹42,500)
                        </h3>
                        <p className="font-body-sm text-xs text-secondary">
                          Mapped Unit: Delhi Police Cyber Crime Cell, South West Special Branch • Requisition ref to Beneficiary Bank (HDFC Bank IFSC) dispatched.
                        </p>
                      </div>
                      <div className="shrink-0">
                        <button 
                          type="button"
                          onClick={() => alert('Beneficiary bank freeze lien request: Ref #LIEN-DEL-9842 verified active under NCRP.')}
                          className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container hover:border-primary transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                          <span>Check Bank Lien / Freeze Status</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-surface-variant flex items-center justify-between text-xs text-secondary">
                      <span>National Cyber Crime Reporting Portal (NCRP) Synchronized: #NCRP-881923</span>
                      <Link to="/services" className="font-semibold text-primary hover:underline flex items-center gap-1">
                        View Digital Chain of Custody →
                      </Link>
                    </div>
                  </article>
                </>
              ) : (
                /* ARCHIVED COMPLAINTS VIEW */
                <div className="space-y-4">
                  {[
                    { id: '#CR-2024-8812', title: 'Lost Mobile Device (OnePlus 11)', date: '14-Nov-2024', status: 'Disposed / Lost Article Certificate Issued' },
                    { id: '#FIR-DL-2024-2109', title: 'Bicycle Theft from Enclave Gate', date: '02-Aug-2024', status: 'Chargesheet Submitted • Court Final Order' },
                    { id: '#CR-2024-0418', title: 'Identity Misuse Inquiry Report', date: '19-Jan-2024', status: 'Certified Non-Involvement Slip Issued' }
                  ].map((arch) => (
                    <div key={arch.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary">{arch.id}</span>
                        <h4 className="font-title-md text-xs font-bold text-primary mt-0.5">{arch.title}</h4>
                        <p className="text-[11px] text-secondary">Disposed on {arch.date} • {arch.status}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded bg-surface-container border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-variant cursor-pointer"
                      >
                        Download PDF Slip
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. INTEGRATED CITIZEN JURISDICTION & STATION ASSISTANCE WIDGET */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm" id="jurisdiction">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-outline-variant pb-3.5 mb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">apartment</span>
                      <h3 className="font-title-lg text-sm font-bold text-primary">
                        Your Mapped Police Station &amp; Jurisdiction Directory
                      </h3>
                    </div>
                    <p className="font-body-sm text-xs text-secondary mt-0.5">
                      Automated geospatial link based on your verified residence: Sector 4, Vasant Vihar, New Delhi
                    </p>
                  </div>
                  <span className="bg-surface-container text-primary font-mono text-xs px-2.5 py-0.5 rounded font-semibold self-start sm:self-auto">
                    Distance: 0.8 km
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Station Details */}
                  <div className="space-y-2.5">
                    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60">
                      <p className="font-label-sm text-[11px] uppercase font-bold text-secondary">Station House Officer (SHO)</p>
                      <p className="font-title-md text-xs font-bold text-primary mt-0.5">Inspector Rajesh K. Sharma</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs">
                        <a className="flex items-center gap-1 text-primary font-semibold hover:underline" href="tel:01126154100">
                          <span className="material-symbols-outlined text-sm">call</span>
                          011-26154100
                        </a>
                        <span className="text-secondary font-mono text-[11px]">Duty Desk Line</span>
                      </div>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/60">
                      <p className="font-label-sm text-[11px] uppercase font-bold text-secondary">Dedicated Women Help Desk Officer</p>
                      <p className="font-title-md text-xs font-bold text-primary mt-0.5">Sub-Inspector Anjali Mehra</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs">
                        <a className="flex items-center gap-1 text-primary font-semibold hover:underline" href="tel:01126154108">
                          <span className="material-symbols-outlined text-sm">call</span>
                          011-26154108
                        </a>
                        <span className="text-secondary font-mono text-[11px]">24x7 Direct Ext.</span>
                      </div>
                    </div>
                  </div>

                  {/* Jurisdiction Map & Protocol Actions */}
                  <div className="flex flex-col justify-between p-3.5 bg-surface-container-low/40 rounded-lg border border-outline-variant/60">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-[11px] uppercase font-bold text-primary">Station Address &amp; Beat Boundaries</span>
                        <span className="text-[11px] text-secondary font-mono">Beat No. 03</span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        Vasant Vihar Police Station, Poorvi Marg, Block C, Vasant Vihar, New Delhi, Delhi 110057.
                        Jurisdiction covers: Basant Lok, Enclave Sector 1-5, and Munirka Enclave Marg.
                      </p>
                    </div>

                    <div className="pt-3 flex flex-wrap gap-2">
                      <button 
                        type="button"
                        onClick={() => alert('Beat No. 03 Patrol Route: Beat Constable HC Manoj Kumar (Mobile: +91 98110 44291).')}
                        className="px-2.5 py-1.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">map</span>
                        View Beat Boundary Map
                      </button>
                      <Link 
                        to="/file-complaint"
                        className="px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">swap_horiz</span>
                        Report Zero-FIR Transfer
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* RIGHT SIDEBAR RAIL: CITIZEN LIAISON, SUMMONS & IDENTITY VAULT (4 COLS) */}
            <aside className="lg:col-span-4 space-y-5" id="vault">
              
              {/* 1. INVESTIGATING OFFICER (IO) DIRECT LIAISON BOX */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">forum</span>
                    <h4 className="font-title-md text-sm font-bold text-primary">IO Quick Liaison</h4>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="IO On-Duty Status"></span>
                </div>

                <div className="mt-3 space-y-2.5">
                  <p className="text-xs text-secondary">
                    Direct official channel to submitted inquiry notes for Case <strong>#FIR-DL-2025-4401</strong>. Every submission is digitally logged in the case diary.
                  </p>

                  {ioMessageSent ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-300">
                      ✓ Note transmitted directly to IO Insp. Rajesh Sharma&apos;s station terminal.
                    </div>
                  ) : (
                    <form onSubmit={handleSendIoMessage} className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1" htmlFor="io-note">
                          Submit Additional Statement / Clarification:
                        </label>
                        <textarea 
                          id="io-note"
                          rows={3}
                          value={ioMessage}
                          onChange={(e) => setIoMessage(e.target.value)}
                          placeholder="Type clarification, serial number of lost asset, or witness reference..."
                          className="w-full text-xs rounded border border-outline-variant bg-surface-container-lowest p-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="text-xs text-secondary hover:text-primary flex items-center gap-1 font-medium cursor-pointer">
                          <input type="file" className="hidden" onChange={() => alert('Evidence file attached for IO.')} />
                          <span className="material-symbols-outlined text-sm">attachment</span>
                          Attach PDF / JPEG
                        </label>
                        <button 
                          type="submit"
                          className="px-3 py-1.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                        >
                          Transmit to IO
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* 2. COURT SUMMONS & STATUTORY DEADLINE CALENDAR SNAPSHOT */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm" id="summons">
                <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">event_available</span>
                    <h4 className="font-title-md text-sm font-bold text-primary">Court &amp; Legal Notices</h4>
                  </div>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-primary">1 Active</span>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-error uppercase tracking-wider font-label-sm">Mandatory Witness Summons</span>
                        <h5 className="text-xs font-bold text-primary mt-0.5">Court of Metropolitan Magistrate-04</h5>
                      </div>
                      <span className="material-symbols-outlined text-error text-base">notification_important</span>
                    </div>
                    <p className="text-xs text-secondary mt-1">Patiala House District Courts Complex, New Delhi</p>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono font-bold text-primary bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/60">
                      <span>DATE: 28-MAY-2025</span>
                      <span>TIME: 11:00 AM</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <button 
                        type="button"
                        onClick={() => window.print()}
                        className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Digital Notice
                      </button>
                      <button 
                        type="button"
                        onClick={() => alert('Court e-Pass generated: EPASS-PAT-9842. Show at Patiala House Gate 2.')}
                        className="text-secondary hover:underline cursor-pointer"
                      >
                        Download e-Pass
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DIGILOCKER & IDENTITY CREDENTIALS */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">badge</span>
                    <h4 className="font-title-md text-sm font-bold text-primary">Identity &amp; Credentials</h4>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    100% Certified
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low border border-outline-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">fingerprint</span>
                      <div>
                        <p className="font-semibold text-primary">Aadhaar (UIDAI Virtual)</p>
                        <p className="text-[10px] text-secondary font-mono">Auth: Biometric Level-2</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low border border-outline-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">directions_car</span>
                      <div>
                        <p className="font-semibold text-primary">Driving Licence (DL)</p>
                        <p className="text-[10px] text-secondary font-mono">DL-0420180091823</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low border border-outline-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">home</span>
                      <div>
                        <p className="font-semibold text-primary">Residential Proof</p>
                        <p className="text-[10px] text-secondary">Vasant Vihar Registered</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-sm">verified</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-outline-variant text-center">
                  <Link to="/services" className="text-xs font-semibold text-primary hover:underline">
                    Manage DigiLocker Data Permissions →
                  </Link>
                </div>
              </div>

              {/* 4. 24x7 EMERGENCY & CYBER FRAUD HELPLINES */}
              <div className="bg-primary text-white rounded-xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-title-md text-sm font-bold text-surface-container-lowest">Citizen Helplines</h4>
                  <span className="material-symbols-outlined text-tertiary-fixed text-lg">headset_mic</span>
                </div>
                <p className="text-xs text-outline-variant">Immediate statutory assistance for emergencies and monetary wire freezes.</p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <a className="p-2 rounded bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 transition-colors border border-outline-variant/30 flex flex-col items-center text-center" href="tel:112">
                    <span className="text-[11px] font-bold text-surface-container-lowest">Police Emergency</span>
                    <span className="text-lg font-headline-md font-bold text-tertiary-fixed mt-0.5">112</span>
                    <span className="text-[9px] text-outline-variant">Toll Free 24/7</span>
                  </a>
                  <a className="p-2 rounded bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 transition-colors border border-outline-variant/30 flex flex-col items-center text-center" href="tel:1930">
                    <span className="text-[11px] font-bold text-surface-container-lowest">Cyber Financial</span>
                    <span className="text-lg font-headline-md font-bold text-tertiary-fixed mt-0.5">1930</span>
                    <span className="text-[9px] text-outline-variant">Fund Freeze Desk</span>
                  </a>
                </div>
              </div>

            </aside>

          </div>
        </main>

        {/* REFINED COMPACT CIVIC FOOTER */}
        <footer className="w-full bg-surface-container-lowest text-primary border-t border-outline-variant mt-12 py-6 px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-center md:text-left">
              <p className="font-semibold text-primary">CaseSync • Ministry of Home Affairs, Government of India</p>
              <p className="text-secondary mt-0.5">Academic Demonstration Prototype under Statutory Governance Framework (BNSS Sec. 173).</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-secondary">
              <Link className="hover:text-primary transition-colors underline decoration-secondary/50 underline-offset-2" to="/how-it-works">
                Statutory Guidelines
              </Link>
              <Link className="hover:text-primary transition-colors underline decoration-secondary/50 underline-offset-2" to="/services">
                Public Disclosure Log
              </Link>
              <Link className="hover:text-primary transition-colors underline decoration-secondary/50 underline-offset-2" to="/services">
                Digital Chain of Custody
              </Link>
              <Link className="hover:text-primary transition-colors underline decoration-secondary/50 underline-offset-2" to="/#faq">
                Privacy Charter
              </Link>
              <a className="text-primary font-semibold hover:underline" href="tel:112">
                Helpline 112
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default DashboardPage;
