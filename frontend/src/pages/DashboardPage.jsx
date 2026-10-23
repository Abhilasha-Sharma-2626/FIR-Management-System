import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { complaintsApi, firApi, notificationsApi } from '../lib/api';

export function DashboardPage() {
  const { user, isAuthenticated, role, isCitizen, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [dockets, setDockets] = useState([]);
  const [loadingDockets, setLoadingDockets] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Clarification Response Modal
  const [respondingDocket, setRespondingDocket] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [respondingLoading, setRespondingLoading] = useState(false);

  // Load User's Data
  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingDockets(true);
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

      // Load Notifications
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

  // Submit clarification response
  const handleSendClarification = async (e) => {
    e.preventDefault();
    if (!respondingDocket || !responseText.trim()) return;
    try {
      setRespondingLoading(true);
      await complaintsApi.respondToInfo(respondingDocket.fir_id, responseText);
      setRespondingDocket(null);
      setResponseText('');
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to submit response.');
    } finally {
      setRespondingLoading(false);
    }
  };

  // Filtered Dockets
  const filteredDockets = dockets.filter((d) => {
    const status = d.status || '';
    const isClosed = ['CLOSED', 'REJECTED', 'DISMISSED'].includes(status);
    const matchesTab = activeTab === 'active' ? !isClosed : isClosed;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      (d.fir_number && d.fir_number.toLowerCase().includes(query)) ||
      (d.tracking_id && d.tracking_id.toLowerCase().includes(query)) ||
      (d.incident_place && d.incident_place.toLowerCase().includes(query)) ||
      (d.incident_description && d.incident_description.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  // Calculate Metrics from real data
  const totalDockets = dockets.length;
  const activeCount = dockets.filter(d => !['CLOSED', 'REJECTED'].includes(d.status)).length;
  const registeredCount = dockets.filter(d => ['REGISTERED', 'UNDER_INVESTIGATION', 'CHARGESHEETED'].includes(d.status)).length;
  const closedCount = dockets.filter(d => ['CLOSED', 'REJECTED'].includes(d.status)).length;

  return (
    <div className="min-h-screen flex bg-background text-on-surface antialiased">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="dockets" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-secondary hover:text-primary transition-colors">Home</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">Portal Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-outline-variant hover:bg-surface-container-low text-secondary hover:text-primary transition-colors cursor-pointer"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
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
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-lg p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-outline-variant/60">
                      <span className="text-xs font-bold text-primary">Notifications ({unreadCount} new)</span>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-secondary hover:text-primary font-medium"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-secondary text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n, i) => (
                          <div
                            key={n.notification_id || i}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              n.is_read ? 'bg-surface-container-low/40 border-outline-variant/40 text-secondary' : 'bg-surface-container-low border-primary/20 text-primary'
                            }`}
                          >
                            <div className="font-semibold">{n.title || n.message}</div>
                            {n.body && <p className="text-[11px] text-secondary">{n.body}</p>}
                            <span className="text-[10px] text-secondary font-mono block">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
              className="p-2 text-secondary hover:text-error hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Greeting Banner */}
          <section className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                  Welcome, {user?.fullName || user?.email?.split('@')[0] || 'Citizen'}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-primary text-white uppercase shadow-xs">
                  {role}
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                {isCitizen
                  ? 'Access your registered dockets, investigation milestones, and official receipts.'
                  : `Station Personnel Console: Review inbox, case diaries, and statutory filings.`}
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/file-complaint"
                className="interactive-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-base text-tertiary-fixed-dim">add</span>
                <span>+ Lodge New e-FIR</span>
              </Link>
            </motion.div>
          </section>

          {/* Metric KPI Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: 'Total Dossiers', value: totalDockets, icon: 'folder_open', color: 'text-primary' },
              { label: 'Active Inquiries', value: activeCount, icon: 'pending_actions', color: 'text-amber-600' },
              { label: 'Registered FIRs', value: registeredCount, icon: 'local_police', color: 'text-emerald-600' },
              { label: 'Disposed / Closed', value: closedCount, icon: 'task_alt', color: 'text-secondary' }
            ].map((kpi, idx) => (
              <div key={idx} className="interactive-card p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs space-y-1">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{kpi.label}</span>
                  <span className={`material-symbols-outlined text-lg ${kpi.color}`}>{kpi.icon}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">{kpi.value}</div>
              </div>
            ))}
          </section>

          {/* Dockets Controls & Filter */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className={`interactive-btn px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'active'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  Active Cases ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('closed')}
                  className={`interactive-btn px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'closed'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-lowest border border-outline-variant text-secondary hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  Disposed / Closed ({closedCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-secondary text-base">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, place, facts..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Dockets List */}
            {loadingDockets ? (
              <div className="p-12 text-center text-xs text-secondary space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Retrieving authentic criminal records ledger...</p>
              </div>
            ) : filteredDockets.length === 0 ? (
              <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-secondary">inbox</span>
                <div className="text-sm font-bold text-primary">No Records Found</div>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  {activeTab === 'active'
                    ? 'You have no active pending dockets. Use the button above to lodge an e-FIR.'
                    : 'No closed or disposed cases recorded in this view.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDockets.map((docket) => {
                  const idToTrack = docket.tracking_id || docket.fir_number || docket.fir_id;
                  const isClarificationNeeded = docket.status === 'INFO_REQUESTED';

                  return (
                    <motion.div
                      key={docket.fir_id || docket.tracking_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="interactive-card p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-primary/40 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            {docket.fir_number || docket.tracking_id}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-surface-container text-primary">
                            {docket.status}
                          </span>
                          {isClarificationNeeded && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              Action Required: Clarification Requested
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-secondary font-mono">
                          {docket.incident_date ? new Date(docket.incident_date).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <div className="text-xs text-secondary space-y-1">
                        <div className="text-primary font-medium line-clamp-2">
                          {docket.incident_description || 'No detailed statement recorded.'}
                        </div>
                        {docket.incident_place && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="material-symbols-outlined text-xs">pin_drop</span>
                            <span>{docket.incident_place}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-outline-variant/60 text-xs">
                        <div className="text-secondary text-[11px]">
                          Station: <strong className="text-primary">{docket.station_name || 'Station Jurisdiction'}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {isClarificationNeeded && (
                            <button
                              type="button"
                              onClick={() => setRespondingDocket(docket)}
                              className="interactive-btn px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                            >
                              Submit Clarification
                            </button>
                          )}
                          <Link
                            to={`/live-tracking?id=${encodeURIComponent(idToTrack)}`}
                            className="interactive-btn px-3.5 py-1.5 rounded-xl bg-surface-container text-primary font-semibold hover:bg-surface-variant transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">radar</span>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b pb-2 border-outline-variant">
              <h3 className="text-sm font-bold text-primary">Respond to Officer Clarification</h3>
              <button
                type="button"
                onClick={() => setRespondingDocket(null)}
                className="text-secondary hover:text-primary text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-secondary">
              Provide additional evidentiary particulars or clarifications requested by the triage desk for docket{' '}
              <strong className="text-primary font-mono">{respondingDocket.tracking_id}</strong>.
            </p>
            <form onSubmit={handleSendClarification} className="space-y-3">
              <textarea
                rows={4}
                required
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter clarification response..."
                className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRespondingDocket(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs text-secondary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondingLoading}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container"
                >
                  {respondingLoading ? 'Submitting...' : 'Send Clarification'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
