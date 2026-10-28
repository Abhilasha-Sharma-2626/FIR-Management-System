import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardSidebar from '../components/layout/DashboardSidebar';

export function DashboardFirGuidelinesPage() {
  const [searchSection, setSearchSection] = useState('');
  const [selectedAct, setSelectedAct] = useState('ALL');

  const bnsSections = [
    {
      bns: 'Section 303(2)',
      bnsTitle: 'Theft of Property / Goods',
      ipc: 'Section 379 IPC',
      type: 'Cognizable • Non-Bailable',
      cognizable: true,
      description: 'Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.'
    },
    {
      bns: 'Section 318(4)',
      bnsTitle: 'Cheating and Dishonestly Inducing Delivery of Property',
      ipc: 'Section 420 IPC',
      type: 'Cognizable • Non-Bailable',
      cognizable: true,
      description: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property, or to make, alter or destroy the whole or any part of a valuable security.'
    },
    {
      bns: 'Section 115(2)',
      bnsTitle: 'Voluntarily Causing Hurt / Assault',
      ipc: 'Section 323 IPC',
      type: 'Non-Cognizable • Bailable',
      cognizable: false,
      description: 'Whoever voluntarily causes hurt shall be punished with imprisonment of either description for a term which may extend to one year, or with fine, or with both.'
    },
    {
      bns: 'Section 351(2)',
      bnsTitle: 'Criminal Intimidation & Extortion Threat',
      ipc: 'Section 506 IPC',
      type: 'Non-Cognizable • Bailable',
      cognizable: false,
      description: 'Threatening another with injury to their person, reputation, or property with intent to cause alarm.'
    },
    {
      bns: 'Section 66D IT Act',
      bnsTitle: 'Cheating by Personation by using Computer Resource',
      ipc: 'Section 66D IT Act 2000',
      type: 'Cognizable • Bailable',
      cognizable: true,
      description: 'Whoever, by means of any communication device or computer resource cheats by personation (phishing, spoofing, OTP fraud).'
    },
    {
      bns: 'Section 305',
      bnsTitle: 'Theft in Dwelling House, Means of Transport',
      ipc: 'Section 380 IPC',
      type: 'Cognizable • Non-Bailable',
      cognizable: true,
      description: 'Whoever commits theft in any building, tent, vessel, or vehicle used as a human dwelling or for custody of property.'
    }
  ];

  const filteredSections = bnsSections.filter((s) => {
    const q = searchSection.toLowerCase();
    const matchesQ = !q || s.bns.toLowerCase().includes(q) || s.ipc.toLowerCase().includes(q) || s.bnsTitle.toLowerCase().includes(q);
    const matchesAct = selectedAct === 'ALL' || (selectedAct === 'COG' ? s.cognizable : !s.cognizable);
    return matchesQ && matchesAct;
  });

  return (
    <div className="min-h-screen flex bg-ivory text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="guidelines" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Portal Workspace</Link>
            <span className="text-slate-300">/</span>
            <span className="text-blue-950 font-bold">FIR Legal Guidelines &amp; BNSS 2023</span>
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
          
          {/* Header Banner */}
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-blue-900 text-2xl">menu_book</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                FIR Legal Handbook &amp; BNS 2023 Cross-Reference
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                Statutory Reference
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Effective 1 July 2024, the criminal legal framework of India transitioned from the Indian Penal Code (IPC 1860) and CrPC 1973 to the Bharatiya Nyaya Sanhita (BNS 2023) and Bharatiya Nagarik Suraksha Sanhita (BNSS 2023). Familiarize yourself with your statutory informant rights and penal classifications.
            </p>
          </section>

          {/* 3 Core Statutory Protections */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Right to Free Certified Copy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Under BNSS Section 173(2), an informant is statutorily entitled to receive a certified copy of the registered First Information Report completely free of cost.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">public</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Statutory Zero-FIR Mandate</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Police stations cannot refuse registration of a cognizable offence on grounds of lack of territorial jurisdiction. The FIR must be registered as a Zero-FIR and transferred.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">balance</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Remedy for Non-Registration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the station officer refuses to record your complaint, under BNSS Section 173(4), you may transmit the complaint directly to the Superintendent of Police (SP) or ACP.
              </p>
            </div>
          </section>

          {/* BNS vs IPC Searchable Cross-Reference Table */}
          <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Offence Matrix: Bharatiya Nyaya Sanhita (BNS) vs IPC</h2>
                <p className="text-xs text-slate-500">Cross-reference active crime categories and legal penal sections.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchSection}
                  onChange={(e) => setSearchSection(e.target.value)}
                  placeholder="Search section or crime..."
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-900 w-48 shadow-2xs"
                />
                <select
                  value={selectedAct}
                  onChange={(e) => setSelectedAct(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-900 shadow-2xs bg-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="COG">Cognizable Only</option>
                  <option value="NON_COG">Non-Cognizable Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-950 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {sec.bns}
                      </span>
                      <span className="text-xs text-slate-500">formerly {sec.ipc}</span>
                      <span className="font-bold text-xs text-slate-900">{sec.bnsTitle}</span>
                    </div>

                    <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                      sec.cognizable ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {sec.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    {sec.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Footer */}
          <section className="p-6 rounded-3xl bg-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-md">
            <div>
              <strong className="text-sm font-bold block">Ready to lodge a First Information Report?</strong>
              <p className="text-slate-300">File your e-FIR with zero delays and immediate cryptographic tracking ID issuance.</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/dashboard/file-fir"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold transition-colors shadow-xs whitespace-nowrap"
              >
                + Lodge New e-FIR
              </Link>
              <Link
                to="/dashboard/jurisdiction"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors border border-white/20"
              >
                Find Station
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DashboardFirGuidelinesPage;
