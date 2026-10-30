import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { trackingApi, complaintsApi } from '../lib/api';

export function DashboardLiveTrackingPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('trackingId') || '';

  const [queryInput, setQueryInput] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [myDockets, setMyDockets] = useState([]);

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
    { key: 'UNDER_INVESTIGATION', label: 'Active Investigation', icon: 'manage_search' },
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
      case 'ASSIGNED':
      case 'UNDER_INVESTIGATION':
      case 'REOPENED': return 3;
      case 'PENDING_APPROVAL':
      case 'CHARGESHEET_FILED':
      case 'CHARGESHEETED': return 4;
      case 'CLOSED':
      case 'REJECTED': return 5;
      default: return 1;
    }
  };

  // Load user's own dockets for quick select
  useEffect(() => {
    async function loadMyCases() {
      try {
        const res = await complaintsApi.getMyComplaints();
        const list = res?.data || res || [];
        setMyDockets(Array.isArray(list) ? list : []);
        // Auto-select first docket if no query in url
        if (!initialId && list.length > 0) {
          const first = list[0].tracking_id || list[0].fir_number || list[0].fir_id;
          setQueryInput(first);
          handleSearch(first);
        }
      } catch (err) {
        console.warn('Could not load user dockets for quick select:', err);
      }
    }
    loadMyCases();
  }, [initialId]);

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

      if (data?.fir_id) {
        try {
          const tlRes = await trackingApi.getTimeline(data.fir_id);
          setTimelineEvents(tlRes?.data?.timeline || tlRes?.data || []);
        } catch {
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
      setQueryInput(initialId);
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

  const activeIndex = getActiveStepIndex(caseData?.status);

  return (
    <div className="min-h-screen flex bg-ivory text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="live-tracking" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Portal Workspace</Link>
            <span className="text-slate-300">/</span>
            <span className="text-blue-950 font-bold">Live Case Tracking</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors active:bg-slate-100"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Dossiers</span>
            </Link>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header Card */}
          <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/20 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-900 text-2xl">radar</span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  State-Machine Case Tracking Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Real-Time SLA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Observe chronological case diary events, jurisdictional triage decisions, and designated Investigating Officer milestones under statutory audit logging.
              </p>
            </div>

            {/* Tracking Search Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex items-center gap-2 shrink-0">
              <div className="relative w-64 sm:w-72">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-base">search</span>
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Enter Tracking ID or FIR..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none"></span> : <span className="material-symbols-outlined text-sm">travel_explore</span>}
                <span>Track</span>
              </button>
            </form>
          </section>

          {/* Quick Selector Pills from User's Registered Dockets */}
          {myDockets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold text-[11px] mr-1">Your Dockets:</span>
              {myDockets.map((d) => {
                const docketId = d.fir_number || d.tracking_id;
                const isSelected = queryInput === docketId || queryInput === d.tracking_id || queryInput === d.fir_number;
                return (
                  <button
                    key={d.fir_id}
                    type="button"
                    onClick={() => {
                      setQueryInput(docketId);
                      handleSearch(docketId);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{docketId}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-sans font-bold opacity-80 bg-black/10">
                      {d.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-rose-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-16 text-center text-xs text-slate-500 space-y-3 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin motion-reduce:animate-none mx-auto"></div>
              <p className="font-semibold text-slate-700">Retrieving case record from Police Station database…</p>
            </div>
          )}

          {/* Case Tracking Results View */}
          {!loading && caseData && (
            <div className="space-y-6">
              
              {/* Stepper Progress Bar */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-mono">
                      <span className="text-xs text-slate-500 font-sans font-normal mr-2">Docket:</span>
                      {caseData.fir_number || caseData.tracking_id}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Current Phase:</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-950 border border-blue-200">
                      {caseData.status}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="relative">
                  <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 z-0">
                    <div
                      className="h-full bg-blue-900"
                      style={{ width: `${(Math.min(activeIndex, 5) / 5) * 100}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                    {statusOrder.map((step, idx) => {
                      const isCompleted = idx < activeIndex;
                      const isCurrent = idx === activeIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold transition-transform shadow-2xs ${
                              isCurrent
                                ? 'bg-blue-900 text-white ring-4 ring-blue-100 scale-110'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isCompleted ? 'check' : step.icon}
                            </span>
                          </div>
                          <div>
                            <span className={`text-[11px] font-bold block ${isCurrent ? 'text-blue-950 font-black' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                              {step.label}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Phase 0{idx + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Case Particulars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Station & Legal Sections */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-blue-900 text-lg">shield</span>
                    <h3 className="text-xs font-bold text-slate-900">Station &amp; Authority</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jurisdiction Police Station</span>
                      <strong className="text-slate-900">{caseData.station_name || 'Central Police Station'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Incident Date &amp; Time</span>
                      <strong className="text-slate-900 font-mono">
                        {caseData.incident_dt ? new Date(caseData.incident_dt).toLocaleString() : 'Recent'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Incident Location</span>
                      <strong className="text-slate-900">{caseData.location_text || 'Jurisdictional District'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Crime Category</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {caseData.category_name || 'General Offence'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Investigating Officer Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-blue-900 text-lg">badge</span>
                    <h3 className="text-xs font-bold text-slate-900">Designated Officer</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {caseData.io_name ? (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                            {caseData.io_name.split(' ').map(n=>n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <strong className="text-slate-900 text-sm block">{caseData.io_name}</strong>
                            <span className="text-[11px] text-blue-800 font-medium">Badge #{caseData.io_badge}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Designation / Rank</span>
                          <span className="font-semibold text-slate-800">{caseData.io_rank || 'Sub-Inspector'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Officer is actively maintaining the Case Diary under Section 175 of the BNSS.
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                        <span className="material-symbols-outlined text-2xl text-slate-400">person_search</span>
                        <div className="font-semibold text-slate-800">Station Triage Desk</div>
                        <p className="text-[11px] text-slate-500">
                          The complaint is currently reviewed by the Duty Officer. An Investigating Officer will be assigned upon SHO approval.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence & Exhibits */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-blue-900 text-lg">lock_person</span>
                    <h3 className="text-xs font-bold text-slate-900">Evidence &amp; Vault</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Digital and physical exhibits collected during investigation are officially logged to the Malkhana chain of custody.
                    </p>
                    <Link
                      to="/dashboard/evidence"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      <span>Access Evidence Vault</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Status Timeline Events */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-900 text-lg">timeline</span>
                    <h3 className="text-xs font-bold text-slate-900">Case Diary &amp; Milestones</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {timelineEvents.length} Recorded Milestone{timelineEvents.length === 1 ? '' : 's'}
                  </span>
                </div>

                {timelineEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No milestone updates recorded yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="relative space-y-1">
                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-900 ring-4 ring-blue-50"></span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {evt.from_state ? `${evt.from_state} → ${evt.to_state}` : evt.to_state}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {evt.created_at ? new Date(evt.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                        {evt.note && <p className="text-xs text-slate-600">{evt.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Citizen Feedback Rating on Closed Cases */}
              {['CLOSED', 'CHARGESHEETED', 'CHARGESHEET_FILED'].includes(caseData.status) && (
                <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">reviews</span>
                    <span>Informant Service Evaluation</span>
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    This docket has been formally disposed of. In accordance with public service transparency protocols, please rate the professionalism, timeliness, and communication of the investigating unit.
                  </p>

                  {feedbackSubmitted ? (
                    <div className="p-4 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                      <span>Thank you. Your feedback has been recorded in the police vigilance register.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-950">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-1 rounded-lg text-lg cursor-pointer transition-colors active:scale-95 ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                            aria-label={`Rate ${star} stars`}
                          >
                            <span className="material-symbols-outlined text-xl align-middle">
                              {star <= rating ? 'star' : 'star_border'}
                            </span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Provide optional remarks regarding the station handling..."
                        className="w-full p-3 rounded-xl border border-emerald-200 bg-white text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                      />
                      <button
                        type="submit"
                        disabled={feedbackLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-bold transition-colors shadow-xs whitespace-nowrap cursor-pointer"
                      >
                        {feedbackLoading ? 'Submitting...' : 'Submit Official Rating'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardLiveTrackingPage;
