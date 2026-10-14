import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Download, 
  MessageSquare, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Printer
} from 'lucide-react';
import Button from '../ui/Button';

const SAMPLE_CASES = {
  'FIR-2026-DEL-1049': {
    ref: 'FIR-2026-DEL-1049',
    type: 'First Information Report (Cognizable)',
    status: 'UNDER_INVESTIGATION',
    statusLabel: 'Under Investigation',
    statusBadgeColor: 'bg-orangeAccent/10 text-orangeAccent border-orangeAccent/20',
    station: 'Vasant Vihar Police Station, South West District',
    complainant: 'S. Sharma (Citizen ID: 12)',
    io: 'Sub-Inspector Rajesh Verma (Badge #418)',
    sho: 'Inspector V. K. Tyagi',
    dateFiled: '14 Oct 2026, 21:50 IST',
    sections: ['BNS §303 (Theft in dwelling house)', 'BNS §331(4) (Lurking house-trespass)'],
    events: [
      { date: '14 Oct 2026, 21:50 IST', title: 'Complaint Submitted Online', desc: 'Digital incident report CMP-2026-8901 received and acknowledged.', by: 'Complainant' },
      { date: '15 Oct 2026, 09:15 IST', title: 'Intake Desk Jurisdiction Verified', desc: 'Assessed as cognizable matter under Vasant Vihar PS territorial limit.', by: 'Desk Officer HC M. Sharma' },
      { date: '15 Oct 2026, 09:30 IST', title: 'FIR Formally Registered', desc: 'Approved and sealed by Station House Officer. FIR-2026-DEL-1049 created.', by: 'Inspector V. K. Tyagi (SHO)' },
      { date: '15 Oct 2026, 11:30 IST', title: 'Investigating Officer Assigned', desc: 'Case file assigned to SI Rajesh Verma. Scene inspection conducted.', by: 'SHO V. K. Tyagi' },
      { date: '16 Oct 2026, 10:15 IST', title: 'Evidence Forwarded to State Cyber Cell', desc: 'Exhibit EX-01 (CCTV footage) dispatched with verified custody hash.', by: 'SI Rajesh Verma' },
    ],
    exhibits: [
      { id: 'EX-01', desc: 'USB Drive containing CCTV corridor capture', hash: 'SHA256: 4a9fe108...', custody: 'State Cyber Cell' },
      { id: 'EX-02', desc: 'Fingerprint impressions from balcony door', hash: 'SHA256: 7b2c9914...', custody: 'Station Malkhana' },
    ],
  },
  'CMP-2026-8902': {
    ref: 'CMP-2026-8902',
    type: 'Digital Incident Complaint (Under Review)',
    status: 'UNDER_REVIEW',
    statusLabel: 'Preliminary Review',
    statusBadgeColor: 'bg-saffron/10 text-saffron-dark border-saffron/30',
    station: 'Connaught Place Police Station, New Delhi',
    complainant: 'A. Verma (Citizen ID: 19)',
    io: 'Assigned upon registration',
    sho: 'Inspector P. K. Rao',
    dateFiled: '15 Oct 2026, 08:30 IST',
    sections: ['Evaluation under BNS §316 (Criminal breach of trust)'],
    events: [
      { date: '15 Oct 2026, 08:30 IST', title: 'Incident Report Logged', desc: 'Online filing for online payment fraud. Reference ID issued.', by: 'Complainant' },
      { date: '15 Oct 2026, 09:45 IST', title: 'Desk Preliminary Verification', desc: 'Transaction statement reviewed; bank nodal communication drafted.', by: 'Desk Officer ASI K. Pal' },
    ],
    exhibits: [
      { id: 'EX-01', desc: 'Bank account transaction PDF statement', hash: 'SHA256: 9e88d12a...', custody: 'Intake Dossier' }
    ],
  }
};

