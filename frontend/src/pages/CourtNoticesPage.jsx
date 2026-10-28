import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';

export function CourtNoticesPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived' | 'rights'
  const [acknowledged, setAcknowledged] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showVcModal, setShowVcModal] = useState(false);
  const [vcRequested, setVcRequested] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(true);
  };

  const handleVcSubmit = (e) => {
    e.preventDefault();
    setVcRequested(true);
    setTimeout(() => {
      setShowVcModal(false);
      alert('Virtual Hearing Application transmitted to Metropolitan Magistrate Bench Registry.');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="summons" />

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
            <span className="text-primary font-bold">Court Notices &amp; Judicial Summons</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none"></span>
              <span>Inter-Operable Criminal Justice System (ICJS) Live Relay</span>
            </div>
            <Link
              to="/dashboard/live-tracking"
              className="px-3.5 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">timeline</span>
              <span>Track Linked FIR</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Court &amp; Legal Notices
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-variant text-on-secondary-fixed-variant rounded border border-outline-variant/70 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px]">gavel</span>
                  <span>Statutory Judicial Summons Registry</span>
                </span>
              </div>
              <p className="font-body-md text-xs sm:text-sm text-secondary max-w-3xl">
                Official summons, witness appearance warrants, and investigative enquiry notices issued under Section 64 &amp; Section 193 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPassModal(true)}
                className="px-4 py-2.5 bg-surface-container-lowest border border-outline-variant text-primary font-title-md text-xs rounded-lg hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden transition-colors flex items-center gap-2 shadow-sm font-semibold whitespace-nowrap cursor-pointer active:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-base text-primary">badge</span>
                <span>Generate Digital Court Entry Pass</span>
              </button>
            </div>
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-error/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
              <div className="flex items-center justify-between text-secondary pl-1">
                <span className="text-[11px] font-bold text-error">Mandatory Summons</span>
                <span className="material-symbols-outlined text-lg text-error">notification_important</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-error mt-1 pl-1">01 Action Due</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5 pl-1">Patiala House Courts</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Upcoming Hearing</span>
                <span className="material-symbols-outlined text-lg text-primary">event</span>
              </div>
              <p className="font-headline-md text-xl font-bold text-primary mt-1 font-mono">28 May 2025</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">11:00 AM IST • Court #4</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Service Status</span>
                <span className="material-symbols-outlined text-lg text-emerald-600">verified</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-emerald-700 mt-1">
                {acknowledged ? 'e-Acknowledged' : 'Pending Receipt'}
              </p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">BNSS Sec. 64 Digital Attestation</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Legal Aid Entitlement</span>
                <span className="material-symbols-outlined text-lg text-primary">balance</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">Free DLSA Aid</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">State Legal Counsel Assigned</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-outline-variant flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Active Mandatory Notices</span>
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-mono">01</span>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'archived'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Disposed &amp; Complied Notices</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-mono">02</span>
            </button>
            <button
              onClick={() => setActiveTab('rights')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'rights'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Citizen Rights &amp; BNSS Advisory</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: ACTIVE NOTICES                                                 */}
          {/* ===================================================================== */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              
              {/* Mandatory Notice Primary Card */}
              <div className="bg-surface-container-lowest rounded-2xl border-2 border-primary/20 shadow-md overflow-hidden">
                {/* Notice Top Banner */}
                <div className="bg-primary text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-error/90 flex items-center justify-center text-white shrink-0 shadow">
                      <span className="material-symbols-outlined text-2xl">gavel</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-error/80 text-white">
                          Mandatory Witness Summons
                        </span>
                        <span className="text-[11px] text-tertiary-fixed">
                          Form No. 1 (Second Schedule BNSS)
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-lg font-bold text-white mt-0.5">
                        Court of Metropolitan Magistrate-04, Patiala House Courts
                      </h2>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-300">
                    <p className="text-white font-bold">Summons ID: <span className="font-mono">SUM-2025-MM04-0988</span></p>
                    <p className="text-[11px] text-slate-400">Issued: 21 May 2025</p>
                  </div>
                </div>

                {/* Notice Body */}
                <div className="p-6 space-y-6">
                  {/* Grid details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs">
                    <div>
                      <span className="text-secondary font-medium">Associated Case / Docket:</span>
                      <p className="font-mono font-bold text-primary text-sm mt-0.5">#FIR-DL-2025-4401</p>
                      <p className="text-[11px] text-secondary">Theft &amp; Housebreaking (PS Vasant Vihar)</p>
                    </div>

                    <div>
                      <span className="text-secondary font-medium">Hearing Schedule:</span>
                      <p className="font-mono font-bold text-primary text-sm mt-0.5">28 May 2025 • 11:00 AM</p>
                      <p className="text-[11px] text-secondary">Courtroom #04, 1st Floor, Patiala House</p>
                    </div>

                    <div>
                      <span className="text-secondary font-medium">Presiding Judicial Officer:</span>
                      <p className="font-bold text-primary text-sm mt-0.5">Dr. Shailendra Mishra, DHJS</p>
                      <p className="text-[11px] text-secondary">Metropolitan Magistrate Bench</p>
                    </div>
                  </div>

                  {/* Legal Text / Purpose */}
                  <div className="space-y-2 text-xs text-on-surface leading-relaxed">
                    <h4 className="font-title-md text-sm font-bold text-primary">Purpose of Summons:</h4>
                    <p className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-secondary">
                      "Whereas complaint has been made before this Court that the offenses punishable under Section 380 / 457 BNS have been committed; and it appears to this Court that you are likely to give material evidence for the Prosecution and produce physical custody logs of stolen property. You are hereby required to appear before this Court at Patiala House District Courts on 28th Day of May, 2025 at 11:00 AM to testify what you know concerning the said offense."
                    </p>
                  </div>

                  {/* Statutory Service Status Strip */}
                  <div className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        acknowledged ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {acknowledged ? '✓' : '!'}
                      </span>
                      <div>
                        <p className="font-title-md text-xs font-bold text-primary">
                          {acknowledged ? 'Summons Service Formally Acknowledged' : 'Formal Acknowledgment of Service Pending'}
                        </p>
                        <p className="text-[11px] text-secondary">
                          {acknowledged
                            ? 'Timestamped digitally under Section 64 BNSS on 22 May 2025. Judicial Bench notified.'
                            : 'Click "Acknowledge Service" below to digitally sign legal receipt.'}
                        </p>
                      </div>
                    </div>

                    {!acknowledged ? (
                      <button
                        onClick={handleAcknowledge}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">draw</span>
                        <span>Acknowledge Service (e-Sign)</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 rounded text-xs font-bold whitespace-nowrap">
                        LEGAL RECEIPT CONFIRMED
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPassModal(true)}
                        className="px-3.5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">print</span>
                        <span>Print Official Summons &amp; QR Pass</span>
                      </button>

                      <button
                        onClick={() => setShowVcModal(true)}
                        className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        <span>Apply for Virtual Court (VC) Link</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-secondary flex items-center gap-2 font-mono">
                      <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
                      <span>Verified via Delhi High Court ICJS Node</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: ARCHIVED NOTICES                                               */}
          {/* ===================================================================== */}
          {activeTab === 'archived' && (
            <div className="space-y-4">
              {[
                {
                  id: 'SUM-2025-CYB-0412',
                  court: 'Cyber Crime Investigation Unit, Mandir Marg',
                  title: 'Notice to Produce Electronic Transaction Logs',
                  date: '14 May 2025',
                  status: 'Fully Complied & Disposed',
                  officer: 'ACP Cyber Cell New Delhi',
                  caseId: 'CR-2025-0982',
                },
                {
                  id: 'SUM-2024-NPS-8802',
                  court: 'Vasant Vihar Police Station Examination Desk',
                  title: 'Statutory Verification of Residential Lease Agreement',
                  date: '02 Jan 2025',
                  status: 'Disposed • Verified Authentic',
                  officer: 'Station House Officer (SHO)',
                  caseId: 'POL-DEL-8911',
                },
              ].map((notice) => (
                <div key={notice.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">task_alt</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{notice.id}</span>
                        <span className="text-outline-variant">•</span>
                        <span className="text-[11px] font-mono text-secondary">Case #{notice.caseId}</span>
                      </div>
                      <h3 className="font-title-md text-sm font-bold text-on-surface mt-0.5">{notice.title}</h3>
                      <p className="text-xs text-secondary">{notice.court} • Authorized by {notice.officer}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]">
                        {notice.status}
                      </span>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">Disposed: {notice.date}</p>
                    </div>
                    <button
                      onClick={() => alert(`Downloading Compliance Slip for ${notice.id}`)}
                      className="px-3 py-1.5 rounded border border-outline-variant text-xs font-semibold hover:bg-surface-container text-primary"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: CITIZEN RIGHTS & BNSS ADVISORY                                 */}
          {/* ===================================================================== */}
          {activeTab === 'rights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-2xl">shield_person</span>
                  <h3 className="font-headline-sm text-base font-bold">Witness Protections under BNSS, 2023</h3>
                </div>
                <div className="space-y-3 text-xs text-secondary leading-relaxed">
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                    <h4 className="font-bold text-primary mb-0.5">Section 64: Electronic Service Integrity</h4>
                    <p>Summons transmitted via registered portal or encrypted SMS are deemed legally served. Acknowledgment can be done remotely without physical police visit.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                    <h4 className="font-bold text-primary mb-0.5">Section 180: Statement Deposition Protections</h4>
                    <p>No witness shall be subjected to undue intimidation or coercion. Audio-video deposition can be requested by women, elderly, and medical cases.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
                    <h4 className="font-bold text-primary mb-0.5">Witness Conveyance Allowance</h4>
                    <p>Government of NCT rules mandate standard travel allowance reimbursement for attending court appearances upon filing court attendance slips.</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-2xl">balance</span>
                  <h3 className="font-headline-sm text-base font-bold">Free Legal Aid &amp; Representation</h3>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  If you require an advocate or legal representation before the Metropolitan Magistrate and cannot afford private counsel, the Delhi State Legal Services Authority (DLSA) provides experienced state counsels free of charge.
                </p>
                <div className="p-4 rounded-xl bg-primary text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-tertiary-fixed">DLSA Helpline (24×7)</span>
                    <span className="font-mono text-sm font-bold text-white">1516</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Direct judicial assistance for witness protection, victim compensation scheme (VCS), and legal advice.
                  </p>
                </div>
                <button
                  onClick={() => alert('Opening DLSA Free Legal Aid application portal...')}
                  className="w-full py-2.5 rounded-lg border border-primary text-primary font-semibold text-xs hover:bg-surface-container transition-colors whitespace-nowrap cursor-pointer"
                >
                  Request DLSA Court Advocate Appointment
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* COURT PASS MODAL                                                          */}
      {/* ========================================================================= */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-primary text-white p-5 border-b border-primary/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 text-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">badge</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-white">Digital Court Security Entry Slip</h3>
                  <p className="text-[10px] text-slate-300">Patiala House Courts Complex Gate #2</p>
                </div>
              </div>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">✕</button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-36 h-36 mx-auto bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center rounded-xl text-xs text-secondary">
                [QR Pass Scanner Code]
              </div>
              <div className="space-y-1">
                <p className="font-bold text-primary text-sm">Ramesh Kumar Sundaram (CIT-DEL-984210)</p>
                <p className="text-xs text-secondary">Summons: SUM-2025-MM04-0988 • Patiala House Court #04</p>
                <p className="font-mono text-xs text-error font-bold">Valid On: 28-MAY-2025 (09:00 AM - 05:00 PM)</p>
              </div>
              <p className="text-[11px] text-secondary bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                Present this digital QR pass at Court Gate #2 metal detector checkpoint alongside your Aadhaar or Driving Licence.
              </p>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2">
              <button
                onClick={() => setShowPassModal(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
              <button
                onClick={() => alert('Downloading Court Entry Pass PDF...')}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer whitespace-nowrap"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIRTUAL COURT VC REQUEST MODAL                                            */}
      {/* ========================================================================= */}
      {showVcModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-primary text-white p-5 border-b border-primary/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">videocam</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-white">Apply for Remote VC Appearance</h3>
                  <p className="text-[10px] text-slate-300">High Court of Delhi Video-Conferencing Rules</p>
                </div>
              </div>
              <button onClick={() => setShowVcModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleVcSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Reason for Remote Appearance
                </label>
                <select className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium outline-none">
                  <option>Medical Condition / Senior Citizen Mobility Constraint</option>
                  <option>Official Duty / Essential Outstation Travel</option>
                  <option>Security / Witness Intimidation Concern</option>
                  <option>Other Reasonable Ground</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Secure Video Calling Device IP / Email
                </label>
                <input
                  type="email"
                  defaultValue="ramesh.sundaram@gmail.com"
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono outline-none"
                />
              </div>

              <p className="text-[11px] text-secondary bg-surface-container-low p-2.5 rounded border border-outline-variant leading-relaxed">
                Under Delhi HC VC Rules, link will be delivered 2 hours prior to bench convening upon magistrate authorization.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVcModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer whitespace-nowrap"
                >
                  Submit VC Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CourtNoticesPage;
