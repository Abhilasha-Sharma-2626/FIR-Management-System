import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { firApi, casesApi, notificationsApi } from '../lib/api';
import {
  MetricCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  MetricCardSkeleton,
  DocketCardSkeleton,
  Button
} from '../components/ui';

export function ShoDashboardPage() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab & Filters
  const tabParam = searchParams.get('tab') || 'ALL';
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
    assigned: 0,
    underInvestigation: 0,
    pendingApproval: 0,
    chargesheetFiled: 0,
    closed: 0,
    pendingAction: 0,
    pendingAppeals: 0,
    pendingTransfers: 0,
    total: 0
  });
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Specialized Queue States
  const [appealsList, setAppealsList] = useState([]);
  const [transfersList, setTransfersList] = useState([]);
  const [ioWorkloadList, setIoWorkloadList] = useState([]);
  const [loadingSpecialQueue, setLoadingSpecialQueue] = useState(false);

  // Detail Modal State
  const [selectedFirId, setSelectedFirId] = useState(null);
  const [docketDetail, setDocketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Action Modals State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionErrorMsg, setActionErrorMsg] = useState(null);

  // 1. FIR Registration Modal State
  const [registerTarget, setRegisterTarget] = useState(null);
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [registeredResult, setRegisteredResult] = useState(null);

  // 2. IO Assignment Modal State
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedIoId, setSelectedIoId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [availableIos, setAvailableIos] = useState([]);
  const [loadingIos, setLoadingIos] = useState(false);

  // 3. Review Final Report Modal State
  const [reportReviewTarget, setReportReviewTarget] = useState(null);
  const [reportDecision, setReportDecision] = useState('APPROVE');
  const [reportRemarks, setReportRemarks] = useState('');
  const [courtName, setCourtName] = useState('Court of Chief Metropolitan Magistrate #01');

  // 4. Review Appeal Modal State
  const [appealReviewTarget, setAppealReviewTarget] = useState(null);
  const [appealDecision, setAppealDecision] = useState('ACCEPT');
  const [appealNotes, setAppealNotes] = useState('');

  // 5. Review Transfer Modal State
  const [transferReviewTarget, setTransferReviewTarget] = useState(null);
  const [transferRemarks, setTransferRemarks] = useState('');

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
    setSearchParams(newTab === 'ALL' ? {} : { tab: newTab });
  };

  // Copy tracking / FIR helper
  const handleCopyId = (id, textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load Main Station Inbox and Metrics
  const loadStationQueue = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;
    if (!isSilent) setLoadingQueue(true);
    else setRefreshing(true);
    setFetchError(null);

    try {
      const response = await firApi.getStationInbox({});
      if (response && response.success) {
        setInboxRecords(response.data || []);
        if (response.counts) {
          setKpiCounts(response.counts);
        }
      } else {
        setFetchError(response?.message || 'Failed to retrieve station operational dockets.');
      }
    } catch (err) {
      console.error('Error loading station inbox:', err);
      setFetchError(err.message || 'Error communicating with station database service.');
    } finally {
      setLoadingQueue(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Load Appeals list
  const loadAppeals = useCallback(async () => {
    setLoadingSpecialQueue(true);
    try {
      const res = await firApi.getStationAppeals();
      if (res && res.success) {
        setAppealsList(res.data || []);
      }
    } catch (err) {
      console.error('Error loading appeals:', err);
    } finally {
      setLoadingSpecialQueue(false);
    }
  }, []);

  // Load Transfers list
  const loadTransfers = useCallback(async () => {
    setLoadingSpecialQueue(true);
    try {
      const res = await casesApi.getStationTransfers();
      if (res && res.success) {
        setTransfersList(res.data || []);
      }
    } catch (err) {
      console.error('Error loading transfers:', err);
    } finally {
      setLoadingSpecialQueue(false);
    }
  }, []);

  // Load IO Workload
  const loadIoWorkload = useCallback(async () => {
    setLoadingIos(true);
    try {
      const res = await casesApi.getIoWorkload();
      if (res && res.success) {
        setIoWorkloadList(res.data || []);
        setAvailableIos(res.data || []);
      }
    } catch (err) {
      console.error('Error loading IO workload:', err);
    } finally {
      setLoadingIos(false);
    }
  }, []);

  // Load Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getAll();
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStationQueue();
    loadNotifications();
    loadIoWorkload();
  }, [loadStationQueue, loadNotifications, loadIoWorkload]);

  // Tab change triggers specialized queue loads
  useEffect(() => {
    if (activeTab === 'APPEALS') {
      loadAppeals();
    } else if (activeTab === 'TRANSFERS') {
      loadTransfers();
    } else if (activeTab === 'WORKLOAD') {
      loadIoWorkload();
    }
  }, [activeTab, loadAppeals, loadTransfers, loadIoWorkload]);

  // Open Docket Details Drawer
  const handleOpenDetail = async (firId) => {
    setSelectedFirId(firId);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await firApi.getFirDetails(firId);
      if (res && res.success) {
        setDocketDetail(res.data);
      } else {
        setDetailError(res?.message || 'Failed to retrieve detailed docket information.');
      }
    } catch (err) {
      console.error('Error loading docket details:', err);
      setDetailError(err.message || 'Error fetching case records from server.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedFirId(null);
    setDocketDetail(null);
    setDetailError(null);
  };

  // ------------------------------------------------------------------
  // WORKFLOW 1: FIR REGISTRATION
  // ------------------------------------------------------------------
  const handleOpenRegisterModal = (item) => {
    setRegisterTarget(item);
    setRegistrationNotes(`Approved for formal registration under BNSS § 173. Cognizable offence established.`);
    setRegisteredResult(null);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  const handleConfirmRegister = async () => {
    if (!registerTarget) return;
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await firApi.registerFir(registerTarget.fir_id, registrationNotes);
      if (res && res.success) {
        setRegisteredResult(res.data);
        setActionSuccessMsg(`FIR Registered Successfully: ${res.data?.firNumber || res.data?.fir_number || 'Permanent Reference Issued'}`);
        await loadStationQueue(true);
      } else {
        setActionErrorMsg(res?.message || 'Failed to register FIR. Ensure legal sections are attached and offence is cognizable.');
      }
    } catch (err) {
      console.error('Error registering FIR:', err);
      setActionErrorMsg(err.message || 'Registration failed due to backend transaction failure.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // WORKFLOW 2: IO ASSIGNMENT
  // ------------------------------------------------------------------
  const handleOpenAssignModal = async (item) => {
    setAssignTarget(item);
    setSelectedIoId('');
    setAssignmentReason('Assigned for expedited investigation, forensic evidence recovery, and BNSS statutory compliance.');
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    await loadIoWorkload();
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget || !selectedIoId) {
      setActionErrorMsg('Please select an eligible Investigating Officer from the roster.');
      return;
    }
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await casesApi.assignIo(assignTarget.fir_id, selectedIoId, assignmentReason);
      if (res && res.success) {
        setActionSuccessMsg(`Investigating Officer assigned successfully. Case is now under active investigation.`);
        setAssignTarget(null);
        await loadStationQueue(true);
        await loadIoWorkload();
      } else {
        setActionErrorMsg(res?.message || 'Failed to assign Investigating Officer.');
      }
    } catch (err) {
      console.error('Error assigning IO:', err);
      setActionErrorMsg(err.message || 'IO assignment failed due to backend constraint.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // WORKFLOW 3: FINAL REPORT REVIEW (CHARGESHEET / CLOSURE)
  // ------------------------------------------------------------------
  const handleOpenReportReview = async (item) => {
    setReportReviewTarget(item);
    setReportDecision('APPROVE');
    setReportRemarks('Investigation reviewed thoroughly. Evidence substantiates statutory charges. Approved for filing before Judicial Magistrate.');
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  const handleConfirmReportReview = async () => {
    if (!reportReviewTarget) return;
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const payload = {
        decision: reportDecision,
        remarks: reportRemarks,
        courtDetails: reportDecision === 'APPROVE' ? { courtName: courtName.trim() } : null
      };
      const res = await casesApi.reviewReport(reportReviewTarget.fir_id, payload);
      if (res && res.success) {
        const outcomeMsg = reportDecision === 'APPROVE'
          ? 'Final Report Approved. Judicial chargesheet filed before Court.'
          : 'Report sent back to Investigating Officer for further evidentiary inquiry.';
        setActionSuccessMsg(outcomeMsg);
        setReportReviewTarget(null);
        await loadStationQueue(true);
      } else {
        setActionErrorMsg(res?.message || 'Failed to submit report decision.');
      }
    } catch (err) {
      console.error('Error reviewing report:', err);
      setActionErrorMsg(err.message || 'Report review failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // WORKFLOW 4: SUPERVISORY APPEAL REVIEW
  // ------------------------------------------------------------------
  const handleOpenAppealReview = (appeal) => {
    setAppealReviewTarget(appeal);
    setAppealDecision('ACCEPT');
    setAppealNotes('Supervisory review under BNSS § 173(4): Offence discloses prima facie cognizable ingredients. Reopened for fresh legal triage.');
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  const handleConfirmAppealReview = async () => {
    if (!appealReviewTarget) return;
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await firApi.reviewAppeal(
        appealReviewTarget.fir_id,
        appealDecision,
        appealNotes,
        appealReviewTarget.appeal_id
      );
      if (res && res.success) {
        setActionSuccessMsg(
          appealDecision === 'ACCEPT'
            ? 'Appeal Accepted: Complaint returned to UNDER_REVIEW for full FIR inquiry.'
            : 'Appeal Rejected: Previous non-cognizable closure upheld.'
        );
        setAppealReviewTarget(null);
        await loadAppeals();
        await loadStationQueue(true);
      } else {
        setActionErrorMsg(res?.message || 'Failed to process appeal.');
      }
    } catch (err) {
      console.error('Error processing appeal:', err);
      setActionErrorMsg(err.message || 'Appeal processing error.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // WORKFLOW 5: INTER-STATION TRANSFER REVIEW
  // ------------------------------------------------------------------
  const handleOpenTransferReview = (transfer) => {
    setTransferReviewTarget(transfer);
    setTransferRemarks('Territorial jurisdiction confirmed. Case docket accepted at Central Police Station.');
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  const handleAcceptTransfer = async () => {
    if (!transferReviewTarget) return;
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await casesApi.acceptTransfer(transferReviewTarget.fir_id);
      if (res && res.success) {
        setActionSuccessMsg('Case Transfer Accepted: Case now registered under Central PS jurisdiction.');
        setTransferReviewTarget(null);
        await loadTransfers();
        await loadStationQueue(true);
      } else {
        setActionErrorMsg(res?.message || 'Failed to accept case transfer.');
      }
    } catch (err) {
      console.error('Error accepting transfer:', err);
      setActionErrorMsg(err.message || 'Transfer acceptance failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTransfer = async () => {
    if (!transferReviewTarget) return;
    if (!transferRemarks.trim()) {
      setActionErrorMsg('Please state jurisdictional or factual grounds for rejecting transfer.');
      return;
    }
    setActionLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await casesApi.rejectTransfer(transferReviewTarget.fir_id, transferRemarks);
      if (res && res.success) {
        setActionSuccessMsg('Transfer Rejected: Case returned to originating police station.');
        setTransferReviewTarget(null);
        await loadTransfers();
        await loadStationQueue(true);
      } else {
        setActionErrorMsg(res?.message || 'Failed to reject case transfer.');
      }
    } catch (err) {
      console.error('Error rejecting transfer:', err);
      setActionErrorMsg(err.message || 'Transfer rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // FILTERING & SORTING ENGINE
  // ------------------------------------------------------------------
  const filteredRecords = useMemo(() => {
    let list = [...inboxRecords];

    // Status Tab Filtering
    if (activeTab === 'UNDER_REVIEW') {
      list = list.filter(r => r.status === 'UNDER_REVIEW');
    } else if (activeTab === 'REGISTERED') {
      list = list.filter(r => r.status === 'REGISTERED');
    } else if (activeTab === 'PENDING_APPROVAL') {
      list = list.filter(r => r.status === 'PENDING_APPROVAL');
    } else if (activeTab === 'ACTIVE') {
      list = list.filter(r => ['ASSIGNED', 'UNDER_INVESTIGATION', 'REOPENED'].includes(r.status));
    } else if (activeTab === 'CONCLUDED') {
      list = list.filter(r => ['CHARGESHEET_FILED', 'CLOSED'].includes(r.status));
    }

    // Search Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r =>
        (r.tracking_id && r.tracking_id.toLowerCase().includes(q)) ||
        (r.fir_number && r.fir_number.toLowerCase().includes(q)) ||
        (r.complainant_name && r.complainant_name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.location_text && r.location_text.toLowerCase().includes(q)) ||
        (r.category_name && r.category_name.toLowerCase().includes(q))
      );
    }

    // Priority Filtering
    if (selectedPriority !== 'ALL') {
      list = list.filter(r => String(r.priority) === selectedPriority);
    }

    // Category Filtering
    if (selectedCategory !== 'ALL') {
      list = list.filter(r => r.category_name === selectedCategory);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'priority_asc') {
        return (a.priority || 3) - (b.priority || 3);
      }
      if (sortBy === 'date_desc') {
        return new Date(b.incident_dt || b.submitted_at || 0) - new Date(a.incident_dt || a.submitted_at || 0);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.incident_dt || a.submitted_at || 0) - new Date(b.incident_dt || b.submitted_at || 0);
      }
      return 0;
    });

    return list;
  }, [inboxRecords, activeTab, searchQuery, selectedPriority, selectedCategory, sortBy]);

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    inboxRecords.forEach(r => {
      if (r.category_name) set.add(r.category_name);
    });
    return Array.from(set);
  }, [inboxRecords]);

  // Officer Profile
  const officerName = user?.fullName || 'Inspector Rajesh Sharma';
  const badgeNo = user?.badgeNo || 'SHO-CPS-001';
  const stationTitle = user?.stationName || 'Central Police Station (CPS-01)';

  return (
    <div className="flex h-screen bg-ivory text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav={activeTab.toLowerCase()} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Command Bar */}
        <header className="sticky top-0 z-30 bg-navy text-white border-b border-navy-light/40 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  Station House Officer Command Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  BNSS § 173 / 175
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-deep text-slate-300 border border-slate-700">
                  Station ID: 1
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {officerName} • Badge: <span className="font-mono text-amber-300 font-bold">{badgeNo}</span> • {stationTitle}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={() => loadStationQueue(true)}
              disabled={refreshing}
              title="Refresh Station Real-Time Dockets"
              className="p-2 rounded-xl bg-navy-deep hover:bg-navy-light text-slate-300 hover:text-white transition-colors border border-navy-light/50 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-lg ${refreshing ? 'animate-spin text-amber-300' : ''}`}>
                refresh
              </span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-navy-deep hover:bg-navy-light text-slate-300 hover:text-white transition-colors border border-navy-light/50 flex items-center justify-center relative cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-navy-dark text-slate-200 border border-navy-light/60 rounded-2xl shadow-xl z-50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-navy-light/40">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-400">notifications_active</span>
                        Station Command Dispatch Alerts
                      </span>
                      <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-xs">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-400">No active station notifications.</p>
                      ) : (
                        notifications.map((n, idx) => (
                          <div
                            key={n.notification_id || idx}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              n.is_read
                                ? 'bg-navy-deep/60 border-navy-light/30 text-slate-300'
                                : 'bg-primary-container/40 border-amber-500/40 text-white font-medium'
                            }`}
                          >
                            <p className="text-xs leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Emergency Hotline Indicator */}
            <a
              href="tel:112"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">e911_emergency</span>
              <span>PCR 112</span>
            </a>
          </div>
        </header>

        {/* Global Action / Error Banner */}
        <AnimatePresence>
          {actionSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-900/90 text-emerald-100 border-b border-emerald-700 px-6 py-2.5 text-xs font-medium flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-300 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </motion.div>
          )}

          {actionErrorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-950/90 text-rose-100 border-b border-rose-800 px-6 py-2.5 text-xs font-medium flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400 text-sm">error</span>
                <span>{actionErrorMsg}</span>
              </div>
              <button onClick={() => setActionErrorMsg(null)} className="text-rose-300 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Statutory Role Notice */}
          <div className="bg-white border-l-4 border-amber-500 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl mt-0.5">verified</span>
              <div>
                <h2 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Station House Officer (SHO) — Statutory Command Authority
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  As the Station House Officer, you possess sole statutory authority to formally approve FIR registration under Section 173 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), assign Investigating Officers under Section 175, review chargesheets and closure reports before filing in court, adjudicate supervisory appeals under Section 173(4), and accept inter-station jurisdiction transfers.
                </p>
              </div>
            </div>
          </div>

          {/* KPI Metrics Dashboard Grid */}
          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="sr-only">Station Performance Metrics</h2>
            {loadingQueue ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <MetricCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Awaiting FIR Registration */}
                <div 
                  onClick={() => handleTabChange('UNDER_REVIEW')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Awaiting FIR Reg."
                    value={kpiCounts.underReview}
                    icon="verified_user"
                    trend={`${kpiCounts.underReview} scrutinized`}
                    trendDirection="neutral"
                    accentColor="amber"
                  />
                </div>

                {/* 2. Awaiting IO Designation */}
                <div 
                  onClick={() => handleTabChange('REGISTERED')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Awaiting IO Assign"
                    value={kpiCounts.registered}
                    icon="badge"
                    trend={`${kpiCounts.registered} registered`}
                    trendDirection={kpiCounts.registered > 0 ? 'up' : 'neutral'}
                    accentColor="cyan"
                  />
                </div>

                {/* 3. Final Report Approvals */}
                <div 
                  onClick={() => handleTabChange('PENDING_APPROVAL')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Report Approvals"
                    value={kpiCounts.pendingApproval}
                    icon="gavel"
                    trend={`${kpiCounts.pendingApproval} pending court`}
                    trendDirection={kpiCounts.pendingApproval > 0 ? 'up' : 'neutral'}
                    accentColor="purple"
                  />
                </div>

                {/* 4. Supervisory Appeals */}
                <div 
                  onClick={() => handleTabChange('APPEALS')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Citizen Appeals"
                    value={kpiCounts.pendingAppeals}
                    icon="account_balance"
                    trend="§ 173(4) BNSS"
                    trendDirection={kpiCounts.pendingAppeals > 0 ? 'up' : 'neutral'}
                    accentColor="rose"
                  />
                </div>

                {/* 5. Inter-Station Transfers */}
                <div 
                  onClick={() => handleTabChange('TRANSFERS')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Station Transfers"
                    value={kpiCounts.pendingTransfers}
                    icon="sync_alt"
                    trend="Territorial Zero-FIR"
                    trendDirection="neutral"
                    accentColor="teal"
                  />
                </div>

                {/* 6. Active Field Inquiries */}
                <div 
                  onClick={() => handleTabChange('ACTIVE')} 
                  className="cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  <MetricCard
                    title="Active Inquiries"
                    value={kpiCounts.underInvestigation + kpiCounts.assigned}
                    icon="policy"
                    trend="Active under IOs"
                    trendDirection="neutral"
                    accentColor="emerald"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Workflow Tabs Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-none" aria-label="Workflow Queues">
              {[
                { id: 'ALL', label: 'All Station Workload', icon: 'dashboard', count: kpiCounts.total },
                { id: 'UNDER_REVIEW', label: 'FIR Registration Queue', icon: 'verified_user', count: kpiCounts.underReview, badgeColor: 'bg-amber-100 text-amber-800' },
                { id: 'REGISTERED', label: 'IO Case Assignment', icon: 'badge', count: kpiCounts.registered, badgeColor: 'bg-cyan-100 text-cyan-800' },
                { id: 'PENDING_APPROVAL', label: 'Final Reports & Approvals', icon: 'gavel', count: kpiCounts.pendingApproval, badgeColor: 'bg-purple-100 text-purple-800' },
                { id: 'APPEALS', label: 'Supervisory Appeals', icon: 'account_balance', count: kpiCounts.pendingAppeals, badgeColor: 'bg-rose-100 text-rose-800' },
                { id: 'TRANSFERS', label: 'Station Transfers', icon: 'sync_alt', count: kpiCounts.pendingTransfers, badgeColor: 'bg-teal-100 text-teal-800' },
                { id: 'ACTIVE', label: 'Active Inquiries', icon: 'policy', count: kpiCounts.underInvestigation + kpiCounts.assigned },
                { id: 'CONCLUDED', label: 'Chargesheeted / Closed', icon: 'task_alt', count: kpiCounts.chargesheetFiled + kpiCounts.closed },
                { id: 'WORKLOAD', label: 'IO Workload Roster', icon: 'group', count: ioWorkloadList.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-navy hover:bg-slate-100'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${activeTab === tab.id ? 'text-amber-400' : 'text-slate-400'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === tab.id 
                        ? 'bg-amber-400 text-navy' 
                        : (tab.badgeColor || 'bg-slate-200 text-slate-700')
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Search, Filter & Sorter Toolbar (Hidden for Workload Roster) */}
          {activeTab !== 'WORKLOAD' && activeTab !== 'APPEALS' && activeTab !== 'TRANSFERS' && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking ID, FIR, complainant..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="1">Priority 1 (Emergency)</option>
                  <option value="2">Priority 2 (Standard)</option>
                  <option value="3">Priority 3 (Routine)</option>
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-700 cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Sorter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-700 cursor-pointer"
                >
                  <option value="priority_asc">Sort: Highest Priority First</option>
                  <option value="date_desc">Sort: Newest First</option>
                  <option value="date_asc">Sort: Oldest First</option>
                </select>
              </div>
            </div>
          )}

          {/* MAIN WORKLOAD QUEUES */}
          {fetchError ? (
            <ErrorState
              title="Station Inbox Connection Error"
              message={fetchError}
              onRetry={() => loadStationQueue(false)}
            />
          ) : activeTab === 'WORKLOAD' ? (
            /* Tab: IO Workload Roster */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">group</span>
                    Central Police Station — Investigating Officer Roster &amp; Active Caseload
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized workload distribution per officer. Real-time active investigations tracked under BNSS 2023.
                  </p>
                </div>
                <button
                  onClick={loadIoWorkload}
                  disabled={loadingIos}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-sm ${loadingIos ? 'animate-spin' : ''}`}>sync</span>
                  <span>Refresh Workload</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Officer Particulars</th>
                      <th className="py-3 px-4">Rank / Designation</th>
                      <th className="py-3 px-4">Badge Number</th>
                      <th className="py-3 px-4 text-center">Active Case Load</th>
                      <th className="py-3 px-4">Workload Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ioWorkloadList.map(io => {
                      const count = parseInt(io.active_cases_count || 0, 10);
                      const isHigh = count >= 10;
                      const isOptimal = count <= 5;
                      return (
                        <tr key={io.officer_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-navy flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-navy text-amber-300 font-bold flex items-center justify-center text-xs">
                              {io.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'IO'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-navy">{io.full_name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">Officer ID: #{io.officer_id}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {io.rank || 'Investigating Officer'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                            {io.badge_no}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-sm font-bold text-navy">{count}</span>
                            <span className="text-[10px] text-slate-400 ml-1">cases</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isOptimal 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isHigh 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {isOptimal ? 'Optimal Capacity' : isHigh ? 'Heavy Caseload' : 'Moderate Caseload'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleTabChange('REGISTERED')}
                              className="text-xs px-2.5 py-1 rounded-lg bg-navy hover:bg-navy-light text-white font-medium cursor-pointer"
                            >
                              Assign Next FIR
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'APPEALS' ? (
            /* Tab: Supervisory Appeals */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-lg">account_balance</span>
                    Citizen Rejection Appeals (Section 173(4) BNSS 2023)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Statutory right of appeal when an e-complaint is marked non-cognizable or rejected by Desk Officer.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {appealsList.length} Pending Adjudications
                </span>
              </div>

              {loadingSpecialQueue ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <DocketCardSkeleton key={i} />
                  ))}
                </div>
              ) : appealsList.length === 0 ? (
                <EmptyState
                  title="No Pending Supervisory Appeals"
                  message="There are no citizen appeals awaiting Station House Officer adjudication at this time."
                  icon="task_alt"
                />
              ) : (
                <div className="grid gap-4">
                  {appealsList.map(appeal => (
                    <div
                      key={appeal.appeal_id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 p-5 shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Appeal #{appeal.appeal_id}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-600">
                            Ref: {appeal.tracking_id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Filed: {new Date(appeal.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Complainant:</span>
                          <p className="font-semibold text-navy">{appeal.citizen_name || 'Citizen Complainant'}</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">Station:</span>
                          <p className="text-slate-700">{appeal.station_name || 'Central Police Station'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Initial Rejection Grounds:</span>
                          <p className="text-rose-700 font-medium italic">{appeal.rejection_reason || 'Marked non-cognizable dispute.'}</p>
                        </div>
                      </div>

                      <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          Citizen Appeal Grounds (BNSS § 173(4)):
                        </span>
                        <p className="text-slate-800 italic leading-relaxed">
                          "{appeal.appeal_reason}"
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenDetail(appeal.fir_id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          View Original Docket
                        </button>
                        <button
                          onClick={() => handleOpenAppealReview(appeal)}
                          className="px-4 py-1.5 rounded-xl bg-navy hover:bg-navy-light text-amber-300 hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">rate_review</span>
                          <span>Adjudicate Appeal</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'TRANSFERS' ? (
            /* Tab: Inter-Station Transfers */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500 text-lg">sync_alt</span>
                    Incoming Inter-Station Case Transfers (Zero-FIR Jurisdiction Realignment)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cases lodged at other police stations requiring territorial reassignment to Central Police Station.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {transfersList.length} Incoming Transfers
                </span>
              </div>

              {loadingSpecialQueue ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <DocketCardSkeleton key={i} />
                  ))}
                </div>
              ) : transfersList.length === 0 ? (
                <EmptyState
                  title="No Incoming Case Transfers"
                  message="There are no pending jurisdiction transfers dispatched to Central Police Station."
                  icon="check_circle"
                />
              ) : (
                <div className="grid gap-4">
                  {transfersList.map(transfer => (
                    <div
                      key={transfer.transfer_id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 p-5 shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            Transfer #{transfer.transfer_id}
                          </span>
                          <span className="text-xs font-mono font-bold text-navy">
                            {transfer.fir_number || transfer.tracking_id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Dispatched: {new Date(transfer.transferred_at || transfer.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Originating Station:</span>
                          <p className="font-semibold text-navy">{transfer.from_station_name} ({transfer.from_station_code})</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">Originating Officer:</span>
                          <p className="text-slate-700">{transfer.transferred_by_user || 'Originating SHO'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Transfer Justification:</span>
                          <p className="text-slate-800 font-medium italic">{transfer.transfer_reason}</p>
                        </div>
                      </div>

                      {transfer.fir_description && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                          <strong className="text-navy">Incident Summary:</strong> {transfer.fir_description}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenDetail(transfer.fir_id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          Inspect Docket
                        </button>
                        <button
                          onClick={() => handleOpenTransferReview(transfer)}
                          className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">sync_saved_locally</span>
                          <span>Decide Transfer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main Filtered Dockets Queue */
            <section aria-labelledby="dockets-heading" className="space-y-4">
              <h2 id="dockets-heading" className="sr-only">Station Cases Queue</h2>

              {loadingQueue ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <DocketCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <EmptyState
                  title={
                    searchQuery
                      ? 'No Dockets Match Search Criteria'
                      : activeTab === 'UNDER_REVIEW'
                        ? 'No Complaints Awaiting FIR Registration'
                        : activeTab === 'REGISTERED'
                          ? 'No FIRs Awaiting IO Assignment'
                          : activeTab === 'PENDING_APPROVAL'
                            ? 'No Final Reports Awaiting Judicial Review'
                            : 'No Records In Current View'
                  }
                  message={
                    searchQuery
                      ? `No case docket matches "${searchQuery}". Clear your search or modify filters.`
                      : 'All station dockets have been processed or are active in other operational stages.'
                  }
                  actionLabel={searchQuery ? 'Clear Search Filter' : 'Refresh Queue'}
                  onAction={() => {
                    if (searchQuery) setSearchQuery('');
                    else loadStationQueue(false);
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map(item => {
                    const isUnderReview = item.status === 'UNDER_REVIEW';
                    const isRegistered = item.status === 'REGISTERED';
                    const isPendingApproval = item.status === 'PENDING_APPROVAL';

                    return (
                      <motion.div
                        key={item.fir_id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all ${
                          isUnderReview
                            ? 'border-amber-300 ring-1 ring-amber-400/20'
                            : isRegistered
                              ? 'border-cyan-300 ring-1 ring-cyan-400/20'
                              : isPendingApproval
                                ? 'border-purple-300 ring-1 ring-purple-400/20'
                                : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Tracking ID with copy */}
                            <button
                              onClick={() => handleCopyId(`track-${item.fir_id}`, item.tracking_id)}
                              className="font-mono text-xs font-bold text-navy hover:text-amber-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              title="Click to copy Tracking ID"
                            >
                              <span>{item.tracking_id}</span>
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                {copiedId === `track-${item.fir_id}` ? 'check' : 'content_copy'}
                              </span>
                            </button>

                            {/* FIR Number if available */}
                            {item.fir_number && (
                              <button
                                onClick={() => handleCopyId(`fir-${item.fir_id}`, item.fir_number)}
                                className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="Permanent Registered FIR Number"
                              >
                                <span className="material-symbols-outlined text-[13px] text-amber-600">verified</span>
                                <span>{item.fir_number}</span>
                              </button>
                            )}

                            {/* Priority Tag */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.priority === 1
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.priority === 2
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              Priority {item.priority || 2}
                            </span>

                            {/* Category Badge */}
                            {item.category_name && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.category_name}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status} />
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.incident_dt || item.submitted_at || Date.now()).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Middle Description & Complainant particulars */}
                        <div className="py-3 grid md:grid-cols-3 gap-3 text-xs">
                          <div className="md:col-span-2 space-y-1.5">
                            <p className="text-slate-800 leading-relaxed font-normal">
                              {item.description}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                              <span>{item.location_text || 'Central District Jurisdiction'}</span>
                            </p>

                            {/* Desk Officer Notes or Timeline Recommendation */}
                            {item.desk_officer_notes && (
                              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-[11px] text-slate-700 flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-xs text-amber-500 mt-0.5">assignment</span>
                                <span><strong>Desk Scrutiny:</strong> {item.desk_officer_notes}</span>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Complainant &amp; IO Assignment
                            </span>
                            <p className="font-semibold text-navy text-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-slate-400">person</span>
                              <span>{item.complainant_name || 'Verified Citizen'}</span>
                            </p>
                            {item.complainant_phone && (
                              <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">call</span>
                                <span>{item.complainant_phone}</span>
                              </p>
                            )}

                            {item.assigned_io_name ? (
                              <div className="pt-1 border-t border-slate-200/60 mt-1">
                                <span className="text-[10px] text-slate-400 font-bold block">Assigned IO:</span>
                                <span className="font-bold text-navy text-[11px]">{item.assigned_io_name}</span>
                                {item.assigned_io_badge && (
                                  <span className="text-[10px] text-slate-500 font-mono block">({item.assigned_io_badge})</span>
                                )}
                              </div>
                            ) : (
                              <div className="pt-1 border-t border-slate-200/60 mt-1">
                                <span className="text-[10px] text-amber-700 font-semibold block">IO Not Yet Designated</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                          {/* Attached legal sections if tagged */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.legal_sections && item.legal_sections.length > 0 ? (
                              item.legal_sections.map((sec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-light/10 text-navy font-semibold border border-navy/20"
                                >
                                  {sec.act ? `${sec.act} ${sec.section_no}` : (typeof sec === 'string' ? sec : `Sec ${sec.section_id}`)}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No legal sections attached</span>
                            )}
                          </div>

                          {/* Action Buttons tailored to Status */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDetail(item.fir_id)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              View Docket
                            </button>

                            {/* ACTION 1: Register FIR (for UNDER_REVIEW) */}
                            {isUnderReview && (
                              <button
                                onClick={() => handleOpenRegisterModal(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                <span>Approve &amp; Register FIR</span>
                              </button>
                            )}

                            {/* ACTION 2: Assign IO (for REGISTERED) */}
                            {isRegistered && (
                              <button
                                onClick={() => handleOpenAssignModal(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span className="material-symbols-outlined text-sm">badge</span>
                                <span>Assign Investigating Officer</span>
                              </button>
                            )}

                            {/* ACTION 3: Review Report (for PENDING_APPROVAL) */}
                            {isPendingApproval && (
                              <button
                                onClick={() => handleOpenReportReview(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                <span>Review Final Report</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* ================================================================= */}
      {/* MODAL 1: APPROVE & REGISTER FIR (ATOMIC TRANSACTION)              */}
      {/* ================================================================= */}
      <AnimatePresence>
        {registerTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-navy text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Statutory FIR Registration Approval</h3>
                    <p className="text-[11px] text-slate-300 font-mono">Ref: {registerTarget.tracking_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRegisterTarget(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {registeredResult ? (
                  /* Success Confirmation Screen */
                  <div className="text-center py-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                      <span className="material-symbols-outlined text-3xl">verified</span>
                    </div>
                    <h4 className="text-base font-bold text-navy">FIR Successfully Registered</h4>
                    <p className="text-xs text-slate-600">
                      Atomic FIR sequence number generated and committed to the police database.
                    </p>

                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl max-w-sm mx-auto">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Official FIR Number:</span>
                      <span className="text-lg font-mono font-bold text-navy block mt-1">
                        {registeredResult.firNumber || registeredResult.fir_number || 'FIR/CPS-01/2026/000XX'}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-4">
                      <button
                        onClick={() => {
                          const target = registerTarget;
                          setRegisterTarget(null);
                          handleOpenAssignModal({ ...target, fir_number: registeredResult.firNumber || registeredResult.fir_number });
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">badge</span>
                        <span>Assign IO Now</span>
                      </button>
                      <button
                        onClick={() => setRegisterTarget(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Return to Queue
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Complaint Overview */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Complainant: <strong className="text-navy">{registerTarget.complainant_name}</strong></span>
                        <span>Incident: {new Date(registerTarget.incident_dt || Date.now()).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed italic">
                        "{registerTarget.description}"
                      </p>
                    </div>

                    {/* Legal Sections Verification */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold flex items-center gap-1 text-[11px]">
                        <span className="material-symbols-outlined text-sm text-navy">gavel</span>
                        <span>Attached Legal Sections:</span>
                      </label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap">
                        {registerTarget.legal_sections && registerTarget.legal_sections.length > 0 ? (
                          registerTarget.legal_sections.map((sec, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-navy text-amber-300 font-mono font-bold text-xs">
                              {sec.act ? `${sec.act} ${sec.section_no}` : (typeof sec === 'string' ? sec : `Sec ${sec.section_id}`)}
                            </span>
                          ))
                        ) : (
                          <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span>No legal sections attached. Desk triage required before registration.</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SHO Registration Endorsement Notes */}
                    <div className="space-y-1.5">
                      <label htmlFor="regNotes" className="text-slate-700 font-bold block text-[11px]">
                        SHO Registration Endorsement Directives:
                      </label>
                      <textarea
                        id="regNotes"
                        rows={3}
                        value={registrationNotes}
                        onChange={(e) => setRegistrationNotes(e.target.value)}
                        placeholder="Enter statutory directives for formal FIR registration..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 text-xs"
                      />
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">info</span>
                      <span>
                        Executing this transaction generates an atomic FIR number, creates an official case record, and notifies the citizen via the citizen portal.
                      </span>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setRegisterTarget(null)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRegister}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                          {actionLoading ? 'sync' : 'verified_user'}
                        </span>
                        <span>{actionLoading ? 'Registering...' : 'Approve & Register FIR'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* MODAL 2: ASSIGN INVESTIGATING OFFICER (IO)                         */}
      {/* ================================================================= */}
      <AnimatePresence>
        {assignTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-cyan-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-800 border border-cyan-700 flex items-center justify-center text-cyan-300">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Designate Investigating Officer (IO)</h3>
                    <p className="text-[11px] text-cyan-200 font-mono">
                      Case: {assignTarget.fir_number || assignTarget.tracking_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignTarget(null)}
                  className="text-cyan-300 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Available Officers Selection */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold block text-[11px]">
                    Select Officer from Station Roster:
                  </label>
                  {loadingIos ? (
                    <p className="text-center py-4 text-slate-400">Loading station roster...</p>
                  ) : availableIos.length === 0 ? (
                    <p className="text-center py-4 text-rose-600 font-semibold">No eligible officers found for assignment.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableIos.map(officer => {
                        const count = parseInt(officer.active_cases_count || 0, 10);
                        const isSelected = String(selectedIoId) === String(officer.officer_id);
                        return (
                          <div
                            key={officer.officer_id}
                            onClick={() => setSelectedIoId(officer.officer_id)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-cyan-50/80 border-cyan-600 ring-2 ring-cyan-500/20'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="io_selection"
                                checked={isSelected}
                                onChange={() => setSelectedIoId(officer.officer_id)}
                                className="accent-cyan-600 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-navy text-xs">{officer.full_name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {officer.rank} • Badge: <span className="font-mono">{officer.badge_no}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                count <= 5
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {count} Active Cases
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assignment Reason / Directives */}
                <div className="space-y-1.5">
                  <label htmlFor="assignReason" className="text-slate-700 font-bold block text-[11px]">
                    Investigation Directives &amp; Mandate:
                  </label>
                  <textarea
                    id="assignReason"
                    rows={3}
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    placeholder="Enter directives for IO (e.g., forensics, scene visit, witness statements)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-slate-800 text-xs"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setAssignTarget(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAssign}
                    disabled={actionLoading || !selectedIoId}
                    className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                      {actionLoading ? 'sync' : 'how_to_reg'}
                    </span>
                    <span>{actionLoading ? 'Assigning...' : 'Confirm Assignment'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* MODAL 3: REVIEW FINAL REPORT (CHARGESHEET / CLOSURE)              */}
      {/* ================================================================= */}
      <AnimatePresence>
        {reportReviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-purple-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-900 border border-purple-800 flex items-center justify-center text-purple-300">
                    <span className="material-symbols-outlined text-lg">gavel</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Review Final Investigation Report</h3>
                    <p className="text-[11px] text-purple-200 font-mono">
                      FIR: {reportReviewTarget.fir_number || reportReviewTarget.tracking_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReportReviewTarget(null)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* Case Particulars */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy">{reportReviewTarget.complainant_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      Final Investigation Report
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">
                    "{reportReviewTarget.description}"
                  </p>
                </div>

                {/* Decision Selector */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold block text-[11px]">
                    Statutory SHO Decision:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportDecision('APPROVE')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        reportDecision === 'APPROVE'
                          ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-500/20 text-purple-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-sm text-purple-700">check_circle</span>
                        <span>Approve Report</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Submit chargesheet / closure to Judicial Magistrate.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportDecision('SEND_BACK')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        reportDecision === 'SEND_BACK'
                          ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 text-amber-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-sm text-amber-700">undo</span>
                        <span>Send Back to IO</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Direct further investigation on missing leads.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Court Name (if approving) */}
                {reportDecision === 'APPROVE' && (
                  <div className="space-y-1.5">
                    <label htmlFor="courtName" className="text-slate-700 font-bold block text-[11px]">
                      Designated Judicial Court:
                    </label>
                    <input
                      id="courtName"
                      type="text"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      placeholder="e.g. Court of Metropolitan Magistrate #03"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-800 text-xs"
                    />
                  </div>
                )}

                {/* Remarks Textarea */}
                <div className="space-y-1.5">
                  <label htmlFor="reportRemarks" className="text-slate-700 font-bold block text-[11px]">
                    SHO Evaluation &amp; Judicial Endorsement Remarks:
                  </label>
                  <textarea
                    id="reportRemarks"
                    rows={3}
                    value={reportRemarks}
                    onChange={(e) => setReportRemarks(e.target.value)}
                    placeholder="Enter judicial review remarks or investigation directives..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-800 text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setReportReviewTarget(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReportReview}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                      {actionLoading ? 'sync' : 'gavel'}
                    </span>
                    <span>{actionLoading ? 'Processing...' : 'Submit Decision'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* MODAL 4: ADJUDICATE SUPERVISORY APPEAL                            */}
      {/* ================================================================= */}
      <AnimatePresence>
        {appealReviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 bg-rose-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-900 border border-rose-800 flex items-center justify-center text-rose-300">
                    <span className="material-symbols-outlined text-lg">account_balance</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Adjudicate Supervisory Appeal</h3>
                    <p className="text-[11px] text-rose-200 font-mono">
                      Appeal #{appealReviewTarget.appeal_id} • Ref: {appealReviewTarget.tracking_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAppealReviewTarget(null)}
                  className="text-rose-300 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-800 uppercase">Citizen's Appeal Grounds:</span>
                  <p className="text-slate-800 italic">"{appealReviewTarget.appeal_reason}"</p>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-700 font-bold block text-[11px]">
                    Supervisory Decision:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAppealDecision('ACCEPT')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        appealDecision === 'ACCEPT'
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-sm text-emerald-700">task_alt</span>
                        <span>Accept Appeal</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Reopen docket for fresh inquiry and FIR registration.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppealDecision('REJECT')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        appealDecision === 'REJECT'
                          ? 'bg-rose-50/80 border-rose-600 ring-2 ring-rose-500/20 text-rose-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-sm text-rose-700">cancel</span>
                        <span>Uphold Rejection</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Confirm non-cognizable civil nature.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="appealNotes" className="text-slate-700 font-bold block text-[11px]">
                    Statutory Ruling &amp; Supervisory Notes:
                  </label>
                  <textarea
                    id="appealNotes"
                    rows={3}
                    value={appealNotes}
                    onChange={(e) => setAppealNotes(e.target.value)}
                    placeholder="Enter reason for accepting or rejecting appeal..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setAppealReviewTarget(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAppealReview}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-amber-300 font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                      {actionLoading ? 'sync' : 'balance'}
                    </span>
                    <span>{actionLoading ? 'Recording...' : 'Record Ruling'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* MODAL 5: DECIDE INTER-STATION CASE TRANSFER                       */}
      {/* ================================================================= */}
      <AnimatePresence>
        {transferReviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 bg-teal-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-900 border border-teal-800 flex items-center justify-center text-teal-300">
                    <span className="material-symbols-outlined text-lg">sync_alt</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Decide Inter-Station Transfer</h3>
                    <p className="text-[11px] text-teal-200 font-mono">
                      Ref: {transferReviewTarget.fir_number || transferReviewTarget.tracking_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferReviewTarget(null)}
                  className="text-teal-300 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-teal-800 uppercase">Transfer Grounds:</span>
                  <p className="text-slate-800 italic">"{transferReviewTarget.transfer_reason}"</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Originating Police Station: <strong>{transferReviewTarget.from_station_name}</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="transferRemarks" className="text-slate-700 font-bold block text-[11px]">
                    Station Endorsement / Rejection Remarks:
                  </label>
                  <textarea
                    id="transferRemarks"
                    rows={3}
                    value={transferRemarks}
                    onChange={(e) => setTransferRemarks(e.target.value)}
                    placeholder="Enter territorial jurisdiction comments..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleRejectTransfer}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    Reject &amp; Return Case
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTransferReviewTarget(null)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAcceptTransfer}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                        {actionLoading ? 'sync' : 'check'}
                      </span>
                      <span>Accept Jurisdiction</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* DRAWER: COMPREHENSIVE DOCKET DETAILS REVIEW                       */}
      {/* ================================================================= */}
      <AnimatePresence>
        {selectedFirId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-navy-dark/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 bg-navy text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <span className="material-symbols-outlined text-xl">folder_open</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Full Station Case Record</h3>
                    <p className="text-xs text-slate-300 font-mono">
                      Docket ID: #{selectedFirId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 rounded-xl bg-navy-deep hover:bg-navy-light text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                {loadingDetail ? (
                  <div className="space-y-4">
                    <DocketCardSkeleton />
                    <DocketCardSkeleton />
                  </div>
                ) : detailError ? (
                  <ErrorState
                    title="Failed to Load Case Record"
                    message={detailError}
                    onRetry={() => handleOpenDetail(selectedFirId)}
                  />
                ) : docketDetail ? (
                  <>
                    {/* Status & Identifiers Header */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tracking Reference:</span>
                          <p className="font-mono font-bold text-navy text-sm">{docketDetail.tracking_id}</p>
                        </div>
                        <StatusBadge status={docketDetail.status} />
                      </div>

                      {docketDetail.fir_number && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mt-2 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-800 font-bold uppercase block">Official Registered FIR:</span>
                            <span className="font-mono font-bold text-navy text-sm">{docketDetail.fir_number}</span>
                          </div>
                          <span className="material-symbols-outlined text-amber-600 text-xl">verified</span>
                        </div>
                      )}
                    </div>

                    {/* Incident Narrative */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-500">description</span>
                        Incident Narrative &amp; Facts
                      </h4>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 leading-relaxed">
                        {docketDetail.description}
                      </div>
                    </div>

                    {/* Key Incident Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Category:</span>
                        <p className="font-bold text-navy mt-0.5">{docketDetail.category_name || 'General Criminal Offence'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Incident Date / Time:</span>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {new Date(docketDetail.incident_dt || Date.now()).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Complainant:</span>
                        <p className="font-bold text-navy mt-0.5">{docketDetail.complainant_name || 'Verified Citizen'}</p>
                        {docketDetail.complainant_phone && (
                          <span className="text-[10px] text-slate-500 font-mono">Ph: {docketDetail.complainant_phone}</span>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Police Station:</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{docketDetail.station_name || 'Central Police Station'}</p>
                      </div>
                    </div>

                    {/* Tagged Legal Sections */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-navy">gavel</span>
                        Tagged Legal Sections
                      </h4>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 flex-wrap">
                        {docketDetail.legal_sections && docketDetail.legal_sections.length > 0 ? (
                          docketDetail.legal_sections.map((sec, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-navy text-amber-300 font-mono font-bold text-xs shadow-xs">
                              {sec.act ? `${sec.act} ${sec.section_no}` : (typeof sec === 'string' ? sec : `Sec ${sec.section_id}`)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No legal sections attached</span>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Status History */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-500">history</span>
                        Persisted Audit Trail &amp; Workflow History
                      </h4>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                        {docketDetail.history && docketDetail.history.length > 0 ? (
                          docketDetail.history.map((h, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-3 border-l-2 border-navy pl-3 py-1">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-navy text-xs">
                                    {h.from_state ? `${h.from_state} → ` : ''}{h.to_state}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(h.changed_at || Date.now()).toLocaleString('en-IN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    })}
                                  </span>
                                </div>
                                {h.note && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 italic">"{h.note}"</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">No historical transitions recorded.</p>
                        )}
                      </div>
                    </div>



                    {/* Drawer Action Bar */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                      {docketDetail.status === 'UNDER_REVIEW' && (
                        <button
                          onClick={() => {
                            handleCloseDetail();
                            handleOpenRegisterModal(docketDetail);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">verified_user</span>
                          <span>Approve &amp; Register FIR</span>
                        </button>
                      )}
                      {docketDetail.status === 'REGISTERED' && (
                        <button
                          onClick={() => {
                            handleCloseDetail();
                            handleOpenAssignModal(docketDetail);
                          }}
                          className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">badge</span>
                          <span>Assign Investigating Officer</span>
                        </button>
                      )}
                      {docketDetail.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => {
                            handleCloseDetail();
                            handleOpenReportReview(docketDetail);
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          <span>Review Final Report</span>
                        </button>
                      )}
                      <button
                        onClick={handleCloseDetail}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShoDashboardPage;
