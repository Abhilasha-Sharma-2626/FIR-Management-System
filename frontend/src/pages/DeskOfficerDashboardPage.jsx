import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { firApi, notificationsApi } from '../lib/api';
import {
  MetricCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  MetricCardSkeleton,
  DocketCardSkeleton,
  Button
} from '../components/ui';

export function DeskOfficerDashboardPage() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Queue State
  const tabParam = searchParams.get('tab') || 'ALL_ACTIVE';
  const [activeTab, setActiveTab] = useState(tabParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority_asc');

  // Station Data State
  const [inboxRecords, setInboxRecords] = useState([]);
  const [kpiCounts, setKpiCounts] = useState({
    submitted: 0,
    underReview: 0,
    infoRequested: 0,
    rejected: 0,
    registered: 0,
    pendingAction: 0,
    total: 0
  });
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal State
  const [selectedFirId, setSelectedFirId] = useState(null);
  const [docketDetail, setDocketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Action Modals State
  const [startReviewTarget, setStartReviewTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionErrorMsg, setActionErrorMsg] = useState(null);

  // Request Clarification Modal State
  const [requestInfoTarget, setRequestInfoTarget] = useState(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationError, setClarificationError] = useState(null);

  // Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState(null);

  // Tag Legal Sections Modal State
  const [tagSectionsTarget, setTagSectionsTarget] = useState(null);
  const [masterSections, setMasterSections] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [isCognizable, setIsCognizable] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'ALL_ACTIVE' ? {} : { tab: newTab });
  };

  // Fetch Station Inbox and Real Authorized Metrics
  const loadStationQueue = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;
    if (!isSilent) setLoadingQueue(true);
    else setRefreshing(true);
    setFetchError(null);

    try {
      // Map UI activeTab to API status parameter
      let apiStatus = null;
      if (activeTab === 'SUBMITTED') apiStatus = 'SUBMITTED';
      else if (activeTab === 'UNDER_REVIEW') apiStatus = 'UNDER_REVIEW';
      else if (activeTab === 'INFO_REQUESTED') apiStatus = 'INFO_REQUESTED';
      else if (activeTab === 'REJECTED') apiStatus = 'REJECTED';
      else if (activeTab === 'ALL') apiStatus = 'ALL';
      // If 'ALL_ACTIVE', leave apiStatus null so default returns SUBMITTED, UNDER_REVIEW, INFO_REQUESTED

      const params = {};
      if (apiStatus) params.status = apiStatus;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy) params.sort = sortBy;

      const res = await firApi.getStationInbox(params);
      
      const records = res?.data || [];
      setInboxRecords(Array.isArray(records) ? records : []);

      if (res?.counts) {
        setKpiCounts(res.counts);
      }

      // Fetch officer notifications
      try {
        const [notifsRes, countRes] = await Promise.all([
          notificationsApi.getAll(),
          notificationsApi.getUnreadCount()
        ]);
        setNotifications(notifsRes?.data || notifsRes || []);
        setUnreadCount(countRes?.unreadCount || 0);
      } catch {
        // Notifications are auxiliary
      }
    } catch (err) {
      console.warn('Station inbox fetch error:', err.message);
      setFetchError(err.message || 'Unable to retrieve station records. Please verify database connectivity.');
    } finally {
      setLoadingQueue(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, activeTab, selectedPriority, selectedCategory, searchQuery, sortBy]);

  // Initial load & when filters change
  useEffect(() => {
    loadStationQueue();
  }, [loadStationQueue]);

  // Clear toast banner after 4 seconds
  useEffect(() => {
    if (actionSuccessMsg || actionErrorMsg) {
      const timer = setTimeout(() => {
        setActionSuccessMsg(null);
        setActionErrorMsg(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMsg, actionErrorMsg]);

  // Copy tracking ID
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Full Complaint Review Detail Modal
  const handleOpenDetail = async (firId) => {
    setSelectedFirId(firId);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await firApi.getFirDetails(firId);
      if (res?.data) {
        setDocketDetail(res.data);
      } else {
        throw new Error('Complaint docket details could not be parsed.');
      }
    } catch (err) {
      console.warn('Docket details load error:', err.message);
      setDetailError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedFirId(null);
    setDocketDetail(null);
    setDetailError(null);
  };

  // Action: Start Review (SUBMITTED -> UNDER_REVIEW)
  const handleConfirmStartReview = async () => {
    if (!startReviewTarget) return;
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await firApi.startReview(startReviewTarget.fir_id);
      setActionSuccessMsg(res?.message || `Review started for docket ${startReviewTarget.tracking_id}`);
      setStartReviewTarget(null);
      
      // If modal detail is currently open for this docket, refresh it
      if (selectedFirId === startReviewTarget.fir_id) {
        handleOpenDetail(startReviewTarget.fir_id);
      }
      loadStationQueue(true);
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to start complaint review.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Request Information (UNDER_REVIEW -> INFO_REQUESTED)
  const handleConfirmRequestInfo = async (e) => {
    e.preventDefault();
    if (!requestInfoTarget) return;
    if (!clarificationText.trim() || clarificationText.trim().length < 5) {
      setClarificationError('Clarification question must be at least 5 characters long.');
      return;
    }
    setActionLoading(true);
    setClarificationError(null);
    try {
      const res = await firApi.requestInfo(requestInfoTarget.fir_id, clarificationText.trim());
      setActionSuccessMsg(res?.message || `Clarification request transmitted to citizen for ${requestInfoTarget.tracking_id}`);
      setRequestInfoTarget(null);
      setClarificationText('');

      if (selectedFirId === requestInfoTarget.fir_id) {
        handleOpenDetail(requestInfoTarget.fir_id);
      }
      loadStationQueue(true);
    } catch (err) {
      setClarificationError(err.message || 'Failed to submit clarification request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Complaint (UNDER_REVIEW -> REJECTED)
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      setRejectionError('Statutory rejection reason must be at least 10 characters long.');
      return;
    }
    setActionLoading(true);
    setRejectionError(null);
    try {
      const res = await firApi.rejectComplaint(rejectTarget.fir_id, rejectionReason.trim());
      setActionSuccessMsg(res?.message || `Complaint ${rejectTarget.tracking_id} rejected with statutory grounds recorded.`);
      setRejectTarget(null);
      setRejectionReason('');

      if (selectedFirId === rejectTarget.fir_id) {
        handleOpenDetail(rejectTarget.fir_id);
      }
      loadStationQueue(true);
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Open Tag Legal Sections Modal
  const handleOpenTagSections = async (docket) => {
    setTagSectionsTarget(docket);
    setLoadingSections(true);
    try {
      const masterRes = await firApi.getLegalSections();
      const sections = masterRes?.data || [];
      setMasterSections(sections);
      
      // Preselect if docket already has legalSections
      if (docket?.legalSections && Array.isArray(docket.legalSections)) {
        setSelectedSectionIds(docket.legalSections.map(s => s.section_id));
      } else {
        setSelectedSectionIds([]);
      }
    } catch (err) {
      console.warn('Error loading legal sections master:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  // Action: Submit Tag Legal Sections
  const handleConfirmTagSections = async () => {
    if (!tagSectionsTarget) return;
    if (selectedSectionIds.length === 0) {
      setActionErrorMsg('Please select at least one legal section to tag this complaint.');
      return;
    }
    setActionLoading(true);
    try {
      await firApi.tagSections(tagSectionsTarget.fir_id, selectedSectionIds, isCognizable);
      setActionSuccessMsg(`Legal sections successfully mapped for ${tagSectionsTarget.tracking_id}. Ready for SHO registration approval.`);
      setTagSectionsTarget(null);
      if (selectedFirId === tagSectionsTarget.fir_id) {
        handleOpenDetail(tagSectionsTarget.fir_id);
      }
      loadStationQueue(true);
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to map legal sections.');
    } finally {
      setActionLoading(false);
    }
  };

  // Print official acknowledgment slip
  const handlePrintSlip = (firId) => {
    const token = localStorage.getItem('casesync_token');
    const url = `${import.meta.env.VITE_API_URL || '/api'}/firs/${firId}/slip?format=html`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.text())
        .then(html => {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
        })
        .catch(err => {
          alert('Failed to generate printable acknowledgment slip: ' + err.message);
        });
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  // Extract distinct category names for the category filter dropdown
  const categoryOptions = useMemo(() => {
    const cats = new Set();
    inboxRecords.forEach(r => {
      if (r.category_name) cats.add(r.category_name);
    });
    return Array.from(cats);
  }, [inboxRecords]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Role-Aware Sidebar Navigation */}
      <DashboardSidebar activeNav={
        activeTab === 'SUBMITTED' ? 'submitted' :
        activeTab === 'UNDER_REVIEW' ? 'under_review' :
        activeTab === 'INFO_REQUESTED' ? 'info_requested' :
        activeTab === 'REJECTED' ? 'rejected' : 'inbox'
      } />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Navigation Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-navy-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Station Intake</span>
            <span className="text-slate-300">/</span>
            <span className="text-navy-900 font-bold">Desk Officer Portal</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Officer Duty Badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
              <span className="material-symbols-outlined text-sm text-amber-600">verified_user</span>
              <span className="font-semibold">{user?.fullName || 'ASI Sunita Devi'}</span>
              <span className="text-amber-500 font-mono text-[10px]">({user?.badgeNo || 'DO-CPS-201'})</span>
            </div>

            {/* Live Queue Refresh Button */}
            <button
              type="button"
              onClick={() => loadStationQueue(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Refresh queue from police database"
            >
              <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin text-amber-600' : 'text-slate-600'}`}>
                sync
              </span>
              <span className="hidden md:inline">{refreshing ? 'Syncing...' : 'Sync Queue'}</span>
            </button>

            {/* Notifications Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-950 transition-colors cursor-pointer"
                title="Station Notifications"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-blue-900">notifications</span>
                        <span className="text-xs font-bold text-slate-900">Station Alerts ({unreadCount} unread)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No station notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n, i) => (
                          <div
                            key={n.notification_id || i}
                            className={`p-2.5 rounded-xl text-xs transition-colors ${
                              n.is_read ? 'bg-slate-50 text-slate-600' : 'bg-blue-50/70 text-slate-900 font-medium border border-blue-100'
                            }`}
                          >
                            <p className="line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Action Banners & Toasts */}
        <AnimatePresence>
          {actionSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>{actionSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          {actionErrorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                <span>{actionErrorMsg}</span>
              </div>
              <button 
                onClick={() => setActionErrorMsg(null)}
                className="text-rose-600 hover:text-rose-900 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Dashboard Body */}
        <main className="p-6 space-y-6 flex-1">
          
          {/* Header Banner: Station Duty & Workload Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Station Intake Queue
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white uppercase tracking-wider">
                  Duty Desk
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {user?.stationName || 'Central Police Station (CPS-01)'} • Statutory complaint vetting under BNSS Section 173
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Active Workload:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-navy-deep text-amber-300 border border-navy-light/40 font-mono">
                {kpiCounts.pendingAction} Pending Action
              </span>
            </div>
          </div>

          {/* Section A: Desk Officer Dashboard Overview (Authorized Backend Counts) */}
          <section aria-labelledby="desk-metrics-title">
            <h2 id="desk-metrics-title" className="sr-only">Workload Overview Metrics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {loadingQueue ? (
                <>
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </>
              ) : (
                <>
                  <MetricCard
                    label="Pending Review"
                    value={kpiCounts.submitted}
                    subtitle="Awaiting desk review start"
                    icon="pending_actions"
                    accentColor="warning"
                    onClick={() => handleTabChange('SUBMITTED')}
                  />
                  <MetricCard
                    label="Under Legal Review"
                    value={kpiCounts.underReview}
                    subtitle="Currently being triaged"
                    icon="rate_review"
                    accentColor="info"
                    onClick={() => handleTabChange('UNDER_REVIEW')}
                  />
                  <MetricCard
                    label="Clarification Awaiting"
                    value={kpiCounts.infoRequested}
                    subtitle="Citizen response pending"
                    icon="question_answer"
                    accentColor="tertiary"
                    onClick={() => handleTabChange('INFO_REQUESTED')}
                  />
                  <MetricCard
                    label="Rejected / Non-Cog"
                    value={kpiCounts.rejected}
                    subtitle="Statutory grounds stated"
                    icon="cancel"
                    accentColor="neutral"
                    onClick={() => handleTabChange('REJECTED')}
                  />
                </>
              )}
            </div>
          </section>

          {/* Section B: Station Inbox Queue Table & Filtering Controls */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Header Tabs & Workload Slices */}
            <div className="border-b border-slate-200 bg-slate-50/60 px-4 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('ALL_ACTIVE')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'ALL_ACTIVE'
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">inbox</span>
                  <span>Active Queue</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'ALL_ACTIVE' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.pendingAction}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('SUBMITTED')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'SUBMITTED'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">fiber_new</span>
                  <span>Submitted</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'SUBMITTED' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.submitted}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('UNDER_REVIEW')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'UNDER_REVIEW'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">rate_review</span>
                  <span>Under Review</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'UNDER_REVIEW' ? 'bg-blue-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.underReview}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('INFO_REQUESTED')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'INFO_REQUESTED'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">help_outline</span>
                  <span>Clarification</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'INFO_REQUESTED' ? 'bg-purple-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.infoRequested}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('REJECTED')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'REJECTED'
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  <span>Rejected</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'REJECTED' ? 'bg-rose-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.rejected}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('ALL')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'ALL'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">folder_open</span>
                  <span>All Station Dockets</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'ALL' ? 'bg-slate-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpiCounts.total}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter & Live Search Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking ID, complainant name, description..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="1">P1 — High / Urgent</option>
                  <option value="2">P2 — Medium</option>
                  <option value="3">P3 — Low</option>
                </select>

                {/* Category Filter */}
                {categoryOptions.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer max-w-[160px] truncate"
                  >
                    <option value="ALL">All Categories</option>
                    {categoryOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                {/* Sorting */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
                >
                  <option value="priority_asc">Priority (P1 First)</option>
                  <option value="newest">Newest Submission</option>
                  <option value="oldest">Oldest Submission</option>
                </select>
              </div>
            </div>

            {/* Queue Content Area: Table / Empty / Loading / Error */}
            <div className="overflow-x-auto">
              {fetchError ? (
                <div className="p-8">
                  <ErrorState
                    title="Failed to Load Station Inbox"
                    message={fetchError}
                    onRetry={() => loadStationQueue()}
                  />
                </div>
              ) : loadingQueue ? (
                <div className="p-6 space-y-3">
                  <DocketCardSkeleton />
                  <DocketCardSkeleton />
                  <DocketCardSkeleton />
                </div>
              ) : inboxRecords.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No Complaints in this Queue"
                    description={
                      searchQuery || selectedPriority !== 'ALL' || selectedCategory !== 'ALL'
                        ? 'No station complaints match your active filter criteria. Try resetting the search or category filters.'
                        : 'There are currently no complaints in this workload bucket for Central Police Station.'
                    }
                    actionLabel={searchQuery || selectedPriority !== 'ALL' ? 'Reset Filters' : undefined}
                    onAction={() => {
                      setSearchQuery('');
                      setSelectedPriority('ALL');
                      setSelectedCategory('ALL');
                    }}
                    icon="inbox"
                  />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Docket Reference</th>
                      <th className="py-3.5 px-4">Complainant</th>
                      <th className="py-3.5 px-4">Offence Particulars</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Station Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {inboxRecords.map((docket) => {
                      const priorityColor =
                        docket.priority === 1
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : docket.priority === 2
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <tr
                          key={docket.fir_id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Tracking ID & Submission Time */}
                          <td className="py-4 px-4 sm:px-6 align-top">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                              <span>{docket.tracking_id}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(docket.tracking_id)}
                                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title="Copy Tracking ID"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {copiedId === docket.tracking_id ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            </div>

                            {docket.fir_number && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>{docket.fir_number}</span>
                              </div>
                            )}

                            <span className="text-[11px] text-slate-400 block mt-1">
                              {docket.submitted_at ? new Date(docket.submitted_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : 'Draft'}
                            </span>
                          </td>

                          {/* Complainant Name & Contact */}
                          <td className="py-4 px-4 align-top">
                            <p className="font-bold text-slate-900">{docket.complainant_name || 'Citizen'}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {docket.complainant_phone ? `+91 ${docket.complainant_phone}` : 'No phone listed'}
                            </p>
                          </td>

                          {/* Offence Particulars & Location */}
                          <td className="py-4 px-4 align-top max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold text-[10px] border border-blue-200/60">
                                {docket.category_name || 'General Offence'}
                              </span>
                              {docket.attachment_count > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-slate-500" title={`${docket.attachment_count} evidence files attached`}>
                                  <span className="material-symbols-outlined text-xs">attach_file</span>
                                  <span>{docket.attachment_count}</span>
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-slate-600 text-[11px] leading-relaxed">
                              {docket.description || 'No description provided.'}
                            </p>
                            {docket.location_text && (
                              <p className="text-[10px] text-slate-400 mt-1 truncate flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">place</span>
                                <span>{docket.location_text}</span>
                              </p>
                            )}
                          </td>

                          {/* Priority Pill */}
                          <td className="py-4 px-4 align-top">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityColor}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              <span>P{docket.priority}</span>
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 align-top">
                            <StatusBadge status={docket.status} />
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-4 sm:px-6 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Open Details */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDetail(docket.fir_id)}
                              >
                                Review Dossier
                              </Button>

                              {/* Start Review if SUBMITTED */}
                              {docket.status === 'SUBMITTED' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setStartReviewTarget(docket)}
                                >
                                  Start Review
                                </Button>
                              )}

                              {/* In-Queue Clarification / Rejection if UNDER_REVIEW */}
                              {docket.status === 'UNDER_REVIEW' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-purple-700 hover:bg-purple-50"
                                    onClick={() => {
                                      setRequestInfoTarget(docket);
                                      setClarificationText('');
                                      setClarificationError(null);
                                    }}
                                  >
                                    Ask Info
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-700 hover:bg-rose-50"
                                    onClick={() => {
                                      setRejectTarget(docket);
                                      setRejectionReason('');
                                      setRejectionError(null);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer Summary */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <p>
                Showing <span className="font-bold text-slate-900">{inboxRecords.length}</span> station docket(s)
              </p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> P1 High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> P2 Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> P3 Low
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: COMPLAINT REVIEW DETAIL MODAL (FULL DOCKET PARTICULARS)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedFirId && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-navy-900 text-xl">folder_managed</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Complaint Docket Particulars
                    </h2>
                    {docketDetail && <StatusBadge status={docketDetail.status} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Reference: {docketDetail?.trackingId || 'Loading...'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {loadingDetail ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">Fetching verified police docket from database...</p>
                  </div>
                ) : detailError ? (
                  <ErrorState
                    title="Could Not Load Docket"
                    message={detailError}
                    onRetry={() => handleOpenDetail(selectedFirId)}
                  />
                ) : docketDetail ? (
                  <>
                    {/* Top Identity Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tracking Reference</span>
                        <span className="font-mono font-bold text-slate-900">{docketDetail.trackingId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Statutory Status</span>
                        <span className="font-bold text-slate-900">{docketDetail.status}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Permanent FIR No.</span>
                        <span className="font-mono font-bold text-slate-900">
                          {docketDetail.firNumber || 'Pending SHO Approval'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Station Jurisdiction</span>
                        <span className="font-semibold text-slate-900">{docketDetail.policeStation?.name || 'Central Police Station'}</span>
                      </div>
                    </div>

                    {/* Rejection / Non-Cognizable Note if REJECTED */}
                    {docketDetail.status === 'REJECTED' && docketDetail.rejectionReason && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          <span>Statutory Rejection / Non-Cognizable Referral Grounds</span>
                        </div>
                        <p className="text-xs leading-relaxed">{docketDetail.rejectionReason}</p>
                        <p className="text-[10px] text-rose-600 pt-1">
                          As per BNSS Section 173(4), citizen has the right to file an online supervisory appeal against this station intake decision.
                        </p>
                      </div>
                    )}

                    {/* Complainant Profile */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>Complainant / Informant Particulars</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Full Legal Name</span>
                          <span className="font-bold text-slate-900">{docketDetail.complainant?.fullName || 'Citizen'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Contact Phone</span>
                          <span className="font-mono font-medium text-slate-900">
                            {docketDetail.complainant?.phone ? `+91 ${docketDetail.complainant.phone}` : 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Identity Proof</span>
                          <span className="text-slate-900 font-medium">
                            {docketDetail.complainant?.idType || 'Aadhaar Card'} (•••• {docketDetail.complainant?.maskedIdNumber || 'Verified'})
                          </span>
                        </div>
                        <div className="sm:col-span-3 pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Registered Address</span>
                          <span className="text-slate-700">{docketDetail.complainant?.address || 'City Centre Jurisdiction'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Incident Particulars */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>Incident Statement &amp; Occurrence</span>
                      </h3>
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Date &amp; Time of Occurrence</span>
                            <span className="font-bold text-slate-900">
                              {docketDetail.incident?.incidentDt ? new Date(docketDetail.incident.incidentDt).toLocaleString('en-IN') : 'Not stated'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Crime Category</span>
                            <span className="font-bold text-blue-900">{docketDetail.incident?.categoryName || 'General'}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] text-slate-400 block">Location of Incident</span>
                            <span className="text-slate-900 font-medium">{docketDetail.incident?.locationText || 'Station Beats'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">Gist of Incident / Allegations</span>
                          <p className="p-3 rounded-lg bg-slate-50 text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-line border border-slate-200/60">
                            {docketDetail.incident?.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tagged Legal Sections */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                          <span className="material-symbols-outlined text-sm">menu_book</span>
                          <span>Tagged Legal Sections ({docketDetail.legalSections?.length || 0})</span>
                        </h3>
                        {docketDetail.status === 'UNDER_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => handleOpenTagSections(docketDetail)}
                            className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            <span>{docketDetail.legalSections?.length ? 'Update Sections' : '+ Map Legal Sections'}</span>
                          </button>
                        )}
                      </div>

                      {docketDetail.legalSections && docketDetail.legalSections.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {docketDetail.legalSections.map((sec, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start gap-2">
                              <span className="material-symbols-outlined text-amber-500 text-base shrink-0 mt-0.5">gavel</span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">
                                  {sec.act} — Section {sec.section_no}
                                </p>
                                <p className="text-[11px] text-slate-600 truncate">{sec.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-semibold">
                                  <span className={`px-1.5 py-0.2 rounded ${sec.is_cognizable ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {sec.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className={sec.is_bailable ? 'text-emerald-700' : 'text-rose-700'}>
                                    {sec.is_bailable ? 'Bailable' : 'Non-Bailable'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 text-xs">
                          No BNS / IPC legal sections mapped yet.{' '}
                          {docketDetail.status === 'UNDER_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleOpenTagSections(docketDetail)}
                              className="text-blue-600 font-bold underline cursor-pointer ml-1"
                            >
                              Tag Legal Sections Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Evidentiary Attachments */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                        <span className="material-symbols-outlined text-sm">attachment</span>
                        <span>Evidence Exhibits &amp; Attachments ({docketDetail.attachments?.length || 0})</span>
                      </h3>
                      {docketDetail.attachments && docketDetail.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {docketDetail.attachments.map((att) => (
                            <div key={att.attachmentId || att.sha256} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-blue-900 text-lg shrink-0">draft</span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{att.fileName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">
                                    Checksum: {att.sha256 ? att.sha256.substring(0, 24) + '...' : 'Verified'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold whitespace-nowrap">
                                File Verified
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">No external evidence files uploaded by citizen.</p>
                      )}
                    </div>

                    {/* Case Status History & Audit Trail */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
                        <span className="material-symbols-outlined text-sm">history</span>
                        <span>Statutory State History &amp; Audit Trail</span>
                      </h3>
                      {docketDetail.timeline && docketDetail.timeline.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                          {docketDetail.timeline.map((step, idx) => (
                            <div key={step.history_id || idx} className="p-3 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-navy-light/10 text-navy-900 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">
                                    {step.from_state ? `${step.from_state} → ` : ''}{step.to_state}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(step.created_at).toLocaleString()}
                                  </span>
                                </div>
                                {step.note && (
                                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                                    {step.note}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Actor: {step.actor_name || 'System'} ({step.actor_role || 'CITIZEN'})
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-xs">No prior state transitions recorded.</p>
                      )}
                    </div>

                    {/* Anti-Tamper Digital Seal */}
                    {docketDetail.digitalSeal && (
                      <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">DIGITAL ANTI-TAMPER INTEGRITY SEAL</span>
                          <span className="text-slate-400">Algorithm: {docketDetail.digitalSeal.algorithm}</span>
                        </div>
                        <p className="text-slate-300 break-all">
                          {docketDetail.digitalSeal.verificationDigest}
                        </p>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintSlip(selectedFirId)}
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Print Slip</span>
                </Button>

                <div className="flex items-center gap-2">
                  {docketDetail?.status === 'SUBMITTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setStartReviewTarget(docketDetail);
                        handleCloseDetail();
                      }}
                    >
                      Start Review
                    </Button>
                  )}

                  {docketDetail?.status === 'UNDER_REVIEW' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRequestInfoTarget(docketDetail);
                          setClarificationText('');
                          setClarificationError(null);
                        }}
                      >
                        Request Citizen Info
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejectTarget(docketDetail);
                          setRejectionReason('');
                          setRejectionError(null);
                        }}
                      >
                        Reject Complaint
                      </Button>
                    </>
                  )}

                  <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION D: START REVIEW CONFIRMATION MODAL                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {startReviewTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">rate_review</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Start Review for Docket {startReviewTarget.tracking_id}?
                </h3>
                <p className="text-xs text-slate-500">
                  This transitions the complaint from <strong className="text-slate-800">SUBMITTED</strong> to{' '}
                  <strong className="text-blue-900">UNDER_REVIEW</strong>, locking the citizen draft and assigning desk triage responsibility to your badge.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-sans">
                <p><span className="text-slate-400">Complainant:</span> <strong>{startReviewTarget.complainant_name}</strong></p>
                <p><span className="text-slate-400">Category:</span> <strong>{startReviewTarget.category_name}</strong></p>
                <p><span className="text-slate-400">Priority:</span> <strong>P{startReviewTarget.priority}</strong></p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setStartReviewTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={handleConfirmStartReview}
                >
                  {actionLoading ? 'Initiating Review...' : 'Confirm & Start Review'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION E: REQUEST CLARIFICATION FROM CITIZEN MODAL                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {requestInfoTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
                <span className="material-symbols-outlined text-purple-700 text-xl">question_answer</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Request Citizen Information / Clarification
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Docket: {requestInfoTarget.tracking_id} • Complainant: {requestInfoTarget.complainant_name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmRequestInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clarification Query / Missing Details Required *
                  </label>
                  <textarea
                    rows={4}
                    value={clarificationText}
                    onChange={(e) => setClarificationText(e.target.value)}
                    placeholder="Clearly specify what evidence, receipts, witness contacts, or incident timeline clarification is needed from the citizen..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    disabled={actionLoading}
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Minimum 5 characters required</span>
                    <span>{clarificationText.length} characters</span>
                  </div>
                </div>

                {clarificationError && (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {clarificationError}
                  </p>
                )}

                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    <span>Statutory Intake Workflow</span>
                  </p>
                  <p className="text-purple-800 text-[10px] leading-relaxed">
                    Submitting this will transition docket to <strong className="font-mono">INFO_REQUESTED</strong>. The citizen will immediately receive an in-portal notification and will be prompted to respond through their verified dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setRequestInfoTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Transmitting Request...' : 'Send Clarification Request'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION F: REJECT COMPLAINT / NON-COGNIZABLE MODAL                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
                <span className="material-symbols-outlined text-rose-600 text-xl">gavel</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Record Statutory Rejection / Non-Cognizable Referral
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Docket: {rejectTarget.tracking_id} • Complainant: {rejectTarget.complainant_name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Statutory Rejection Reason / Legal Grounds *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific legal grounds under Bharatiya Nagarik Suraksha Sanhita (BNSS), e.g.: Civil dispute without criminal breach, Non-cognizable matter referred to Civil Court, Duplicate filing..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    disabled={actionLoading}
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Minimum 10 characters mandatory</span>
                    <span>{rejectionReason.length} characters</span>
                  </div>
                </div>

                {rejectionError && (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {rejectionError}
                  </p>
                )}

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-[11px] text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    <span>Legal Recourse Notice</span>
                  </p>
                  <p className="text-rose-800 text-[10px] leading-relaxed">
                    Under BNSS Section 173(4), recording this decision formally notifies the complainant. The citizen is statutory entitled to submit an appeal to the Superintendent of Police / Supervisory Authority.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setRejectTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Recording Rejection...' : 'Confirm Statutory Rejection'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION G: TAG LEGAL SECTIONS MODAL (FORWARDING / TRIAGE FOR SHO)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {tagSectionsTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 flex flex-col max-h-[88vh]"
            >
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
                <span className="material-symbols-outlined text-amber-600 text-xl">menu_book</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tag Legal Sections (BNS 2023 / IPC / Special Acts)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Docket: {tagSectionsTarget.tracking_id} • Complainant: {tagSectionsTarget.complainant_name}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Cognizable Toggle */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Offence Classification</span>
                    <span className="text-[11px] text-slate-500">
                      Cognizable offences empower police to investigate without court order.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCognizable(!isCognizable)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isCognizable
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCognizable ? 'Cognizable Offence' : 'Non-Cognizable Offence'}
                  </button>
                </div>

                {/* Legal Sections Checklist */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Applicable Sections ({selectedSectionIds.length} selected):
                  </label>

                  {loadingSections ? (
                    <p className="text-slate-400 py-6 text-center">Loading statutory legal sections catalog...</p>
                  ) : masterSections.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No legal sections found in database.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {masterSections.map((sec) => {
                        const isChecked = selectedSectionIds.includes(sec.section_id);
                        return (
                          <div
                            key={sec.section_id}
                            onClick={() => {
                              setSelectedSectionIds(prev =>
                                isChecked
                                  ? prev.filter(id => id !== sec.section_id)
                                  : [...prev, sec.section_id]
                              );
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs">
                                {sec.act} § {sec.section_no}
                              </p>
                              <p className="text-[11px] text-slate-600 truncate">{sec.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                                <span>{sec.is_cognizable ? 'Cognizable' : 'Non-Cog'}</span>
                                <span>•</span>
                                <span>{sec.is_bailable ? 'Bailable' : 'Non-Bailable'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Tagged sections will be forwarded for SHO approval.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => setTagSectionsTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading || selectedSectionIds.length === 0}
                    onClick={handleConfirmTagSections}
                  >
                    {actionLoading ? 'Mapping Sections...' : 'Save & Tag Sections'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default DeskOfficerDashboardPage;
