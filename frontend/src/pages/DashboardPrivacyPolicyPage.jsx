import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useAuth } from '../context/AuthContext';

export function DashboardPrivacyPolicyPage() {
  const { user } = useAuth();
  const [showMaskedDemo, setShowMaskedDemo] = useState(true);

  const rawAadhaar = 'XXXX-XXXX-4321';
  const rawPhone = user?.phone || '9800000007';
  const maskedPhone = `${rawPhone.substring(0, 2)}XXXXXX${rawPhone.substring(rawPhone.length - 2)}`;

  const securityPillars = [
    {
      id: 'pii-masking',
      title: '1. PII Redaction & Data Minimization (DPDP Act 2023)',
      icon: 'shield_person',
      color: 'text-blue-900 bg-blue-50 border-blue-200',
      description: 'National identity numbers (Aadhaar, Passport, Voter ID) are strictly masked at the API gateway layer. Only the last 4 characters are ever rendered in operational views. Phone numbers and private addresses are excluded from all public unauthenticated tracking endpoints.'
    },
    {
      id: 'audit-chain',
      title: '2. Cryptographic SHA-256 Tamper-Evident Ledger',
      icon: 'lock',
      color: 'text-indigo-900 bg-indigo-50 border-indigo-200',
      description: 'Every read of sensitive files, status transition, officer assignment, and evidence custody handoff is recorded into an append-only audit trail. Each row incorporates the SHA-256 hash of its immediate predecessor. Procedural database triggers reject any SQL-level UPDATE or DELETE on historical criminal records.'
    },
    {
      id: 'rbac-scoping',
      title: '3. Role-Based Access Control & Station Jurisdictional Scoping',
      icon: 'admin_panel_settings',
      color: 'text-emerald-900 bg-emerald-50 border-emerald-200',
      description: 'Access to investigative files is strictly governed by Least Privilege across 7 canonical roles. Station staff are restricted to their territorial station code. Any attempt by an officer to inspect cross-station dockets without supervisory delegation triggers an immediate 403 Forbidden audit security alert.'
    },
    {
      id: 'evidence-integrity',
      title: '4. Evidence Malkhana Vault Cryptographic Checksum',
      icon: 'lock_clock',
      color: 'text-amber-900 bg-amber-50 border-amber-200',
      description: 'Digital exhibits, CCTV clips, and CDR forensic reports uploaded to the evidence repository are hashed with SHA-256 upon intake. During custody handoffs to forensic labs or court production, the file hash is recomputed to certify that evidence has not been modified.'
    },
    {
      id: 'statutory-recourse',
      title: '5. Informant Statutory Recourse & Transparency',
      icon: 'gavel',
      color: 'text-purple-900 bg-purple-50 border-purple-200',
      description: 'Under BNSS Section 173(4), if a citizen complaint is refused or rejected by the station triage desk, the citizen possesses a statutory right to appeal directly to the Superintendent of Police (SP) or Assistant Commissioner of Police (ACP) via the Supervisory Grievance module.'
    }
  ];

  return (
    <div className="min-h-screen flex bg-ivory text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="privacy" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Portal Workspace</Link>
            <span className="text-slate-300">/</span>
            <span className="text-blue-950 font-bold">Privacy Policy &amp; PII Protection</span>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Dossiers</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Header Title Banner */}
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-700 text-2xl">policy</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Statutory Data Protection &amp; PII Governance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                DPDP Act 2023 Compliant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              CaseSync operates under strict Indian statutory guidelines including the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Information Technology Act Section 43A, and Digital Personal Data Protection (DPDP) Act 2023 to protect complainant confidentiality and criminal record integrity.
            </p>
          </section>

          {/* Interactive PII Masking Demonstration Card */}
          <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live PII Shielding Simulation</h3>
                <p className="text-xs text-slate-500">Preview how your sensitive identity attributes appear to public tracking endpoints.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMaskedDemo(!showMaskedDemo)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-hidden text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                {showMaskedDemo ? 'View Unmasked (Internal IO View)' : 'View Masked (Public View)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 block font-semibold">Aadhaar / ID Proof</span>
                <span className="font-mono font-bold text-sm text-slate-900 block">
                  {showMaskedDemo ? rawAadhaar : '5412-8899-4321'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  {showMaskedDemo ? '● Redacted trailing 4 digits' : '● Privileged Law Enforcement View'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 block font-semibold">Contact Mobile</span>
                <span className="font-mono font-bold text-sm text-slate-900 block">
                  {showMaskedDemo ? maskedPhone : rawPhone}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  {showMaskedDemo ? '● Central digits masked' : '● Verified Informant Contact'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 block font-semibold">Residential Address</span>
                <span className="font-medium text-xs text-slate-900 block truncate">
                  {showMaskedDemo ? 'Sector 17, City Centre (Zone Filtered)' : 'Flat 402, Green Avenue, City Centre'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  {showMaskedDemo ? '● Exact street address hidden' : '● Full Informant Address'}
                </span>
              </div>
            </div>
          </section>

          {/* Security & Governance Pillars */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Statutory Security Architecture</h2>
            
            <div className="space-y-3">
              {securityPillars.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${p.color}`}>
                      <span className="material-symbols-outlined text-lg">{p.icon}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{p.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-10.5">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Footer */}
          <section className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <strong className="text-slate-900 block">Need to update your contact particulars or lodge a grievance?</strong>
              <p className="text-slate-500">Access your Citizen Profile Vault or submit a formal memo to the Supervisory Cell.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/dashboard/profile"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-900 text-blue-950 font-bold transition-colors shadow-2xs"
              >
                Manage Profile
              </Link>
              <Link
                to="/dashboard/grievance"
                className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-xs"
              >
                File Grievance
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DashboardPrivacyPolicyPage;
