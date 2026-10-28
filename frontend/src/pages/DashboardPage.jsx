import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { complaintsApi, firApi, notificationsApi } from '../lib/api';
import {
  MetricCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  MetricCardSkeleton,
  DocketCardSkeleton,
  Button
} from '../components/ui';

export function DashboardPage() {
  const { user, isAuthenticated, role, isCitizen, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [dockets, setDockets] = useState([]);
  const [loadingDockets, setLoadingDockets] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'closed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Copy feedback
  const [copiedId, setCopiedId] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Clarification Response Modal
  const [respondingDocket, setRespondingDocket] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [respondingLoading, setRespondingLoading] = useState(false);

  // Dossier Detail Modal
  const [detailDocket, setDetailDocket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Acknowledgement Slip Modal
  const [slipData, setSlipData] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);

  // Load User's Data from backend
  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingDockets(true);
    setFetchError(null);
    try {
      if (isCitizen) {
        const res = await complaintsApi.getMyComplaints();
        const list = res?.data || res || [];
        setDockets(Array.isArray(list) ? list : []);
      } else {
        // Police officer: load station inbox
        const res = await firApi.getStationInbox({ limit: 50 });
        const list = res?.data?.firs || res?.data || res || [];
        setDockets(Array.isArray(list) ? list : []);
      }

      // Load Notifications from actual notification API
      try {
        const [notifsRes, countRes] = await Promise.all([
          notificationsApi.getAll(),
          notificationsApi.getUnreadCount()
        ]);
        setNotifications(notifsRes?.data || notifsRes || []);
        setUnreadCount(countRes?.unreadCount || 0);
      } catch {
        // notification errors shouldn't crash dashboard
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
      setFetchError(err.message || 'Unable to connect to CaseSync server. Please verify your connection.');
    } finally {
      setLoadingDockets(false);
    }
  }, [isAuthenticated, isCitizen]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate, loadDashboardData]);

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

  // Copy ID to clipboard
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit clarification response
  const handleSendClarification = async (e) => {
    e.preventDefault();
    if (!respondingDocket || !responseText.trim()) return;
    try {
      setRespondingLoading(true);
      await complaintsApi.respondToInfo(respondingDocket.fir_id, responseText.trim());
      setRespondingDocket(null);
      setResponseText('');
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to submit response.');
    } finally {
      setRespondingLoading(false);
    }
  };

  // Open Full Dossier Details
  const handleOpenDetails = async (docket) => {
    try {
      setDetailLoading(true);
      setDetailDocket(docket);
      const res = await complaintsApi.getById(docket.fir_id);
      if (res?.data) {
        setDetailDocket(res.data);
      }
    } catch (e) {
      console.warn('Error fetching detail docket:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Official Acknowledgement Slip
  const handleOpenSlip = async (firId) => {
    try {
      setSlipLoading(true);
      setSlipData(null);
      const res = await complaintsApi.getAcknowledgementSlip(firId);
      setSlipData(res?.data || res);
    } catch (err) {
      alert(err.message || 'Could not generate official acknowledgement slip.');
    } finally {
      setSlipLoading(false);
    }
  };

  // Filtered Dockets
  const filteredDockets = dockets.filter((d) => {
    const status = d.status || '';
    const isClosed = ['CLOSED', 'REJECTED', 'DISMISSED', 'QUASHED', 'CHARGESHEET_FILED', 'CLOSURE_FILED'].includes(status);
    
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = !isClosed;
    if (activeTab === 'closed') matchesTab = isClosed;

    const query = searchQuery.toLowerCase();
    const id = (d.fir_number || d.tracking_id || '').toLowerCase();
    const desc = (d.description || d.incident_description || '').toLowerCase();
    const loc = (d.location_text || d.incident_place || '').toLowerCase();
    const cat = (d.category_name || '').toLowerCase();

    const matchesSearch = !query || id.includes(query) || desc.includes(query) || loc.includes(query) || cat.includes(query);
    const matchesCategory = selectedCategory === 'ALL' || d.category_name === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  // Calculate Exact BNSS Complaint Lifecycle Metrics from Actual API Data
  const totalDockets = dockets.length;
  const investigationCount = dockets.filter(d => ['REGISTERED', 'ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL'].includes(d.status)).length;
  const clarificationCount = dockets.filter(d => d.status === 'INFO_REQUESTED').length;
  const closedCount = dockets.filter(d => ['CLOSED', 'REJECTED', 'QUASHED', 'CHARGESHEET_FILED', 'CLOSURE_FILED'].includes(d.status)).length;
  const activeCount = dockets.filter(d => !['CLOSED', 'REJECTED', 'QUASHED', 'CHARGESHEET_FILED', 'CLOSURE_FILED'].includes(d.status)).length;


  return (
    <div className="min-h-screen flex bg-ivory text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="dockets" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-navy-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-navy-900 font-bold">Portal Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Citizen Dockets</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Quick Link to Lodge New FIR */}
            <Link
              to="/dashboard/file-fir"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit_document</span>
              <span>+ Lodge e-FIR</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-950 transition-colors cursor-pointer"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
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
                        <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} unread)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n, i) => (
                          <div
                            key={n.notification_id || i}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              n.is_read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{n.title || n.message}</div>
                            {n.body && <p className="text-[11px] text-slate-600">{n.body}</p>}
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Executive Citizen Greeting Banner */}
          <section className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 z-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Citizen Justice Workspace
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-900 text-white shadow-2xs">
                  {role || 'Citizen'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none"></span>
                  BNSS Verified Informant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Welcome, <strong className="text-slate-900">{user?.fullName || user?.email?.split('@')[0] || 'Citizen'}</strong>. 
                Monitor authentic police dockets, state machine investigation milestones, and certified FIR acknowledgements under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
              <Link
                to="/dashboard/file-fir"
                className="interactive-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base text-amber-300">edit_document</span>
                <span>+ Lodge New e-FIR</span>
              </Link>
              <Link
                to="/dashboard/live-tracking"
                className="interactive-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-900 hover:bg-slate-50 text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base text-cyan-600">radar</span>
                <span>Track Docket</span>
              </Link>
            </div>

            {/* Subtle decorative watermark */}
            <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-[0.03] select-none flex items-center pr-10">
              <span className="material-symbols-outlined text-[160px]">local_police</span>
            </div>
          </section>

          {/* Metric KPI Cards */}
          {loadingDockets ? (
            <MetricCardSkeleton count={4} />
          ) : (
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="Key Performance Indicators">
              <MetricCard
                title="Total Dossiers"
                value={totalDockets}
                icon="folder_open"
                variant="navy"
                description="All submitted records"
                onClick={() => setActiveTab('all')}
                isActive={activeTab === 'all'}
              />
              <MetricCard
                title="Under Investigation"
                value={investigationCount}
                icon="manage_search"
                variant="emerald"
                description="Active IO investigations"
                onClick={() => setActiveTab('active')}
                isActive={activeTab === 'active'}
              />
              <MetricCard
                title="Action Required"
                value={clarificationCount}
                icon="help_outline"
                variant="amber"
                badge={clarificationCount > 0 ? `${clarificationCount} Action` : undefined}
                description="Desk clarification notices"
                onClick={() => setActiveTab('active')}
              />
              <MetricCard
                title="Disposed / Closed"
                value={closedCount}
                icon="task_alt"
                variant="slate"
                description="Concluded cases & disposals"
                onClick={() => setActiveTab('closed')}
                isActive={activeTab === 'closed'}
              />
            </section>
          )}

          {/* Dockets Controls & Filter */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`interactive-btn px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'active'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50'
                  }`}
                >
                  Active Cases ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('closed')}
                  className={`interactive-btn px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'closed'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50'
                  }`}
                >
                  Disposed / Closed ({closedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`interactive-btn px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50'
                  }`}
                >
                  All Dossiers ({totalDockets})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-base">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by FIR / Tracking ID, place, facts..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 transition-colors shadow-2xs placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Dockets List */}
            {loadingDockets ? (
              <DocketCardSkeleton count={3} />
            ) : fetchError && dockets.length === 0 ? (
              <ErrorState
                title="Police Case Records Temporarily Unavailable"
                message={fetchError}
                onRetry={loadDashboardData}
              />
            ) : filteredDockets.length === 0 ? (
              dockets.length === 0 ? (
                <EmptyState
                  icon="folder_open"
                  title="No Police Dockets on Record"
                  description="You have not submitted any complaints or e-FIR applications yet. Lodge your first complaint through the secure BNSS 2023 portal or locate your local jurisdiction."
                  action={{
                    label: "+ Lodge New e-FIR",
                    href: "/dashboard/file-fir",
                    icon: "edit_document"
                  }}
                  secondaryAction={{
                    label: "Locate Police Station",
                    href: "/dashboard/stations",
                    icon: "location_on"
                  }}
                />
              ) : (
                <EmptyState
                  icon="search_off"
                  title="No Matching Dockets Found"
                  description={`No complaints found for tab "${activeTab}" with search "${searchQuery}". Adjust your filters or reset to view all dossiers.`}
                  action={{
                    label: "Reset All Filters",
                    onClick: () => {
                      setActiveTab('all');
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    },
                    icon: "restart_alt"
                  }}
                />
              )
            ) : (
              <div className="space-y-4">
                {filteredDockets.map((docket) => {
                  const idToTrack = docket.tracking_id || docket.fir_number || docket.fir_id;
                  const isClarificationNeeded = docket.status === 'INFO_REQUESTED';
                  const isRejected = docket.status === 'REJECTED';
                  const isUnderInvestigation = docket.status === 'UNDER_INVESTIGATION' || docket.status === 'ASSIGNED';

                  const displayDesc = docket.description || docket.incident_description || 'Detailed factual statement recorded under BNSS Section 173.';
                  const displayLoc = docket.location_text || docket.incident_place || 'Central Jurisdictional Division';
                  const displayDate = docket.incident_dt || docket.incident_date || docket.created_at;

                  return (
                    <motion.div
                      key={docket.fir_id || docket.tracking_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="interactive-card rounded-2xl bg-white border border-slate-200 hover:border-navy/40 transition-colors shadow-subtle overflow-hidden"
                    >
                      {/* Card Header Bar */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Docket ID with 1-click Copy */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="text-xs font-mono font-bold text-navy">
                              {docket.fir_number || docket.tracking_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(docket.fir_number || docket.tracking_id)}
                              className="text-slate-400 hover:text-navy transition-colors cursor-pointer"
                              title="Copy ID"
                            >
                              <span className="material-symbols-outlined text-xs">
                                {copiedId === (docket.fir_number || docket.tracking_id) ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>

                          {/* Standardized Status Badge */}
                          <StatusBadge status={docket.status} />

                          {/* Standardized Priority Badge */}
                          <StatusBadge priority={docket.priority} />

                          {/* Category Tag */}
                          {docket.category_name && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {docket.category_name}
                            </span>
                          )}
                        </div>

                        {/* Date & Station Tag */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <span className="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                          <span>{displayDate ? new Date(displayDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {/* Statement Gist */}
                        <div className="text-xs text-slate-700 leading-relaxed font-normal">
                          <strong className="text-slate-900 font-semibold block mb-0.5">Incident Statement &amp; Facts:</strong>
                          <p className="line-clamp-2 text-slate-600">{displayDesc}</p>
                        </div>

                        {/* Metadata Row: Location, Station, Assigned IO */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-slate-600 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">pin_drop</span>
                            <span className="truncate"><strong>Location:</strong> {displayLoc}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">shield</span>
                            <span className="truncate"><strong>Station:</strong> {docket.station_name || 'Central Police Station'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                            <span className="truncate">
                              <strong>Assigned IO:</strong> {docket.io_name ? `${docket.io_name} (${docket.io_badge})` : 'Under Desk Review'}
                            </span>
                          </div>
                        </div>

                        {/* Highlight: Action Needed when INFO_REQUESTED */}
                        {isClarificationNeeded && (
                          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-amber-600">help</span>
                                Clarification Notice from Station Desk
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                                Prompt Response Requested
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              {docket.rejection_reason || 'Please provide additional evidentiary details or serial numbers to complete the FIR registration verification.'}
                            </p>
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setRespondingDocket(docket)}
                                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-xs">reply</span>
                                <span>Submit Clarification Now</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Highlight: Rejection & Appeal when REJECTED */}
                        {isRejected && (
                          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-rose-600">cancel</span>
                                Complaint Rejection Recorded under BNSS 173
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                                Statutory Recourse Available
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-800">
                              <strong>Grounds:</strong> {docket.rejection_reason || 'Non-cognizable dispute. Matter advised to be resolved through civil jurisdiction.'}
                            </p>
                            <div className="pt-1 flex justify-end">
                              <Link
                                to={`/dashboard/grievance?appeal=${docket.fir_id}&trackingId=${encodeURIComponent(docket.tracking_id || '')}`}
                                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-xs">gavel</span>
                                <span>File Statutory Appeal to SP / ACP</span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Action Bar */}
                      <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          {/* Evidence Count Pill if Available */}
                          {parseInt(docket.evidence_count || 0) > 0 && (
                            <Link
                              to="/dashboard/evidence"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold hover:bg-amber-200 transition-colors whitespace-nowrap"
                            >
                              <span className="material-symbols-outlined text-xs">lock_person</span>
                              <span>{docket.evidence_count} Exhibits in Vault</span>
                            </Link>
                          )}

                          {/* Quick Acknowledgement Slip */}
                          <button
                            type="button"
                            onClick={() => handleOpenSlip(docket.fir_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-900 text-slate-700 hover:text-blue-900 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                            title="Official Slip"
                          >
                            <span className="material-symbols-outlined text-xs text-blue-900">description</span>
                            <span>Official Slip</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View Full Dossier */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(docket)}
                            className="interactive-btn px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>View Dossier</span>
                          </button>

                          {/* Live Tracking */}
                          <Link
                            to={`/dashboard/live-tracking?id=${encodeURIComponent(idToTrack)}`}
                            className="interactive-btn px-3.5 py-1.5 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-sm text-cyan-400">radar</span>
                            <span>Live Tracking</span>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Clarification Response Modal */}
      {respondingDocket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-amber-600">help</span>
                <h3 className="text-sm font-bold text-slate-900">Respond to Officer Clarification Notice</h3>
              </div>
              <button
                type="button"
                onClick={() => setRespondingDocket(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-semibold block">Desk Clarification Request:</span>
              <p>{respondingDocket.rejection_reason || 'Please provide additional evidentiary details or serial numbers to complete verification.'}</p>
            </div>

            <p className="text-xs text-slate-600">
              Docket: <strong className="text-blue-950 font-mono">{respondingDocket.tracking_id || respondingDocket.fir_number}</strong>
            </p>

            <form onSubmit={handleSendClarification} className="space-y-3">
              <textarea
                rows={4}
                required
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter formal factual clarification or item particulars..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-blue-900 focus:bg-white transition-colors"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingDocket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondingLoading}
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 active:bg-blue-950 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {respondingLoading ? 'Submitting…' : 'Send Clarification to Station'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dossier Detail Overview Modal */}
      {detailDocket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-blue-900">folder_open</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Dossier Record: {detailDocket.fir_number || detailDocket.tracking_id}
                  </h3>
                  <p className="text-[10px] text-slate-500">Status: <span className="font-mono font-bold text-slate-700">{detailDocket.status}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailDocket(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Case Particulars */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div><span className="text-slate-400 block text-[10px]">Crime Category</span> <strong>{detailDocket.category_name || 'General Offence'}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Police Station</span> <strong>{detailDocket.station_name || 'Central Police Station'}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Incident Date</span> <strong>{detailDocket.incident_dt ? new Date(detailDocket.incident_dt).toLocaleString() : 'N/A'}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Location</span> <strong>{detailDocket.location_text || detailDocket.incident_place || 'Jurisdiction Area'}</strong></div>
            </div>

            {/* Incident Statement */}
            <div className="space-y-1 text-xs">
              <span className="text-xs font-bold text-slate-900 block">Complainant Information Statement</span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                {detailDocket.description || detailDocket.incident_description || 'No detailed statement on file.'}
              </div>
            </div>

            {/* Persons Tagged */}
            {detailDocket.persons && detailDocket.persons.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-xs font-bold text-slate-900 block">Persons Tagged (Accused / Witnesses / Informant)</span>
                <div className="space-y-1">
                  {detailDocket.persons.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <div>
                        <strong>{p.full_name}</strong> ({p.person_role})
                        {p.address && <span className="text-slate-500 block text-[10px]">{p.address}</span>}
                      </div>
                      <span className="text-slate-400 font-mono">{p.contact || 'No contact'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {detailDocket.timeline && detailDocket.timeline.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-xs font-bold text-slate-900 block">State Machine Transition History</span>
                <div className="space-y-1.5">
                  {detailDocket.timeline.map((tl, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <span className="material-symbols-outlined text-sm text-blue-900 shrink-0">history</span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">
                          {tl.from_state ? `${tl.from_state} → ${tl.to_state}` : tl.to_state}
                        </div>
                        {tl.note && <p className="text-slate-500 text-[10px]">{tl.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tl.created_at ? new Date(tl.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenSlip(detailDocket.fir_id)}
                className="px-3 py-1.5 rounded-xl border border-blue-900 text-blue-900 text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailDocket(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Official Acknowledgement Slip Modal */}
      {slipData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border-2 border-blue-900 p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            {/* Slip Header */}
            <div className="text-center border-b-2 border-blue-900 pb-4 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-2xl text-blue-900">local_police</span>
                <span className="text-xs font-bold text-slate-600">Government of NCT of Delhi • Police Department</span>
              </div>
              <h2 className="text-lg font-black text-blue-950 tracking-tight">{slipData.documentTitle || 'Official FIR / Complaint Acknowledgement'}</h2>
              <p className="text-xs text-slate-600 font-medium">Recorded under Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023</p>
            </div>

            {/* Slip Key Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50">
              <div><span className="text-slate-500 text-[10px] block">Reference / Tracking ID</span> <strong className="font-mono text-sm text-blue-950">{slipData.trackingId}</strong></div>
              <div><span className="text-slate-500 text-[10px] block">Official FIR Number</span> <strong className="font-mono text-sm text-emerald-800">{slipData.firNumber || 'Pending SHO Approval'}</strong></div>
              <div><span className="text-slate-500 text-[10px] block">Police Station Jurisdiction</span> <strong>{slipData.policeStation?.name} ({slipData.policeStation?.code})</strong></div>
              <div><span className="text-slate-500 text-[10px] block">Current Legal Status</span> <strong className="text-blue-900">{slipData.status}</strong></div>
              <div><span className="text-slate-500 text-[10px] block">Date of Intake</span> <strong>{slipData.submittedAt ? new Date(slipData.submittedAt).toLocaleString() : 'N/A'}</strong></div>
              <div><span className="text-slate-500 text-[10px] block">District / Zone</span> <strong>{slipData.policeStation?.district || 'Central District'}</strong></div>
            </div>

            {/* Complainant & Incident */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Complainant Particulars</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>Name: <strong>{slipData.complainant?.fullName}</strong></div>
                  <div>ID Proof: <strong>{slipData.complainant?.idType} ({slipData.complainant?.maskedIdNumber})</strong></div>
                  <div className="col-span-2">Address: {slipData.complainant?.address || 'On Record'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Incident Brief</span>
                <p className="text-slate-700 leading-relaxed">{slipData.incident?.description}</p>
                <div className="pt-1 text-[11px] text-slate-500">
                  Location: <strong>{slipData.incident?.locationText}</strong> • Category: <strong>{slipData.incident?.categoryName}</strong>
                </div>
              </div>

              {/* Tagged Sections if available */}
              {slipData.legalSections && slipData.legalSections.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px]">Tagged Legal Sections</span>
                  <div className="flex flex-wrap gap-1.5">
                    {slipData.legalSections.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold border border-blue-200">
                        {s.act} Sec. <span className="font-mono">{s.section_no}</span> - {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seal & Disclaimer */}
            <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 space-y-1.5">
              <div className="flex justify-between items-center">
                <div>Digital Verification Digest: <strong className="font-mono">{slipData.digitalSeal?.verificationDigest?.substring(0, 24)}…</strong></div>
                <div>Issued: {new Date(slipData.digitalSeal?.issuedAt || Date.now()).toLocaleDateString()}</div>
              </div>
              <p className="italic">{slipData.disclaimer || 'This document is an electronic acknowledgement issued under BNSS 2023 Section 173.'}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 active:bg-blue-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Official Certificate</span>
              </button>

              <button
                type="button"
                onClick={() => setSlipData(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
