import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { trackingApi } from '../lib/api';

export function LiveTrackingPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('trackingId') || '';

  const [queryInput, setQueryInput] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Feedback State for Closed Cases
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Status mapping for progress stepper
  const statusOrder = [
    { key: 'SUBMITTED', label: 'Complaint Intake', icon: 'mark_email_read' },
    { key: 'UNDER_REVIEW', label: 'Station Triage', icon: 'rate_review' },
    { key: 'REGISTERED', label: 'FIR Registered', icon: 'local_police' },
    { key: 'UNDER_INVESTIGATION', label: 'Investigation', icon: 'manage_search' },
    { key: 'CHARGESHEETED', label: 'Chargesheet / Court', icon: 'gavel' },
    { key: 'CLOSED', label: 'Disposed / Closed', icon: 'task_alt' }
  ];

  const getActiveStepIndex = (status) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED': return 0;
      case 'UNDER_REVIEW':
      case 'REVIEW_IN_PROGRESS':
      case 'INFO_REQUESTED': return 1;
      case 'REGISTERED': return 2;
      case 'UNDER_INVESTIGATION':
      case 'REOPENED': return 3;
      case 'CHARGESHEETED':
      case 'CHARGESHEET_SUBMITTED':
      case 'CLOSURE_REQUESTED': return 4;
      case 'CLOSED':
      case 'REJECTED': return 5;
      default: return 1;
    }
  };

  const handleSearch = async (targetId) => {
    const searchId = (targetId || queryInput).trim();
    if (!searchId) return;
    setErrorMsg('');
    setLoading(true);
    setCaseData(null);
    setTimelineEvents([]);

    try {
      const res = await trackingApi.trackPublic(searchId);
      const data = res?.data || res;
      setCaseData(data);

      // If we have a fir_id, attempt to fetch full timeline
      if (data?.fir_id) {
        try {
          const tlRes = await trackingApi.getTimeline(data.fir_id);
          setTimelineEvents(tlRes?.data?.timeline || tlRes?.data || []);
        } catch {
          // Public users might not have full timeline permissions, fallback gracefully
          setTimelineEvents([]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Docket not found. Please verify your Tracking ID or FIR number.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!caseData?.fir_id) return;
    try {
      setFeedbackLoading(true);
      await trackingApi.submitFeedback(caseData.fir_id, {
        rating,
        comments: feedbackComments
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Could not submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const currentStepIdx = caseData ? getActiveStepIndex(caseData.status) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between text-xs text-secondary pb-3 border-b border-outline-variant/60">
          <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-primary font-bold">Encrypted Public Inquiry Service</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Live Case &amp; FIR Tracking
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-3xl leading-relaxed">
            Enter your Tracking ID or official FIR number to view real-time investigation milestones, assigned investigating officers, and statutory timelines.
          </p>
        </div>

        {/* Search Bar & Quick Chips */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-3 text-secondary text-lg">
                search
              </span>
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. TRK-2026-PS01-00001 or CMP-2026-000071)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-outline-variant bg-surface-container-low text-xs sm:text-sm text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-xs font-mono transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="interactive-btn w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-container shadow-sm cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">radar</span>
                  <span>Track Docket</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-secondary text-[11px] font-medium">Quick Sample IDs:</span>
            {['TRK-2026-PS01-00001', 'CMP-2026-000071', 'FIR-2026-DEL-00041'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQueryInput(sample);
                  handleSearch(sample);
                }}
                className="interactive-btn px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-variant border border-outline-variant/60 font-mono text-[11px] text-primary transition-all cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs flex items-center gap-2.5 border border-error/20"
          >
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Live Case Dossier Display */}
        {caseData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Stepper Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/60 pb-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-secondary font-semibold">
                    Official Reference Number
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">
                    {caseData.fir_number || caseData.tracking_id}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-primary text-white shadow-xs">
                    {caseData.status}
                  </span>
                  <span className="text-xs text-secondary font-mono bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/60">
                    BNSS Sec. 154
                  </span>
                </div>
              </div>

              {/* Progress Milestones Stepper */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">linear_scale</span>
                  <span>Statutory Investigation Milestones</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {statusOrder.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-primary text-white border-primary shadow-sm font-bold scale-[1.02]'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-surface-container-low text-secondary border-outline-variant/60 opacity-65 font-normal'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1 block">
                          {step.icon}
                        </span>
                        <div className="text-[11px] leading-tight font-medium">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Balanced 2-Column Grid on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Dossier Particulars & Timeline (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Core Incident Particulars */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-outline-variant/60 pb-3">
                    <span className="material-symbols-outlined text-base text-primary">description</span>
                    Incident Statement &amp; Docket Particulars
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs">
                    <div>
                      <span className="text-secondary text-[10px] uppercase font-mono block">Station Jurisdiction</span>
                      <strong className="text-primary font-bold">{caseData.station_name || 'Central Police Station'}</strong>
                      {caseData.station_phone && (
                        <div className="text-[11px] text-secondary font-mono mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{caseData.station_phone}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-secondary text-[10px] uppercase font-mono block">Incident Date</span>
                      <strong className="text-primary font-bold">
                        {caseData.incident_date ? new Date(caseData.incident_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-secondary text-[10px] uppercase font-mono block">Location / Place</span>
                      <strong className="text-primary font-bold truncate block" title={caseData.incident_place}>
                        {caseData.incident_place || 'Not recorded'}
                      </strong>
                    </div>
                  </div>

                  {caseData.incident_description && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-secondary text-xs font-semibold">Incident Narrative Summary:</span>
                      <p className="text-xs text-primary leading-relaxed p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40">
                        {caseData.incident_description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Case Timeline Events (if available) */}
                {timelineEvents.length > 0 && (
                  <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b pb-3 border-outline-variant/60">
                      <span className="material-symbols-outlined text-base text-primary">history</span>
                      Chronological Case Progression Timeline
                    </h3>
                    <div className="space-y-3.5 pl-2">
                      {timelineEvents.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3.5 text-xs relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-primary/20"></div>
                          <div className="flex-1 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-1">
                            <div className="font-bold text-primary text-xs">{ev.event_title || ev.action || ev.status}</div>
                            <p className="text-secondary text-[11px] leading-relaxed">{ev.details || ev.note || ev.description}</p>
                            <span className="text-[10px] text-secondary font-mono block pt-0.5">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed Case Feedback Form */}
                {(caseData.status === 'CLOSED' || caseData.status === 'CHARGESHEETED') && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-amber-500">hotel_class</span>
                      Citizen Grievance &amp; Satisfaction Feedback
                    </h3>
                    {feedbackSubmitted ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                        Thank you. Your feedback has been registered with the Station House Officer and District Vigilance Desk.
                      </div>
                    ) : (
                      <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-primary mb-2">
                            Rate Police Handling &amp; Investigation (1 to 5 Stars)
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setRating(s)}
                                className={`interactive-btn px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                                  rating >= s
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                                    : 'bg-surface-container-low text-secondary border-outline-variant hover:border-amber-300'
                                }`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm align-middle">star</span>
                                  <span>{s} Star{s > 1 ? 's' : ''}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-primary mb-1.5">
                            Optional Comments on Investigation Transparency
                          </label>
                          <textarea
                            rows={3}
                            value={feedbackComments}
                            onChange={(e) => setFeedbackComments(e.target.value)}
                            placeholder="Share your experience regarding responsiveness and adherence to statutory timelines..."
                            className="w-full p-3 rounded-2xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={feedbackLoading}
                          className="interactive-btn px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs cursor-pointer"
                        >
                          {feedbackLoading ? 'Submitting...' : 'Submit Satisfaction Rating'}
                        </motion.button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Station & Officer Cards, Quick Actions (4 cols) */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                {/* Investigating Officer Card */}
                {caseData.assigned_io ? (
                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-3 interactive-card">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-secondary font-semibold block">
                      Assigned Investigation Officer
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-2xl">badge</span>
                      </div>
                      <div>
                        <strong className="text-sm text-primary font-bold block">
                          {caseData.assigned_io.name || caseData.assigned_io}
                        </strong>
                        <span className="text-[11px] text-secondary">Investigating Officer (IO)</span>
                      </div>
                    </div>
                    {caseData.assigned_io.phone && (
                      <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                        <span className="text-secondary">Official Contact:</span>
                        <a href={`tel:${caseData.assigned_io.phone}`} className="font-mono text-primary font-bold hover:underline inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{caseData.assigned_io.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-secondary font-semibold block">
                      Investigating Officer
                    </span>
                    <p className="text-xs text-secondary leading-relaxed">
                      Officer assignment in progress under Station House Officer (SHO) triage.
                    </p>
                  </div>
                )}

                {/* Station Jurisdiction Card */}
                <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-3 interactive-card">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-secondary font-semibold block">
                    Territorial Police Station
                  </span>
                  <div className="space-y-1">
                    <strong className="text-sm font-bold text-primary block">{caseData.station_name || 'Central Police Station'}</strong>
                    <span className="text-xs text-secondary block">{caseData.district || 'Metropolitan Police Division'}</span>
                  </div>
                  {caseData.station_phone && (
                    <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                      <span className="text-secondary">Duty Officer Desk:</span>
                      <a href={`tel:${caseData.station_phone}`} className="font-mono text-primary font-bold hover:underline inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">call</span>
                        <span>{caseData.station_phone}</span>
                      </a>
                    </div>
                  )}
                  <Link
                    to="/appointments"
                    className="interactive-btn w-full mt-2 py-2 rounded-xl bg-surface-container-low hover:bg-surface-variant border border-outline-variant text-center text-xs font-semibold text-primary block transition-colors"
                  >
                    Schedule Station CFC Visit
                  </Link>
                </div>

                {/* Grievance / Supervisory Recourse */}
                <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <span className="material-symbols-outlined text-base text-primary">balance</span>
                    <span>Delays or Dissatisfaction?</span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Under BNSS Section 154(3), if investigation exceeds statutory time limits without update, you have the right to lodge a supervisory petition with the ACP/DCP.
                  </p>
                  <Link
                    to="/grievance"
                    className="interactive-btn text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Lodge Supervisory Grievance</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default LiveTrackingPage;