export function ProductPreview() {
  const [searchRef, setSearchRef] = useState('FIR-2026-DEL-1049');
  const [activeCaseKey, setActiveCaseKey] = useState('FIR-2026-DEL-1049');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activeCase = SAMPLE_CASES[activeCaseKey] || SAMPLE_CASES['FIR-2026-DEL-1049'];

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchRef.trim().toUpperCase();
    if (SAMPLE_CASES[query]) {
      setActiveCaseKey(query);
    } else {
      // Default to main demo case with notification
      alert(`For demonstration purposes, please use sample case IDs "FIR-2026-DEL-1049" or "CMP-2026-8902". Displaying FIR-2026-DEL-1049.`);
      setActiveCaseKey('FIR-2026-DEL-1049');
      setSearchRef('FIR-2026-DEL-1049');
    }
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <section id="preview" className="py-20 lg:py-28 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-borderSoft shadow-subtle mb-4">
            <Search className="w-3.5 h-3.5 text-navy" />
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              Live Product Interface
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight">
            Transparent Case Tracking in Action.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate leading-relaxed">
            Citizens and authorized personnel monitor case status with complete role isolation. Try the interactive demonstration below with sample case records.
          </p>
        </div>

        {/* Demo Case Switcher & Search Bar */}
        <div className="bg-white border border-borderSoft rounded-2xl p-4 sm:p-6 shadow-subtle mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                placeholder="Enter Reference ID (e.g. FIR-2026-DEL-1049)"
                className="w-full pl-10 pr-4 py-2 text-sm border border-borderSoft rounded-lg bg-ivory/50 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy font-mono"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Lookup
            </Button>
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-muted">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => {
                setSearchRef('FIR-2026-DEL-1049');
                setActiveCaseKey('FIR-2026-DEL-1049');
              }}
              className={`px-2.5 py-1 rounded border font-mono transition-colors ${
                activeCaseKey === 'FIR-2026-DEL-1049'
                  ? 'bg-navy text-white border-navy font-bold'
                  : 'bg-ivory border-borderSoft hover:bg-slate-soft'
              }`}
            >
              FIR-2026-DEL-1049
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchRef('CMP-2026-8902');
                setActiveCaseKey('CMP-2026-8902');
              }}
              className={`px-2.5 py-1 rounded border font-mono transition-colors ${
                activeCaseKey === 'CMP-2026-8902'
                  ? 'bg-navy text-white border-navy font-bold'
                  : 'bg-ivory border-borderSoft hover:bg-slate-soft'
              }`}
            >
              CMP-2026-8902
            </button>
          </div>
        </div>

        {/* Main Product Screen Container */}
        <div className="bg-white border border-borderSoft rounded-2xl shadow-elevated overflow-hidden">
          
          {/* Top Banner / Case Summary Bar */}
          <div className="bg-navy p-6 text-white border-b border-navy-light/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-xl sm:text-2xl font-bold tracking-tight">
                    {activeCase.ref}
                  </h3>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border bg-white/10 text-white`}
                  >
                    {activeCase.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeCase.station} &bull; Filed on {activeCase.dateFiled}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-3.5 h-3.5 text-navy" />}
                  className="bg-white text-navy hover:bg-ivory text-xs"
                >
                  {downloadSuccess ? 'Downloaded!' : 'Export Status Slip'}
                </Button>
              </div>
            </div>
          </div>

          {/* Body Content Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 8 Cols: Case Events Timeline & Details */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Statutory Legal Offence Badges */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted mb-3">
                  Statutory Offence Sections (Bharatiya Nyaya Sanhita)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeCase.sections.map((sec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-ivory border border-borderSoft text-xs font-semibold text-navy"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronological Event History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted">
                    Official Chronological Progress Log
                  </h4>
                  <span className="text-[11px] text-civicGreen font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> All events signed by authorized personnel
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-borderSoft">
                  {activeCase.events.map((evt, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-navy border-2 border-white ring-2 ring-saffron/50" />
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-display text-sm font-bold text-navy">
                            {evt.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-muted">
                            {evt.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate leading-relaxed mb-1">
                          {evt.desc}
                        </p>
                        <span className="text-[11px] font-medium text-slate-muted italic">
                          Actioned by: {evt.by}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logged Exhibits Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted mb-3">
                  Evidence Exhibits & Custody Status
                </h4>
                <div className="rounded-xl border border-borderSoft overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-ivory border-b border-borderSoft text-slate-muted font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Exhibit ID</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Cryptographic Hash</th>
                        <th className="py-2.5 px-3">Current Custody</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderSoft">
                      {activeCase.exhibits.map((ex) => (
                        <tr key={ex.id} className="hover:bg-ivory/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-navy">{ex.id}</td>
                          <td className="py-2.5 px-3 text-ink">{ex.desc}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-muted">{ex.hash}</td>
                          <td className="py-2.5 px-3 font-medium text-civicGreen">{ex.custody}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Officer Assignment & System Metadata */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Personnel Assignment Card */}
              <div className="bg-ivory rounded-xl border border-borderSoft p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted">
                  Case Officials
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="pb-2 border-b border-borderSoft">
                    <span className="text-slate-muted block text-[11px]">Investigating Officer (IO)</span>
                    <span className="font-semibold text-ink text-sm">{activeCase.io}</span>
                  </div>
                  <div className="pb-2 border-b border-borderSoft">
                    <span className="text-slate-muted block text-[11px]">Station House Officer (SHO)</span>
                    <span className="font-semibold text-ink text-sm">{activeCase.sho}</span>
                  </div>
                  <div>
                    <span className="text-slate-muted block text-[11px]">Reporting Complainant</span>
                    <span className="font-semibold text-ink text-sm">{activeCase.complainant}</span>
                  </div>
                </div>
              </div>

              {/* Citizen Helpdesk Info */}
              <div className="bg-white rounded-xl border border-borderSoft p-5 space-y-3 text-xs">
                <h4 className="font-semibold text-navy flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orangeAccent" />
                  Have additional details?
                </h4>
                <p className="text-slate leading-relaxed">
                  Supplemental witness statements or documents can be attached by logging in with your registered account.
                </p>
                <div className="pt-2">
                  <a href="/login" className="text-navy font-semibold hover:underline inline-flex items-center gap-1">
                    Sign in to submit addendum <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Academic Demo Disclaimer Badge */}
              <div className="p-3.5 rounded-xl bg-saffron/10 border border-saffron/30 text-[11px] text-ink leading-relaxed">
                <strong className="text-navy">Demonstration Disclaimer:</strong> All records above are simulated for educational demonstration. Personal and jurisdictional records are fictional.
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default ProductPreview;
