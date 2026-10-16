import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';

export function EvidenceVaultPage() {
  const [selectedCase, setSelectedCase] = useState('FIR-DL-2025-4401');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);

  // Upload modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('cctv');
  const [newNotes, setNewNotes] = useState('');
  const [isAffirmed, setIsAffirmed] = useState(false);

  const initialEvidence = [
    {
      id: 'EVD-2025-001',
      title: 'CCTV_Enclave_Gate4_Night_Entrance.mp4',
      category: 'cctv',
      categoryLabel: 'CCTV Footage',
      caseId: 'FIR-DL-2025-4401',
      size: '14.2 MB',
      uploadDate: '20 May 2025, 09:40 AM',
      sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      status: 'Admitted by Court',
      statusColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
      officer: 'Insp. Rajesh K. Sharma (Badge #DL-4412)',
      chainStages: [
        { title: 'Citizen Cryptographic Upload', date: '20 May 2025, 09:40 AM', by: 'Ramesh Kumar Sundaram (Citizen)' },
        { title: 'Station IO Integrity Attestation', date: '21 May 2025, 10:15 AM', by: 'Insp. Rajesh K. Sharma' },
        { title: 'Judicial Bench Transmission', date: '23 May 2025, 02:30 PM', by: 'Metropolitan Court Bench #4' },
      ],
      description: 'Timestamped CCTV recording showing two masked individuals forcing rear window grill at Sector-C residence.',
    },
    {
      id: 'EVD-2025-002',
      title: 'Broken_Master_Locker_Latch_MacroPhoto.jpg',
      category: 'photo',
      categoryLabel: 'Physical Macro Photo',
      caseId: 'FIR-DL-2025-4401',
      size: '3.8 MB',
      uploadDate: '20 May 2025, 10:05 AM',
      sha256: '9e107d9d372bb6826bd81d3542a419d6ac433d325a2f3e0c04a0f7e4956b779a',
      status: 'FSL Lab Authenticated',
      statusColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
      officer: 'Forensic Unit, SW District',
      chainStages: [
        { title: 'Citizen Initial Capture', date: '20 May 2025, 10:05 AM', by: 'Ramesh Kumar Sundaram' },
        { title: 'Forensic Lab Intake', date: '21 May 2025, 04:00 PM', by: 'Dr. V. Rao, FSL Rohini' },
      ],
      description: 'High-resolution macro photographic evidence of crowbar friction markings and sheer fractures on steel wardrobe lock.',
    },
    {
      id: 'EVD-2025-003',
      title: 'Fraudulent_IMPS_Transaction_Advice.pdf',
      category: 'financial',
      categoryLabel: 'Financial & CDR',
      caseId: 'CR-2025-0982',
      size: '1.1 MB',
      uploadDate: '12 May 2025, 11:20 AM',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      status: 'Bank Nodal Frozen',
      statusColor: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
      officer: 'Cyber Cell Nodal Desk',
      chainStages: [
        { title: 'Citizen Statement Upload', date: '12 May 2025, 11:20 AM', by: 'Ramesh Kumar Sundaram' },
        { title: 'Nodal Bank 1930 Freeze Trigger', date: '12 May 2025, 11:45 AM', by: 'Axis Bank Anti-Fraud Desk' },
      ],
      description: 'Certified bank transaction advice showing unauthorized transfer of Rs. 42,000 to beneficiary VPA.',
    },
    {
      id: 'EVD-2025-004',
      title: 'Emergency_Call_Transcript_PCR112.wav',
      category: 'audio',
      categoryLabel: 'Audio Recording',
      caseId: 'FIR-DL-2025-4401',
      size: '4.2 MB',
      uploadDate: '20 May 2025, 03:22 AM',
      sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      status: 'PCR Dispatch Certified',
      statusColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
      officer: 'Central Control Room (Haiderpur)',
      chainStages: [
        { title: 'PCR Central Call Logged', date: '20 May 2025, 03:22 AM', by: 'PCR Dispatcher #14' },
        { title: 'Sync to Local Station Docket', date: '20 May 2025, 03:40 AM', by: 'Vasant Vihar Duty Officer' },
      ],
      description: 'First response emergency distress audio dispatch between citizen caller and Delhi Police 112 Control Unit.',
    },
    {
      id: 'EVD-2025-005',
      title: 'Eyewitness_Audio_Statement_MrVerma.m4a',
      category: 'audio',
      categoryLabel: 'Audio Recording',
      caseId: 'FIR-DL-2025-4401',
      size: '1.5 MB',
      uploadDate: '22 May 2025, 05:10 PM',
      sha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
      status: 'Sec 180 BNSS Admitted',
      statusColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
      officer: 'Insp. Rajesh K. Sharma',
      chainStages: [
        { title: 'Audio Deposition Recorded', date: '22 May 2025, 05:10 PM', by: 'Insp. Rajesh K. Sharma' },
        { title: 'Citizen Digital Counter-Sign', date: '22 May 2025, 05:30 PM', by: 'Ramesh Kumar Sundaram' },
      ],
      description: 'Audio deposition recorded in presence of IO corroborating vehicle getaway time and make.',
    },
  ];

  const [evidenceList, setEvidenceList] = useState(initialEvidence);

  // Filter evidence
  const filteredEvidence = evidenceList.filter((item) => {
    const matchesCase = selectedCase === 'all' || item.caseId === selectedCase;
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesCase && matchesCategory;
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !isAffirmed) return;

    const newEvidenceItem = {
      id: `EVD-2025-00${evidenceList.length + 1}`,
      title: newTitle.trim().replace(/\s+/g, '_') + '.pdf',
      category: newCategory,
      categoryLabel: newCategory === 'cctv' ? 'CCTV Footage' : newCategory === 'photo' ? 'Physical Photo' : newCategory === 'financial' ? 'Financial & CDR' : 'Audio Statement',
      caseId: selectedCase === 'all' ? 'FIR-DL-2025-4401' : selectedCase,
      size: '2.4 MB',
      uploadDate: 'Just Now',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'Pending IO Attestation',
      statusColor: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
      officer: 'Pending Assignment to IO',
      chainStages: [
        { title: 'Citizen Cryptographic Upload', date: 'Just now', by: 'Ramesh Kumar Sundaram' },
      ],
      description: newNotes || 'Uploaded supplementary digital proof under Section 65B BSA certificate.',
    };

    setEvidenceList([newEvidenceItem, ...evidenceList]);
    setShowUploadModal(false);
    setNewTitle('');
    setNewNotes('');
    setIsAffirmed(false);
    setUploadSuccessToast(true);
    setTimeout(() => setUploadSuccessToast(false), 4000);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="vault" />

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
            <span className="text-primary font-bold">Evidence Vault &amp; Chain of Custody</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>BSA Sec. 61 &amp; 65B Digital Certificate Sealed</span>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>+ Secure Evidence Deposit</span>
            </button>
          </div>
        </header>

        {/* Success Toast */}
        {uploadSuccessToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950 border border-emerald-600/60 rounded-lg text-emerald-200 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <span><strong>Evidence Sealed Successfully!</strong> Cryptographic SHA-256 ledger created. Investigating Officer notified for legal intake.</span>
            </div>
            <button onClick={() => setUploadSuccessToast(false)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-surface-variant text-on-secondary-fixed-variant rounded border border-outline-variant/70 font-label-sm text-xs uppercase tracking-wider font-semibold mb-2">
                <span className="material-symbols-outlined text-[15px]">enhanced_encryption</span>
                Tamper-Evident Digital Repository
              </div>
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Evidentiary Vault &amp; Chain-of-Custody Ledger
              </h1>
              <p className="font-body-md text-xs sm:text-sm text-secondary max-w-3xl mt-1">
                Forensically captured incident evidence, CCTV recordings, audio transcripts, and financial transaction trails legally sealed under Section 65B of the Bharatiya Sakshya Adhiniyam (BSA).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-primary text-white font-title-md text-xs rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm font-semibold"
              >
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                Deposit New Evidence
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Total Deposited</span>
                <span className="material-symbols-outlined text-lg text-primary">inventory_2</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">{evidenceList.length} Files</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Across 2 Active Dockets</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Encrypted Volume</span>
                <span className="material-symbols-outlined text-lg text-primary">data_saver_on</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">24.8 MB</p>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '5%' }}></div>
              </div>
              <p className="font-body-sm text-[10px] text-slate-500 mt-1">5% of 500 MB Free Civic Quota</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Judicial Admissibility</span>
                <span className="material-symbols-outlined text-lg text-emerald-600">verified</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-emerald-700 mt-1">100% Sealed</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">SHA-256 Hardware Attested</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">Court Transmitted</span>
                <span className="material-symbols-outlined text-lg text-primary">gavel</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">03 Files</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Patiala House Magistrate Bench</p>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Case Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider font-label-sm shrink-0 mr-1">Docket:</span>
              <button
                onClick={() => setSelectedCase('FIR-DL-2025-4401')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors shrink-0 ${
                  selectedCase === 'FIR-DL-2025-4401'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-secondary hover:text-primary border border-outline-variant/60'
                }`}
              >
                #FIR-DL-2025-4401 (Theft)
              </button>
              <button
                onClick={() => setSelectedCase('CR-2025-0982')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors shrink-0 ${
                  selectedCase === 'CR-2025-0982'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-secondary hover:text-primary border border-outline-variant/60'
                }`}
              >
                #CR-2025-0982 (Cyber Fraud)
              </button>
              <button
                onClick={() => setSelectedCase('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedCase === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-secondary hover:text-primary border border-outline-variant/60'
                }`}
              >
                Show All
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'cctv', label: 'CCTV' },
                { id: 'photo', label: 'Photos' },
                { id: 'financial', label: 'Financial' },
                { id: 'audio', label: 'Audio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                    activeCategory === tab.id
                      ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                      : 'text-secondary hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Grid / List */}
          <div className="space-y-4">
            {filteredEvidence.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/80 hover:border-primary/50 transition-all shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 border border-outline-variant/50">
                      <span className="material-symbols-outlined text-xl">
                        {item.category === 'cctv' ? 'videocam' : item.category === 'photo' ? 'image' : item.category === 'financial' ? 'receipt_long' : 'mic'}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{item.id}</span>
                        <span className="text-outline-variant">•</span>
                        <h3 className="font-title-md text-sm font-bold text-on-surface hover:text-primary cursor-pointer">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-secondary border border-outline-variant/40">
                          {item.size}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-variant text-primary font-semibold">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-secondary mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Hash & Case Metadata Strip */}
                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-sm text-emerald-600">fingerprint</span>
                    <span className="text-secondary font-bold shrink-0">SHA-256:</span>
                    <span className="text-primary truncate select-all">{item.sha256}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-secondary">
                    <span>Uploaded: {item.uploadDate}</span>
                    <span>•</span>
                    <span className="text-primary font-bold">Case #{item.caseId}</span>
                  </div>
                </div>

                {/* Chain of Custody Preview Steps */}
                <div className="pt-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-secondary mb-2 flex items-center gap-1.5 font-label-sm">
                    <span className="material-symbols-outlined text-xs text-primary">history_edu</span>
                    Chain of Custody Handshake Logs ({item.chainStages.length} Nodes)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.chainStages.map((stage, idx) => (
                      <div key={idx} className="bg-surface-container-lowest p-2 rounded border border-outline-variant/50 text-[11px] flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate">{stage.title}</p>
                          <p className="text-secondary text-[10px]">{stage.by}</p>
                          <p className="font-mono text-[9px] text-slate-400 mt-0.5">{stage.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">verified</span>
                    <span>Officer Seal: <strong>{item.officer}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCertificate(item)}
                      className="px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-outline-variant flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">workspace_premium</span>
                      <span>View 65B Certificate</span>
                    </button>
                    <a
                      href="#download"
                      onClick={(e) => { e.preventDefault(); alert(`Initiating 256-bit statutory encrypted download for ${item.title}`); }}
                      className="px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Download Encrypted File</span>
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 65B CERTIFICATE MODAL                                             */}
      {/* ========================================================================= */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-[#000a24]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in">
            {/* Institutional Certificate Header */}
            <div className="bg-[#000a24] text-white p-5 border-b border-[#172342] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-tertiary-fixed/20 text-tertiary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-white">
                    Section 65B Certificate of Electronic Evidence
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Bharatiya Sakshya Adhiniyam, 2023 • CaseSync Statutory Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="border border-outline-variant/80 p-4 rounded-xl bg-surface-container-low space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-outline-variant/60 pb-2">
                  <span className="font-bold text-primary">Certificate Identifier:</span>
                  <span className="font-mono text-primary font-bold">CERT-BSA-{selectedCertificate.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-outline-variant/60 pb-2">
                  <span className="font-bold text-primary">Associated Police FIR / Crime Docket:</span>
                  <span className="font-mono font-bold text-primary">#{selectedCertificate.caseId}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-outline-variant/60 pb-2">
                  <span className="font-bold text-primary">File nomenclature &amp; Size:</span>
                  <span className="font-mono text-secondary">{selectedCertificate.title} ({selectedCertificate.size})</span>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-primary">Cryptographic SHA-256 Checksum:</span>
                  <p className="p-2 bg-surface-container-lowest rounded border border-outline-variant font-mono text-[11px] break-all text-primary select-all">
                    {selectedCertificate.sha256}
                  </p>
                </div>
              </div>

              {/* Statutory Attestation Text */}
              <div className="space-y-2 text-xs font-body-sm text-secondary leading-relaxed bg-[#f8f7f3] p-4 rounded-xl border border-outline-variant/70">
                <p className="font-semibold text-primary">Statutory Attestation under BSA Sec. 61 &amp; Sec. 65B:</p>
                <p>
                  "I hereby solemnly declare that the digital computer output / electronic record detailed above was produced by a computer / electronic device during the period over which the device was used regularly to store or process information. The electronic record satisfies all conditions of authenticity without human manipulation."
                </p>
                <div className="pt-2 flex justify-between items-center text-[11px] font-mono border-t border-outline-variant/50">
                  <span>Signatory: Ramesh Kumar Sundaram (Citizen)</span>
                  <span className="text-emerald-700 font-bold">✓ DigiLocker e-Signed</span>
                </div>
              </div>

              {/* Judicial QR Code & Seal */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-container flex items-center justify-center rounded border border-outline-variant font-mono text-[10px] text-center font-bold">
                    [QR CODE]
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Metropolitan Magistrate Bench Registry</p>
                    <p className="text-[10px] text-secondary font-mono">Patiala House Courts, New Delhi</p>
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500">
                  <p>Admissibility: CONFIRMED</p>
                  <p>Timestamp: {selectedCertificate.uploadDate}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container"
              >
                Close
              </button>
              <button
                onClick={() => { alert('Downloading Judicial Certified 65B PDF Certificate...'); }}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Download Official Certificate (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD EVIDENCE MODAL                                                     */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-[#000a24]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#000a24] text-white p-5 border-b border-[#172342] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-tertiary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-white">
                    Deposit Digital Incident Evidence
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Directly Encrypted to Investigating Officer Docket
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* Linked Case selection */}
              <div>
                <label className="block text-xs font-bold text-primary font-label-md uppercase tracking-wider mb-1">
                  Target Case / Docket
                </label>
                <select
                  value={selectedCase === 'all' ? 'FIR-DL-2025-4401' : selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="FIR-DL-2025-4401">#FIR-DL-2025-4401 • Theft &amp; Housebreaking (Vasant Vihar PS)</option>
                  <option value="CR-2025-0982">#CR-2025-0982 • Phishing Cyber Fraud (Cyber Cell)</option>
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-primary font-label-md uppercase tracking-wider mb-1">
                  Evidence Label / File Descriptor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV_Backyard_Entry_Angle2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-primary font-label-md uppercase tracking-wider mb-1">
                  Statutory Classification
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="cctv">CCTV / Surveillance Video Recording</option>
                  <option value="photo">Physical Evidence / Scene Photograph</option>
                  <option value="financial">Bank Statement / Call Detail Record (CDR)</option>
                  <option value="audio">Witness Audio Testimony</option>
                </select>
              </div>

              {/* Drag and drop simulation area */}
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-5 text-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
                <p className="text-xs font-bold text-primary mt-1">Click to select file or drag here</p>
                <p className="text-[11px] text-secondary mt-0.5">MP4, MOV, PDF, JPG, PNG, WAV (Max 100 MB per deposit)</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-primary font-label-md uppercase tracking-wider mb-1">
                  Contextual Statement / Camera Location Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Explain device location, camera angle, or eyewitness present during recording..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                ></textarea>
              </div>

              {/* Affirmation */}
              <div className="flex items-start gap-2 bg-[#f8f7f3] p-3 rounded-lg border border-outline-variant/60">
                <input
                  type="checkbox"
                  id="affirm"
                  required
                  checked={isAffirmed}
                  onChange={(e) => setIsAffirmed(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="affirm" className="text-[11px] text-secondary leading-snug cursor-pointer">
                  I solemnly affirm that this electronic record is genuine and has not been altered or doctored. I am willing to tender Section 65B BSA deposition in court if summoned.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAffirmed || !newTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Sign &amp; Deposit to IO Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default EvidenceVaultPage;
