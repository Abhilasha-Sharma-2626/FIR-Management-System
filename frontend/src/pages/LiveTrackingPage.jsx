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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between text-xs text-secondary pb-2 border-b border-outline-variant/60">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
          <span className="font-mono text-primary font-bold">Encrypted Public Inquiry Service</span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Live Case &amp; FIR Tracking
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Enter your Tracking ID (e.g., <span className="font-mono font-medium text-primary">TRK-2026-PS01-00001</span> or <span className="font-mono font-medium text-primary">CMP-2026-000071</span>) to view real-time investigation milestones.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary text-lg">
              search
            </span>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter Tracking ID or FIR Number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">radar</span>
                <span>Track Docket</span>
              </>
            )}
          </button>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Case Dossier Display */}
        {caseData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Status Card */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 pb-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-secondary">
                    Official Reference
                  </div>
                  <div className="text-lg font-bold text-primary font-mono">
                    {caseData.fir_number || caseData.tracking_id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-primary text-white">
                    {caseData.status}
                  </span>
                </div>
              </div>

              {/* Progress Milestones Stepper */}
              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {statusOrder.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-primary text-white border-primary shadow-xs font-bold'
                            : isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-surface-container-low text-secondary border-outline-variant/60 opacity-60 font-normal'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg mb-1">
                          {step.icon}
                        </span>
                        <div className="text-[10px] leading-tight">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Core Incident Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">Police Station:</span>
                  <strong className="text-primary">{caseData.station_name || 'Central PS'}</strong>
                  {caseData.station_phone && (
                    <div className="text-[10px] text-secondary font-mono">📞 {caseData.station_phone}</div>
                  )}
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">Incident Date:</span>
                  <strong className="text-primary">
                    {caseData.incident_date ? new Date(caseData.incident_date).toLocaleDateString('en-IN') : 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">Location:</span>
                  <strong className="text-primary truncate block" title={caseData.incident_place}>
                    {caseData.incident_place || 'Not recorded'}
                  </strong>
                </div>
              </div>

              {caseData.assigned_io && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-base">badge</span>
                    Assigned Investigating Officer: {caseData.assigned_io.name || caseData.assigned_io}
                  </span>
                  {caseData.assigned_io.phone && (
                    <span className="font-mono text-xs">📞 {caseData.assigned_io.phone}</span>
                  )}
                </div>
              )}
            </div>

            {/* Case Timeline Events (if available) */}
            {timelineEvents.length > 0 && (
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b pb-2 border-outline-variant/60">
                  <span className="material-symbols-outlined text-base">history</span>
                  Chronological Case Progression Timeline
                </h3>
                <div className="space-y-3">
                  {timelineEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                      <div className="flex-1 space-y-0.5">
                        <div className="font-semibold text-primary">{ev.event_title || ev.action || ev.status}</div>
                        <p className="text-secondary text-[11px]">{ev.details || ev.note || ev.description}</p>
                        <span className="text-[10px] text-secondary font-mono">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Closed Case Feedback Form */}
            {(caseData.status === 'CLOSED' || caseData.status === 'CHARGESHEETED') && (
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-500">hotel_class</span>
                  Citizen Grievance &amp; Satisfaction Feedback
                </h3>
                {feedbackSubmitted ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                    Thank you. Your feedback has been registered with the Station House Officer and District Vigilance Desk.
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">
                        Rate Police Handling &amp; Investigation (1 to 5 Stars)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setRating(s)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              rating >= s
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-surface-container-low text-secondary border-outline-variant'
                            }`}
                          >
                            ★ {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">
                        Optional Comments on Investigation Transparency
                      </label>
                      <textarea
                        rows={2}
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Share your experience regarding responsiveness and adherence to statutory timelines..."
                        className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={feedbackLoading}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container"
                    >
                      {feedbackLoading ? 'Submitting...' : 'Submit Satisfaction Rating'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default LiveTrackingPage;
