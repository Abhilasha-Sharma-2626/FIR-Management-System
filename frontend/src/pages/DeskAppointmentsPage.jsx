import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import Navbar from '../components/layout/Navbar';

export function DeskAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'book' | 'history'
  const [showPassModal, setShowPassModal] = useState(false);
  const [bookSuccessToast, setBookSuccessToast] = useState(false);

  // New Booking Form States
  const [selectedStation, setSelectedStation] = useState('PS-SW-04');
  const [visitPurpose, setVisitPurpose] = useState('statement');
  const [selectedDate, setSelectedDate] = useState('2025-05-23');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:30 AM');
  const [linkedCase, setLinkedCase] = useState('FIR-DL-2025-4401');
  const [hasCompanion, setHasCompanion] = useState(false);
  const [companionName, setCompanionName] = useState('');
  const [visitorNotes, setVisitorNotes] = useState('');

  const [appointments, setAppointments] = useState([
    {
      id: 'APT-SW-2025-0814',
      station: 'Vasant Vihar Police Station (PS-SW-04)',
      address: 'Community Centre, Sector-C, Vasant Vihar, New Delhi - 110057',
      officer: 'Insp. Rajesh K. Sharma (Badge #DL-4412)',
      desk: 'Desk #03 • Special Investigation Cell',
      purpose: 'Sec. 180 BNSS Statement Recording & Stolen Property Identification',
      date: 'Tomorrow, 22 May 2025',
      time: '03:30 PM - 04:00 PM',
      caseId: 'FIR-DL-2025-4401',
      status: 'CONFIRMED',
      statusColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60',
      qrCodeId: 'QR-PASS-814-SW',
    },
  ]);

  const handleBookSubmit = (e) => {
    e.preventDefault();
    const newApt = {
      id: `APT-SW-2025-08${appointments.length + 15}`,
      station: selectedStation === 'PS-SW-04' ? 'Vasant Vihar Police Station (PS-SW-04)' : 'South West District Cyber Cell',
      address: 'Community Centre, Sector-C, Vasant Vihar, New Delhi - 110057',
      officer: 'Station Facilitation Desk Officer',
      desk: 'Desk #01 • Public Citizen Facilitation Counter',
      purpose: visitPurpose === 'statement' ? 'Sec. 180 BNSS Statement Recording' : visitPurpose === 'property' ? 'Seized Stolen Property Inspection' : 'IO Liaison & Case Inquiry',
      date: selectedDate,
      time: selectedTimeSlot,
      caseId: linkedCase,
      status: 'CONFIRMED',
      statusColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60',
      qrCodeId: `QR-PASS-${Math.floor(100 + Math.random() * 900)}`,
    };

    setAppointments([newApt, ...appointments]);
    setActiveTab('upcoming');
    setBookSuccessToast(true);
    setTimeout(() => setBookSuccessToast(false), 4500);
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary">
      {/* Dashboard Sidebar on Desktop */}
      <DashboardSidebar activeNav="appointments" />

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
            <span className="text-primary font-bold">Police Station Desk Appointments</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none"></span>
              <span>Fast-Track QR Entry Kiosk Enabled</span>
            </div>
            <button
              onClick={() => setActiveTab('book')}
              className="px-3.5 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>+ Book Station Desk</span>
            </button>
          </div>
        </header>

        {/* Toast */}
        {bookSuccessToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950 border border-emerald-600/60 rounded-lg text-emerald-200 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <span><strong>Station Appointment Booked!</strong> QR Entry Pass generated. Present at station gate for zero-wait clearance.</span>
            </div>
            <button onClick={() => setBookSuccessToast(false)} className="text-emerald-400 hover:text-white cursor-pointer p-1">✕</button>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Police Station Desk Appointments
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-variant text-on-secondary-fixed-variant rounded border border-outline-variant/70 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px]">event_available</span>
                  <span>Citizen Facilitation Counter (CFC)</span>
                </span>
              </div>
              <p className="font-body-md text-xs sm:text-sm text-secondary max-w-3xl">
                Skip queues with pre-scheduled visits to your territorial police station for statement depositions, case officer consultations, and stolen property claim inspections.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('book')}
                className="px-4 py-2.5 bg-primary text-white font-title-md text-xs rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm font-semibold whitespace-nowrap cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">calendar_add_on</span>
                <span>Schedule New Visit</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Upcoming Visits</span>
                <span className="material-symbols-outlined text-lg text-primary">event_upcoming</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">{appointments.length} Confirmed</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">PS Vasant Vihar</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Next Slot</span>
                <span className="material-symbols-outlined text-lg text-primary">schedule</span>
              </div>
              <p className="font-headline-md text-xl font-bold text-primary mt-1 font-mono">Tomorrow 03:30 PM</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Insp. Rajesh K. Sharma</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Desk Clearance SLA</span>
                <span className="material-symbols-outlined text-lg text-emerald-600">bolt</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-emerald-700 mt-1">&lt; 8 Mins</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">Average Gate-to-Desk Time</p>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-[11px] font-bold">Completed Visits</span>
                <span className="material-symbols-outlined text-lg text-primary">history</span>
              </div>
              <p className="font-headline-md text-2xl font-bold text-primary mt-1">03 Disposed</p>
              <p className="font-body-sm text-[11px] text-secondary mt-0.5">All Statements Recorded</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-outline-variant flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Upcoming Appointments</span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-mono">{appointments.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('book')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'book'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Book New Appointment</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span>Station Visit History</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: UPCOMING APPOINTMENTS                                          */}
          {/* ===================================================================== */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 shadow-sm p-6 space-y-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-2xl text-tertiary-fixed">apartment</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{apt.id}</span>
                          <span className="text-outline-variant">•</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${apt.statusColor}`}>
                            {apt.status}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface mt-0.5">
                          {apt.station}
                        </h3>
                        <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                          {apt.address}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right font-mono text-xs text-primary bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60 shrink-0">
                      <p className="font-bold text-sm text-primary">{apt.date}</p>
                      <p className="text-secondary">{apt.time}</p>
                    </div>
                  </div>

                  {/* Visit Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs">
                    <div>
                      <span className="text-secondary font-medium">Designated Desk:</span>
                      <p className="font-bold text-primary mt-0.5">{apt.desk}</p>
                      <p className="text-[11px] text-secondary">{apt.officer}</p>
                    </div>

                    <div>
                      <span className="text-secondary font-medium">Visit Purpose:</span>
                      <p className="font-semibold text-primary mt-0.5">{apt.purpose}</p>
                      <p className="text-[11px] font-mono text-secondary">Linked: #{apt.caseId}</p>
                    </div>

                    <div>
                      <span className="text-secondary font-medium">Clearance Checklist:</span>
                      <p className="text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Aadhaar e-KYC Verified
                      </p>
                      <p className="text-[11px] text-secondary">Carry original photo ID and summons copy</p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="pt-2 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setShowPassModal(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                      <span>Show QR Entry Gate Pass</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`Reschedule request initiated for ${apt.id}. Choose a new slot.`)}
                        className="px-3.5 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container"
                      >
                        Reschedule Slot
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this station appointment?')) {
                            setAppointments(appointments.filter(a => a.id !== apt.id));
                          }
                        }}
                        className="px-3.5 py-2 border border-error/40 text-error hover:bg-error/10 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: BOOK NEW APPOINTMENT FORM                                      */}
          {/* ===================================================================== */}
          {activeTab === 'book' && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm max-w-3xl">
              <div className="border-b border-outline-variant pb-4 mb-6">
                <h3 className="font-headline-sm text-lg font-bold text-primary">
                  Schedule Station House Officer / Desk Liaison
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Select your territorial police jurisdiction, purpose of visit, and preferred 30-minute time slot.
                </p>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-5">
                {/* 1. Target Station */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">
                    1. Territorial Police Station Jurisdiction *
                  </label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="PS-SW-04">Vasant Vihar Police Station (PS-DL-SW-04) - Primary Station (0.8 km)</option>
                    <option value="PS-SW-05">R.K. Puram Police Station (PS-DL-SW-05) - Contiguous Station (2.3 km)</option>
                    <option value="CYBER-SW">District Cyber Crime Cell, South West District (Sector-19 Dwarka)</option>
                    <option value="CAW-SW">Crime Against Women (CAW) Special Cell (Nanak Pura)</option>
                  </select>
                </div>

                {/* 2. Visit Purpose */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">
                    2. Statutory Purpose of Visit *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'statement', label: 'Sec. 180 BNSS Statement Recording', desc: 'Formal deposition regarding filed FIR' },
                      { id: 'property', label: 'Seized Stolen Property Inspection', desc: 'Identify recovered assets or jewelry' },
                      { id: 'io_meet', label: 'Investigating Officer (IO) Consultation', desc: 'Status review with Insp. Rajesh Sharma' },
                      { id: 'verification', label: 'Tenant / Domestic Staff Verification', desc: 'Submit character & antecedent slips' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                          visitPurpose === opt.id
                            ? 'bg-surface-container-high border-primary text-primary'
                            : 'bg-surface-container-low border-outline-variant/60 text-secondary hover:border-outline-variant'
                        }`}
                      >
                        <input
                          type="radio"
                          name="purpose"
                          value={opt.id}
                          checked={visitPurpose === opt.id}
                          onChange={(e) => setVisitPurpose(e.target.value)}
                          className="mt-0.5 text-primary focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <p className="font-title-md text-xs font-bold text-primary">{opt.label}</p>
                          <p className="text-[11px] text-secondary mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Linked Case Reference */}
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">
                    3. Associated Crime Docket / FIR Reference
                  </label>
                  <select
                    value={linkedCase}
                    onChange={(e) => setLinkedCase(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono font-medium outline-none"
                  >
                    <option value="FIR-DL-2025-4401">#FIR-DL-2025-4401: Theft &amp; Housebreaking</option>
                    <option value="CR-2025-0982">#CR-2025-0982: Phishing Cyber Fraud</option>
                    <option value="NONE">General Citizen Consultation (No Prior Case)</option>
                  </select>
                </div>

                {/* 4. Date & Time Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1.5">
                      4. Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary mb-1.5">
                      5. Time Slot *
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium outline-none"
                    >
                      <option value="10:00 AM">10:00 AM - 10:30 AM (Morning Session)</option>
                      <option value="11:30 AM">11:30 AM - 12:00 PM (Morning Session)</option>
                      <option value="02:30 PM">02:30 PM - 03:00 PM (Afternoon Session)</option>
                      <option value="03:30 PM">03:30 PM - 04:00 PM (Afternoon Session)</option>
                      <option value="05:00 PM">05:00 PM - 05:30 PM (Evening Session)</option>
                    </select>
                  </div>
                </div>

                {/* Companion details */}
                <div className="space-y-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="comp"
                      checked={hasCompanion}
                      onChange={(e) => setHasCompanion(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="comp" className="text-xs font-semibold text-primary cursor-pointer">
                      Accompanying Legal Counsel / Family Companion
                    </label>
                  </div>
                  {hasCompanion && (
                    <input
                      type="text"
                      placeholder="Enter Advocate / Companion Full Name & Bar ID / Aadhaar"
                      value={companionName}
                      onChange={(e) => setCompanionName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium outline-none mt-2"
                    />
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upcoming')}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Confirm &amp; Generate QR Visitor Pass
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: STATION VISIT HISTORY                                          */}
          {/* ===================================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {[
                {
                  id: 'APT-HIST-2025-01',
                  date: '14 May 2025 • 04:00 PM',
                  station: 'Vasant Vihar PS (Desk #02)',
                  officer: 'Sub-Inspector Anil Rawat',
                  purpose: 'Preliminary Verification Statement for FIR-DL-2025-4401',
                  outcome: 'Statement endorsed & appended to Case Diary Part-II',
                },
                {
                  id: 'APT-HIST-2024-88',
                  date: '20 Nov 2024 • 11:00 AM',
                  station: 'Mandir Marg Cyber Cell',
                  officer: 'Cyber Forensics Unit Officer',
                  purpose: 'Digital Wallet Statement Authentication',
                  outcome: 'Bank freeze slip dispatched to nodal authority',
                },
              ].map((h) => (
                <div key={h.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{h.id}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-mono text-xs text-secondary">{h.date}</span>
                    </div>
                    <h4 className="font-title-md text-xs font-bold text-primary mt-0.5">{h.purpose}</h4>
                    <p className="text-[11px] text-secondary">{h.station} • Handled by {h.officer}</p>
                    <p className="text-[11px] text-emerald-800 font-medium mt-1">✓ {h.outcome}</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading visit minutes for ${h.id}`)}
                    className="px-3 py-1.5 rounded border border-outline-variant text-xs font-semibold text-primary hover:bg-surface-container shrink-0 self-end sm:self-center"
                  >
                    View Minutes
                  </button>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* QR PASS MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-fade-in text-center">
            <div className="bg-primary text-white p-4">
              <h3 className="font-bold text-sm">Station Visitor Digital Fast-Pass</h3>
              <p className="text-[10px] text-slate-300">Vasant Vihar Police Station (Gate Kiosk)</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="w-36 h-36 mx-auto bg-surface-container border-2 border-dashed border-primary flex items-center justify-center rounded-xl text-xs text-secondary">
                [Gate QR Code]
              </div>
              <div>
                <p className="font-bold text-primary text-sm">Ramesh Kumar Sundaram</p>
                <p className="text-xs text-secondary">Booking Ref: <span className="font-mono">APT-SW-2025-0814</span></p>
                <p className="text-xs font-bold text-emerald-700 mt-1">Tomorrow 03:30 PM • Desk #03</p>
              </div>
              <p className="text-[10px] text-secondary bg-surface-container-low p-2 rounded">
                Scan this barcode directly at the Vasant Vihar reception turnstile kiosk.
              </p>
            </div>
            <div className="p-3 bg-surface-container-low border-t border-outline-variant">
              <button
                onClick={() => setShowPassModal(false)}
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container cursor-pointer whitespace-nowrap"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DeskAppointmentsPage;
