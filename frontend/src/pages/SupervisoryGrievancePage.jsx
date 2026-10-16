import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';

export function SupervisoryGrievancePage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'file' | 'history'
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submissionSuccessToast, setSubmissionSuccessToast] = useState(false);

  // Form states
  const [grievanceGround, setGrievanceGround] = useState('delay');
  const [supervisoryTier, setSupervisoryTier] = useState('acp');
  const [targetStation, setTargetStation] = useState('PS-SW-04');
  const [linkedCaseId, setLinkedCaseId] = useState('FIR-DL-2025-4401');
  const [grievanceDetails, setGrievanceDetails] = useState('');
  const [demandedRemedy, setDemandedRemedy] = useState('');
  const [isAffirmed, setIsAffirmed] = useState(false);

  const [grievances, setGrievances] = useState([
    {
      id: 'GRV-MHA-2025-7819',
      station: 'Vasant Vihar Police Station (PS-SW-04)',
      linkedCase: 'FIR-DL-2025-4401',
      ground: 'Delay in Supplying Certified FIR Copy & Seized Article Panchnama',
      authority: 'Office of ACP Alok Kumar Verma, IPS (Vasant Vihar Sub-Division)',
      tier: 'Tier 1 • Assistant Commissioner of Police',
      lodgedDate: '20 May 2025, 04:30 PM',
      slaDue: '23 May 2025 (48 Hours Remaining)',
      status: 'Supervisory Inquiry Instituted',
      statusColor: 'bg-amber-950 text-amber-300 border border-amber-700/60',
      actionNote: 'ACP Office has issued a formal 48-hour Show Cause Memo to the Station IO to produce the updated Case Diary and explain the evidentiary delay.',
      timeline: [
        { date: '20 May, 04:30 PM', title: 'Citizen Grievance Docket Transmitted under BNSS 173(4)' },
        { date: '21 May, 10:00 AM', title: 'ACP Sub-Divisional Bench Took Cognizance' },
        { date: '21 May, 02:15 PM', title: 'Formal Explanation Notice Served to Station House Officer' },
      ],
    },
  ]);

  const handleSubmitGrievance = (e) => {
    e.preventDefault();
    if (!grievanceDetails.trim() || !isAffirmed) return;

    const newGrievance = {
      id: `GRV-MHA-2025-78${grievances.length + 20}`,
      station: targetStation === 'PS-SW-04' ? 'Vasant Vihar Police Station (PS-SW-04)' : 'District Cyber Crime Cell, SW District',
      linkedCase: linkedCaseId,
      ground: grievanceGround === 'delay' ? 'Investigation Inaction & Evidentiary Delay' : grievanceGround === 'refusal' ? 'Refusal to Register Mandatory Cognizable FIR' : 'Officer Misconduct & Procedural Irregularity',
      authority: supervisoryTier === 'acp' ? 'Office of Assistant Commissioner of Police (ACP), Vasant Vihar' : 'Office of Deputy Commissioner of Police (DCP), South West District',
      tier: supervisoryTier === 'acp' ? 'Tier 1 • ACP Sub-Division' : 'Tier 2 • DCP District HQ',
      lodgedDate: 'Just Now',
      slaDue: '72 Hours Statutory Clock Active',
      status: 'Dispatched to Supervisory Bench',
      statusColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60',
      actionNote: 'Dossier encrypted and transmitted directly to the executive supervisory queue. You will receive an SMS update upon ACP cognizance.',
      timeline: [
        { date: 'Just now', title: 'Citizen Grievance Signed & Logged on National Police Grid' },
      ],
    };

    setGrievances([newGrievance, ...grievances]);
    setActiveTab('active');
    setGrievanceDetails('');
    setDemandedRemedy('');
    setIsAffirmed(false);
    setSubmissionSuccessToast(true);
    setTimeout(() => setSubmissionSuccessToast(false), 4500);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="grievance" />

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
            <span className="text-primary font-bold">Supervisory Oversight &amp; Grievance</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>BNSS Sec. 173(4) Statutory Oversight Active</span>
            </div>
            <button
              onClick={() => setActiveTab('file')}
              className="px-3.5 py-1 rounded bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              <span>+ Lodge Supervisory Grievance</span>
            </button>
          </div>
        </header>

        {/* Toast */}
        {submissionSuccessToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950 border border-emerald-600/60 rounded-lg text-emerald-200 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <span><strong>Supervisory Grievance Registered!</strong> Transmitted directly to the ACP Sub-Divisional Office. Statutory 72-hour oversight clock initiated.</span>
            </div>
            <button onClick={() => setSubmissionSuccessToast(false)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-surface-variant text-on-secondary-fixed-variant rounded border border-outline-variant/70 font-label-sm text-xs uppercase tracking-wider font-semibold mb-2">
                <span className="material-symbols-outlined text-[15px]">security</span>
                Independent Police Accountability
              </div>
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Supervisory Grievance (ACP / DCP Oversight)
              </h1>
              <p className="font-body-md text-xs sm:text-sm text-secondary max-w-3xl mt-1">
                Statutory escalation mechanism under Section 173(4) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023. Directly petition the Assistant Commissioner of Police (ACP) or District Deputy Commissioner (DCP) for investigation delays or station house non-compliance.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('file')}
                className="px-4 py-2.5 bg-error text-white font-title-md text-xs rounded-lg hover:bg-error/90 transition-colors flex items-center gap-2 shadow-sm font-semibold"
              >
                <span className="material-symbols-outlined text-base">report_problem</span>
                Lodge Section 173(4) Petition
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Active Escalations</span>
                <span className="material-symbols-outlined text-lg text-amber-600">pending_actions</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">{grievances.length} Active</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Under ACP Review</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Statutory SLA</span>
                <span className="material-symbols-outlined text-lg text-primary">timer</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">72 Hours</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Mandatory Decision Timeline</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Supervisory Bench</span>
                <span className="material-symbols-outlined text-lg text-primary">corporate_fare</span>
              </div>
              <p className="font-headline-md text-base font-bold text-primary mt-1 truncate">ACP Vasant Vihar</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">South West District HQ</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Historical Disposals</span>
                <span className="material-symbols-outlined text-lg text-emerald-600">task_alt</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-emerald-700 mt-1">02 Resolved</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">100% Remedy Enforced</p>
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
              <span>Active Supervisory Dossiers</span>
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-mono">{grievances.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>File Section 173(4) Escalation</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Past Supervisory Inquiries</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: ACTIVE SUPERVISORY DOSSIERS                                    */}
          {/* ===================================================================== */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              {grievances.map((g) => (
                <div
                  key={g.id}
                  className="bg-surface-container-lowest rounded-2xl border-2 border-amber-900/30 shadow-md p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-error/90 text-white flex items-center justify-center shrink-0 shadow">
                        <span className="material-symbols-outlined text-2xl">shield</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{g.id}</span>
                          <span className="text-outline-variant">•</span>
                          <span className="text-xs font-mono font-bold text-error">BNSS Sec. 173(4)</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${g.statusColor}`}>
                            {g.status}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface mt-0.5">
                          {g.ground}
                        </h3>
                        <p className="text-xs text-secondary mt-0.5">
                          Against: <strong>{g.station}</strong> • Linked Case: <strong>#{g.linkedCase}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right font-mono text-xs bg-amber-50 p-3 rounded-xl border border-amber-200 shrink-0">
                      <p className="text-amber-900 font-bold">Statutory SLA Watch</p>
                      <p className="text-amber-700 font-semibold">{g.slaDue}</p>
                    </div>
                  </div>

                  {/* Reviewing Authority Banner */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">balance</span>
                        Presiding Supervisory Authority:
                      </span>
                      <span className="font-mono text-secondary">{g.tier}</span>
                    </div>
                    <p className="font-semibold text-primary">{g.authority}</p>
                    <p className="text-secondary leading-relaxed bg-[#f8f7f3] p-3 rounded border border-outline-variant/50">
                      "{g.actionNote}"
                    </p>
                  </div>

                  {/* Audit Trail Timeline */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 flex items-center gap-1.5 font-label-sm">
                      <span className="material-symbols-outlined text-xs text-primary">timeline</span>
                      Supervisory Action Log ({g.timeline.length} Milestones)
                    </p>
                    <div className="space-y-2">
                      {g.timeline.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs bg-surface-container-lowest p-2 rounded border border-outline-variant/50">
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">{t.date}</span>
                          <span className="text-primary font-medium">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span>View ACP Direction Order &amp; Show Cause Memo</span>
                    </button>

                    <button
                      onClick={() => alert(`Submitting supplementary rejoinder for ${g.id}`)}
                      className="px-3.5 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container"
                    >
                      Submit Supplementary Statement
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: FILE NEW SECTION 173(4) ESCALATION                             */}
          {/* ===================================================================== */}
          {activeTab === 'file' && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm max-w-3xl">
              <div className="border-b border-outline-variant pb-4 mb-6">
                <div className="flex items-center gap-2 text-error mb-1">
                  <span className="material-symbols-outlined">warning</span>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Statutory Vigilance Mechanism</span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-primary">
                  Petition to Assistant Commissioner of Police (ACP) / DCP
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Pursuant to BNSS Section 173(4), this petition bypasses the local police station and is received directly at the executive supervisory rank.
                </p>
              </div>

              <form onSubmit={handleSubmitGrievance} className="space-y-5">
                {/* 1. Supervisory Tier */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    1. Select Supervisory Authority Tier *
                  </label>
                  <select
                    value={supervisoryTier}
                    onChange={(e) => setSupervisoryTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="acp">Tier 1 • Assistant Commissioner of Police (ACP) - Vasant Vihar Sub-Division</option>
                    <option value="dcp">Tier 2 • Deputy Commissioner of Police (DCP) - South West District HQ</option>
                    <option value="pca">Tier 3 • Police Complaints Authority (PCA) &amp; Joint CP Vigilance</option>
                  </select>
                </div>

                {/* 2. Target Police Station */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    2. Police Station Under Supervisory Review *
                  </label>
                  <select
                    value={targetStation}
                    onChange={(e) => setTargetStation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="PS-SW-04">Vasant Vihar Police Station (PS-DL-SW-04)</option>
                    <option value="PS-SW-05">R.K. Puram Police Station (PS-DL-SW-05)</option>
                    <option value="CYBER-SW">Cyber Crime Cell, South West District</option>
                  </select>
                </div>

                {/* 3. Grounds */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    3. Specific Statutory Grounds for Escalation *
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'delay', label: 'Unreasonable Delay in Investigation (> 14 Days Inaction)' },
                      { id: 'refusal', label: 'Refusal to Register Cognizable e-FIR (Violation of Sec 173(1))' },
                      { id: 'copy', label: 'Denial of Free Copy of Registered FIR (Sec 173(2))' },
                      { id: 'evidence', label: 'Mishandling / Non-Collection of Material Evidence or CCTV' },
                      { id: 'harassment', label: 'Officer Misconduct, Intimidation, or Procedural Abuse' },
                    ].map((g) => (
                      <label
                        key={g.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-2.5 ${
                          grievanceGround === g.id
                            ? 'bg-surface-container-high border-primary text-primary font-bold'
                            : 'bg-surface-container-low border-outline-variant/60 text-secondary hover:border-outline-variant'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ground"
                          value={g.id}
                          checked={grievanceGround === g.id}
                          onChange={(e) => setGrievanceGround(e.target.value)}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-xs">{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Linked Case */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    4. Associated Case / Complaint Reference Number
                  </label>
                  <input
                    type="text"
                    value={linkedCaseId}
                    onChange={(e) => setLinkedCaseId(e.target.value)}
                    placeholder="e.g. FIR-DL-2025-4401 or CR-2025-0982"
                    className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono outline-none"
                  />
                </div>

                {/* 5. Statement */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    5. Detailed Factual Statement for ACP Inquest *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="State chronological interactions with the police station, names of officers contacted, dates of visits, and the specific failure of the investigating unit..."
                    value={grievanceDetails}
                    onChange={(e) => setGrievanceDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium outline-none"
                  ></textarea>
                </div>

                {/* 6. Remedy Demanded */}
                <div>
                  <label className="block text-xs font-bold text-primary uppercase font-label-sm mb-1.5">
                    6. Relief / Statutory Order Demanded
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Transfer investigation to independent officer, expedite charge sheet filing, issue FIR copy"
                    value={demandedRemedy}
                    onChange={(e) => setDemandedRemedy(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium outline-none"
                  />
                </div>

                {/* Affirmation */}
                <div className="flex items-start gap-2 bg-[#f8f7f3] p-3.5 rounded-xl border border-outline-variant/60">
                  <input
                    type="checkbox"
                    id="aff-grv"
                    required
                    checked={isAffirmed}
                    onChange={(e) => setIsAffirmed(e.target.checked)}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <label htmlFor="aff-grv" className="text-[11px] text-secondary leading-snug cursor-pointer">
                    I solemnly attest that the statements made herein are true to the best of my knowledge and that this petition is filed under Section 173(4) BNSS without frivolous intent.
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isAffirmed || !grievanceDetails.trim()}
                    className="px-6 py-2.5 bg-error hover:bg-error/90 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Submit to ACP Executive Bench
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: PAST INQUIRIES HISTORY                                         */}
          {/* ===================================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {[
                {
                  id: 'GRV-HIST-2024-041',
                  station: 'Mandir Marg Cyber Cell',
                  ground: 'Delay in Account Freeze Communication to Banking Ombudsman',
                  date: 'Dec 2024',
                  outcome: 'Remedied: ACP ordered expedited nodal compliance within 24h. Bank froze Rs. 42,000.',
                  authority: 'ACP Cyber Crime HQ',
                },
                {
                  id: 'GRV-HIST-2024-012',
                  station: 'Vasant Vihar PS',
                  ground: 'Non-issuance of Non-Cognizable Report (NCR) acknowledgment',
                  date: 'Aug 2024',
                  outcome: 'Remedied: Duty Officer reprimanded; digital NCR dispatched to citizen within 4 hours.',
                  authority: 'ACP Vasant Vihar',
                },
              ].map((h) => (
                <div key={h.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{h.id}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-xs text-secondary">{h.station}</span>
                    </div>
                    <h4 className="font-title-md text-xs font-bold text-primary mt-0.5">{h.ground}</h4>
                    <p className="text-[11px] text-emerald-800 font-medium mt-1">✓ {h.outcome}</p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">Disposed by {h.authority} • {h.date}</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ACP Closure Order for ${h.id}`)}
                    className="px-3 py-1.5 rounded border border-outline-variant text-xs font-semibold text-primary hover:bg-surface-container shrink-0 self-end sm:self-center"
                  >
                    View Closure Order
                  </button>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* ACP ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-[#000a24]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#000a24] text-white p-5 border-b border-[#172342] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed/20 text-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">shield</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-white">Office of Assistant Commissioner of Police</h3>
                  <p className="text-[10px] text-slate-300 font-mono">Sub-Division Vasant Vihar • Official Direction Memo</p>
                </div>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="border border-outline-variant p-3.5 rounded-xl bg-surface-container-low font-mono space-y-1">
                <p><strong>MEMO NO:</strong> ACP/VV/VIG/2025/1104</p>
                <p><strong>TO:</strong> Station House Officer, PS Vasant Vihar</p>
                <p><strong>RE:</strong> Supervisory Grievance GRV-MHA-2025-7819</p>
              </div>

              <div className="p-4 rounded-xl bg-[#f8f7f3] border border-outline-variant text-secondary leading-relaxed space-y-2">
                <p className="font-bold text-primary">DIRECTION OF ACP ALOK KUMAR VERMA, IPS:</p>
                <p>
                  "Perusal of the grievance docket demonstrates that citizen Ramesh Kumar Sundaram was not supplied with the certified copy of FIR #FIR-DL-2025-4401 in compliance with Section 173(2) BNSS.
                </p>
                <p>
                  The Investigating Officer is hereby directed to immediately upload the certified PDF copy to the CaseSync citizen portal within 24 hours and produce the Case Diary extracts before the undersigned on 23-May-2025."
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant font-mono text-[11px]">
                <span>Status: EXECUTED ON GRID</span>
                <span className="text-emerald-700 font-bold">✓ Digitally Signed &amp; Dispatched</span>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container"
              >
                Close
              </button>
              <button
                onClick={() => alert('Downloading official stamped ACP Order PDF...')}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container"
              >
                Download Stamped Order (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SupervisoryGrievancePage;
