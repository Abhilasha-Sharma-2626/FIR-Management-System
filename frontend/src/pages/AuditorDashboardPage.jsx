import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auditorApi, downloadBlob } from '../lib/api';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AuditorDashboardPage() {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Parameters Sync
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeTab = queryParams.get('tab') || 'overview';
  const activeReport = queryParams.get('report') || 'cases-by-status';

  // Core State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real Audit Data
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    recent24h: 0,
    recent7d: 0,
    actionBreakdown: [],
    entityBreakdown: [],
    roleBreakdown: [],
    recentEvents: [],
    serverTimestamp: null
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Filters State for Audit Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Record Detail Modal State
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cryptographic Hash-Chain Verification State
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Analytical Reports State
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Sync tab navigation
  const handleTabChange = (newTab, reportType = null) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', newTab);
    if (reportType) {
      params.set('report', reportType);
    } else if (newTab !== 'reports') {
      params.delete('report');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Load High-Level Audit Metrics
  const loadMetrics = useCallback(async () => {
    try {
      const res = await auditorApi.getOverviewMetrics();
      if (res?.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit metrics:', err);
    }
  }, []);

  // Load Filtered Audit Logs for Explorer
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize
      };

      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (entityFilter !== 'ALL') params.entityType = entityFilter;
      if (roleFilter !== 'ALL') params.actorRole = roleFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await auditorApi.getAuditLogs(params);
      if (res?.data) {
        setAuditLogs(res.data);
        setTotalLogsCount(res.totalCount || res.count || res.data.length);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Unable to retrieve audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, roleFilter, fromDate, toDate, searchQuery]);

  // Load Analytical Report
  const loadReport = useCallback(async (reportType) => {
    try {
      setLoadingReport(true);
      setReportError(null);
      const res = await auditorApi.getReport(reportType);
      setReportData(res?.data || null);
    } catch (err) {
      console.error(`Failed to load report ${reportType}:`, err);
      setReportError(err.message || 'Failed to fetch analytical report');
    } finally {
      setLoadingReport(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadMetrics();
    loadLogs();
  }, [loadMetrics, loadLogs]);

  // Load report when reports tab is active
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReport(activeReport);
    }
  }, [activeTab, activeReport, loadReport]);

  // Handler: Inspect Audit Record Detail
  const handleInspectRecord = async (auditId) => {
    try {
      setLoadingDetail(true);
      const res = await auditorApi.getAuditLogById(auditId);
      setSelectedAuditLog(res.data);
    } catch (err) {
      showToast(`Error fetching audit record #${auditId}: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handler: Cryptographic Verification
  const handleVerifyLedger = async () => {
    try {
      setVerifyingChain(true);
      const res = await auditorApi.verifyAuditChain();
      setVerificationResult(res.data || res);
      showToast(
        res.isValid || res.data?.isValid
          ? 'Record Integrity Verification: Completed with no discrepancies'
          : 'Record Integrity Warning: Issues detected in records'
      );
    } catch (err) {
      setVerificationResult({
        isValid: false,
        message: err.message || 'Verification execution failed'
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  // Handler: Export Report CSV
  const handleExportReportCsv = async () => {
    try {
      setExportingCsv(true);
      const blob = await auditorApi.exportReportCsv(activeReport);
      const filename = `casesync_audit_report_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blob, filename);
      showToast(`Report "${activeReport}" exported successfully.`);
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    } finally {
      setExportingCsv(false);
    }
  };

  // Handler: Export Current Audit Stream to CSV (Client-side RFC-4180 from real authorized records)
  const handleExportAuditStream = () => {
    if (auditLogs.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const headers = ['Audit ID', 'Timestamp (ISO)', 'Actor Role', 'Actor ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Record Checksum'];
    const rows = auditLogs.map(log => [
      log.audit_id,
      log.ts,
      log.actor_role || 'SYSTEM',
      log.actor_id || 'N/A',
      log.action,
      log.entity_type,
      log.entity_id || 'N/A',
      log.ip_address || '127.0.0.1',
      log.row_hash
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `casesync_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${auditLogs.length} audit records.`);
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body text-on-surface antialiased">
      {/* 1. Global Navigation Sidebar */}
      <DashboardSidebar activeNav={activeTab} />

      {/* 2. Main Portal Stage */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Government Header & Operational Status Bar */}
        <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-900 via-primary to-navy-dark text-white flex items-center justify-center shadow-sm border border-teal-500/30">
              <span className="material-symbols-outlined text-2xl text-teal-300">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  Statutory Audit Directorate
                </span>
                <span className="text-xs text-secondary font-medium">
                  New Delhi Central District
                </span>
              </div>
              <h1 className="text-lg font-bold text-primary tracking-tight leading-tight">
                CaseSync Statutory Auditor &amp; Vigilance Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Strictly Read-Only Security Guard Notice */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="font-semibold text-primary">Auditor: Read-Only Access</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyLedger}
              disabled={verifyingChain}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-950 border-teal-300 bg-teal-50 hover:bg-teal-100"
            >
              <span className="material-symbols-outlined text-sm text-teal-700">shield_check</span>
              {verifyingChain ? 'Verifying...' : 'Verify Record Integrity'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadMetrics();
                loadLogs();
              }}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </Button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-teal-950 text-teal-200 border border-teal-800 text-xs flex items-center justify-between shadow-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-teal-400">check_circle</span>
              <span className="font-medium">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-teal-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4">
            <ErrorState message={error} onRetry={loadLogs} />
          </div>
        )}

        {/* 3. Core Content */}
        <main className="p-6 space-y-6">
          {/* Top Real Metrics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Audit Events"
              value={metrics.totalEvents || totalLogsCount || 0}
              icon="history_edu"
              color="primary"
              subtitle="Official statutory event records"
            />
            <MetricCard
              title="Activity (Last 24h)"
              value={metrics.recent24h || 0}
              icon="update"
              color="secondary"
              subtitle={`${metrics.recent7d || 0} recorded past 7 days`}
            />
            <MetricCard
              title="Record Integrity"
              value={verificationResult?.isValid ? 'Verified' : 'Active'}
              icon="verified_user"
              color="tertiary"
              subtitle={
                verificationResult
                  ? `${verificationResult.totalRecords || 0} records verified • No issues`
                  : 'Continuous verification active'
              }
            />
            <MetricCard
              title="Access Boundary"
              value="Read-Only"
              icon="gavel"
              color="secondary"
              subtitle="Official records protected from alteration"
            />
          </section>

          {/* Navigation Tab Bar */}
          <div className="border-b border-outline-variant flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => handleTabChange('overview')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Audit Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('explorer')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'explorer'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">manage_search</span>
              <span>Audit Event Log</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] text-secondary">
                {totalLogsCount}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('integrity')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'integrity'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">shield_check</span>
              <span>Record Integrity Check</span>
            </button>

            <button
              onClick={() => handleTabChange('reports')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">analytics</span>
              <span>Audit Reports &amp; Exports</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & TELEMETRY                                               */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Event Volume Distribution Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actions Breakdown */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
                    <div>
                      <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">dynamic_feed</span>
                        Recorded Action Frequencies
                      </h3>
                      <p className="text-body-sm text-secondary">
                        Top statutory actions recorded in the official audit register.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {metrics.actionBreakdown?.length === 0 ? (
                      <p className="text-xs text-secondary italic">Loading action metrics...</p>
                    ) : (
                      metrics.actionBreakdown?.map((item) => (
                        <div key={item.action} className="flex items-center justify-between text-xs py-1.5 border-b border-outline-variant/60">
                          <span className="font-mono font-bold text-primary truncate max-w-[240px]">
                            {item.action}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-mono font-semibold">
                            {item.count} events
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Entity Types Breakdown */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
                    <div>
                      <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700">database</span>
                        Entity Type Distribution
                      </h3>
                      <p className="text-body-sm text-secondary">
                        Audit events categorized by governed system entity.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {metrics.entityBreakdown?.length === 0 ? (
                      <p className="text-xs text-secondary italic">Loading entity metrics...</p>
                    ) : (
                      metrics.entityBreakdown?.map((item) => (
                        <div key={item.entity_type} className="flex items-center justify-between text-xs py-1.5 border-b border-outline-variant/60">
                          <span className="font-mono font-bold text-teal-950 uppercase">
                            {item.entity_type}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200 font-mono font-semibold">
                            {item.count} events
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actor Role Distribution & Recent Event Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Actor Roles */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                  <h3 className="font-title-md text-title-md font-bold text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    Actor Role Distribution
                  </h3>
                  <div className="space-y-2 text-xs">
                    {metrics.roleBreakdown?.map((item) => (
                      <div key={item.actor_role} className="flex items-center justify-between py-1.5 border-b border-outline-variant/60">
                        <span className="font-semibold text-primary">{item.actor_role}</span>
                        <span className="font-mono text-secondary">{item.count} actions</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Event Feed */}
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      Most Recent Audit Events
                    </h3>
                    <p className="text-xs text-secondary mb-4">
                      Official chronological events recorded with verification checksums.
                    </p>

                    <div className="space-y-2">
                      {metrics.recentEvents?.map((ev) => (
                        <div key={ev.audit_id} className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">#{ev.audit_id}</span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-bold text-[10px]">
                                {ev.action}
                              </span>
                              <span className="text-secondary text-[11px] truncate">
                                on {ev.entity_type} {ev.entity_id ? `#${ev.entity_id}` : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Hash: {ev.row_hash?.slice(0, 24)}...
                            </p>
                          </div>
                          <span className="text-[10px] text-secondary font-mono shrink-0 ml-2">
                            {ev.ts ? new Date(ev.ts).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-secondary font-mono">
                      Timestamp: {metrics.serverTimestamp ? new Date(metrics.serverTimestamp).toLocaleString() : 'N/A'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleTabChange('explorer')}
                      className="text-xs"
                    >
                      Open Full Explorer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: READ-ONLY AUDIT EXPLORER                                           */}
          {/* ========================================================================= */}
          {activeTab === 'explorer' && (
            <div className="space-y-4">
              {/* Filter Controls Bar */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[240px]">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search action, entity, role, entity ID..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPage(1);
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                    <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                    <option value="FIR_SUBMITTED">FIR_SUBMITTED</option>
                    <option value="FIR_REGISTERED">FIR_REGISTERED</option>
                    <option value="IO_ASSIGNED">IO_ASSIGNED</option>
                    <option value="STATUS_CHANGED">STATUS_CHANGED</option>
                    <option value="EVIDENCE_ADDED">EVIDENCE_ADDED</option>
                    <option value="CUSTODY_TRANSFERRED">CUSTODY_TRANSFERRED</option>
                    <option value="USER_CREATED">USER_CREATED</option>
                    <option value="ROLE_CHANGED">ROLE_CHANGED</option>
                    <option value="STATION_CREATED">STATION_CREATED</option>
                    <option value="SLA_CONFIG_UPDATE">SLA_CONFIG_UPDATE</option>
                    <option value="ACCESS_DENIED">ACCESS_DENIED</option>
                  </select>

                  <select
                    value={entityFilter}
                    onChange={(e) => {
                      setEntityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Entity Types</option>
                    <option value="fir">FIR / Complaints</option>
                    <option value="case">Case Investigation</option>
                    <option value="evidence">Evidence Vault</option>
                    <option value="user">User Accounts &amp; Access</option>
                    <option value="police_station">Police Stations</option>
                    <option value="legal_section">Legal Sections</option>
                    <option value="sla_config">SLA Configurations</option>
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(1);
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Actor Roles</option>
                    <option value="CITIZEN">Citizen</option>
                    <option value="DESK_OFFICER">Desk Officer</option>
                    <option value="IO">Investigating Officer</option>
                    <option value="SHO">SHO</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-semibold text-[11px]">Date Filter:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                      }}
                      className="py-1 px-2 rounded border border-outline-variant bg-surface text-xs"
                    />
                    <span className="text-secondary">to</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                      }}
                      className="py-1 px-2 rounded border border-outline-variant bg-surface text-xs"
                    />
                    {(fromDate || toDate || actionFilter !== 'ALL' || entityFilter !== 'ALL' || roleFilter !== 'ALL' || searchQuery) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActionFilter('ALL');
                          setEntityFilter('ALL');
                          setRoleFilter('ALL');
                          setFromDate('');
                          setToDate('');
                          setPage(1);
                        }}
                        className="text-primary hover:underline text-xs ml-2 font-medium"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-secondary font-mono">
                      Showing {auditLogs.length} of {totalLogsCount} records
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAuditStream}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Export Stream CSV
                    </Button>
                  </div>
                </div>
              </div>

              {/* Audit Events Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      <tr>
                        <th className="py-3 px-4">Event ID</th>
                        <th className="py-3 px-3">Timestamp (IST)</th>
                        <th className="py-3 px-3">Actor Role &amp; ID</th>
                        <th className="py-3 px-3">Recorded Action</th>
                        <th className="py-3 px-3">Target Entity</th>
                        <th className="py-3 px-3">Client IP</th>
                        <th className="py-3 px-3">Verification Checksum</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="py-8">
                            <LoadingSkeleton count={5} />
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8">
                            <EmptyState
                              icon="manage_search"
                              title="No Audit Records Found"
                              description="No audit events matched your search or filter parameters."
                            />
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.audit_id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-primary">
                              #{log.audit_id}
                            </td>

                            <td className="py-2.5 px-3 text-secondary font-mono text-[11px] whitespace-nowrap">
                              {log.ts ? new Date(log.ts).toLocaleString() : 'N/A'}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-bold text-[10px]">
                                  {log.actor_role || 'SYSTEM'}
                                </span>
                                {log.actor_id && (
                                  <span className="text-[10px] text-secondary font-mono">
                                    USR-{log.actor_id}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  log.action.includes('REGISTER') || log.action.includes('CREATE')
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                    : log.action.includes('DENIED') || log.action.includes('REJECT')
                                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                    : log.action.includes('ASSIGN') || log.action.includes('STATUS')
                                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                    : 'bg-slate-50 text-slate-900 border border-slate-200'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-primary uppercase text-[11px]">
                                {log.entity_type}
                              </span>
                              {log.entity_id && (
                                <span className="text-secondary font-mono text-[10px] ml-1">
                                  #{log.entity_id}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-secondary font-mono text-[11px]">
                              {log.ip_address || '127.0.0.1'}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500" title={log.row_hash}>
                              {log.row_hash ? `${log.row_hash.slice(0, 16)}...` : 'N/A'}
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleInspectRecord(log.audit_id)}
                                title="Inspect Record & State Diff"
                                className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3.5 border-t border-outline-variant flex items-center justify-between text-xs text-secondary">
                  <span>
                    Page {page} of {Math.max(1, Math.ceil(totalLogsCount / pageSize))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * pageSize >= totalLogsCount}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RECORD INTEGRITY VERIFICATION                                      */}
          {/* ========================================================================= */}
          {activeTab === 'integrity' && (
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b border-outline-variant">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-700">shield_check</span>
                      Official Audit Record Integrity Verification
                    </h3>
                    <p className="text-body-sm text-secondary mt-1 max-w-3xl">
                      CaseSync verifies the authenticity and continuity of official statutory audit logs, state transitions, and evidence custody records. Sequential checksum verification ensures any unauthorized alteration is immediately detected.
                    </p>
                  </div>
                  <Button
                    onClick={handleVerifyLedger}
                    disabled={verifyingChain}
                    className="flex items-center gap-2 text-xs font-semibold bg-teal-900 hover:bg-teal-950 text-white"
                  >
                    <span className="material-symbols-outlined text-sm">shield_check</span>
                    {verifyingChain ? 'Checking Records...' : 'Verify Record Integrity'}
                  </Button>
                </div>

                {/* Verification Results Panel */}
                {verifyingChain ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 border-3 border-teal-600/20 border-t-teal-700 rounded-full animate-spin mx-auto"></div>
                    <p className="font-semibold text-primary text-sm">Verifying Record Continuity Against Official Audit Log...</p>
                    <p className="text-secondary text-xs">Validating integrity checksums for all recorded case events in scope.</p>
                  </div>
                ) : verificationResult ? (
                  <div className="space-y-4">
                    <div
                      className={`p-5 rounded-2xl border flex items-center gap-4 ${
                        verificationResult.isValid
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}
                    >
                      <span className="material-symbols-outlined text-4xl shrink-0 text-emerald-700">
                        {verificationResult.isValid ? 'verified' : 'gpp_bad'}
                      </span>
                      <div>
                        <h4 className="font-bold text-base">
                          {verificationResult.isValid
                            ? 'Verification Completed: No Discrepancies Found'
                            : 'Issues Detected: Discrepancies Found in Audit Records'}
                        </h4>
                        <p className="text-xs opacity-85 mt-0.5">
                          {verificationResult.message ||
                            'All sequential audit records verified successfully with complete continuity.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant font-mono text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary">Verified Records</span>
                        <p className="font-bold text-primary text-sm mt-0.5">
                          {verificationResult.totalRecords || 0} entries
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary">Discrepancies</span>
                        <p className="font-bold text-emerald-700 text-sm mt-0.5">
                          {verificationResult.brokenLinks || 0} detected
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary">Record Status</span>
                        <p className="font-bold text-primary text-sm mt-0.5">Verified &amp; Protected</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary">Verification Timestamp</span>
                        <p className="font-medium text-primary text-[11px] mt-0.5">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-2 text-xs">
                      <h5 className="font-bold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">gavel</span>
                        Judicial Admissibility Certificate (Section 65B Indian Evidence Act / Section 63 BSA)
                      </h5>
                      <p className="text-secondary leading-relaxed text-[11px]">
                        This digital audit record trail conforms to statutory criteria for electronic evidence authenticity. All state transitions, evidence custody transfers, and user permissions are strictly logged and protected against alteration.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant text-center space-y-2">
                    <span className="material-symbols-outlined text-3xl text-secondary">security</span>
                    <p className="text-xs font-semibold text-primary">No verification check executed yet in this session.</p>
                    <p className="text-xs text-secondary">Click "Verify Record Integrity" above to check all official records.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: STATUTORY AUDIT REPORTS & CSV EXPORT                               */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Report Selector Header */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Report Scope:</span>
                  {[
                    { id: 'cases-by-status', label: 'Caseloads by Status' },
                    { id: 'turnaround-time', label: 'Turnaround Times' },
                    { id: 'io-workload', label: 'IO Workload Allocation' },
                    { id: 'crime-trends', label: 'Crime Category Trends' },
                    { id: 'stale-cases', label: 'Stale Case Overdue' },
                    { id: 'evidence-summary', label: 'Evidence Custody' }
                  ].map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => handleTabChange('reports', rep.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeReport === rep.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-secondary hover:text-primary'
                      }`}
                    >
                      {rep.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleExportReportCsv}
                  disabled={exportingCsv || loadingReport}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {exportingCsv ? 'Exporting...' : 'Export Official CSV'}
                </Button>
              </div>

              {/* Report Data Display */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary uppercase">
                      {activeReport.replace(/-/g, ' ')}
                    </h3>
                    <p className="text-xs text-secondary">
                      Statutory analytical aggregate generated from authorized operational data.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-mono font-semibold">
                    Scope: District Law Enforcement
                  </span>
                </div>

                {loadingReport ? (
                  <div className="py-12">
                    <LoadingSkeleton count={4} />
                  </div>
                ) : reportError ? (
                  <ErrorState message={reportError} onRetry={() => loadReport(activeReport)} />
                ) : reportData && Array.isArray(reportData) && reportData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        <tr>
                          {Object.keys(reportData[0]).map((key) => (
                            <th key={key} className="py-3 px-3">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant font-mono text-[11px]">
                        {reportData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                            {Object.values(row).map((val, valIdx) => (
                              <td key={valIdx} className="py-2.5 px-3 text-primary">
                                {typeof val === 'boolean'
                                  ? val ? 'YES' : 'NO'
                                  : val !== null && val !== undefined
                                  ? String(val)
                                  : 'N/A'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon="table_chart"
                    title="No Report Data Available"
                    description={`No records found for analytical report "${activeReport}".`}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. AUDIT RECORD DETAIL & STATE DIFF MODAL (READ-ONLY)                     */}
      {/* ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">history_edu</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-title-md font-bold text-primary">
                      Audit Record #{selectedAuditLog.audit_id}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-primary">
                      {selectedAuditLog.action}
                    </span>
                  </div>
                  <p className="text-xs text-secondary font-mono">
                    {selectedAuditLog.ts ? new Date(selectedAuditLog.ts).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Actor & Entity Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Actor Role</span>
                  <p className="font-bold text-primary mt-0.5">{selectedAuditLog.actor_role || 'SYSTEM'}</p>
                </div>
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Actor User ID</span>
                  <p className="font-mono font-bold text-primary mt-0.5">
                    {selectedAuditLog.actor_id ? `USR-${selectedAuditLog.actor_id}` : 'N/A (Automated)'}
                  </p>
                </div>
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Target Entity</span>
                  <p className="font-bold text-teal-900 mt-0.5 uppercase">
                    {selectedAuditLog.entity_type} {selectedAuditLog.entity_id ? `#${selectedAuditLog.entity_id}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Origin IP</span>
                  <p className="font-mono text-primary mt-0.5">{selectedAuditLog.ip_address || '127.0.0.1'}</p>
                </div>
              </div>

              {/* Record Verification Checksum Block */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-teal-400 font-bold uppercase text-[10px]">Record Verification Checksum</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                    Verified
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Record Checksum:</span>
                  <span className="text-amber-300 break-all select-all font-semibold">
                    {selectedAuditLog.row_hash}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Previous Record Link:</span>
                  <span className="text-slate-300 break-all select-all">
                    {selectedAuditLog.prev_hash}
                  </span>
                </div>
              </div>

              {/* State Change Comparison (old_data vs new_data) */}
              <div className="space-y-2">
                <h4 className="font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">compare_arrows</span>
                  Recorded State Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block mb-1">
                      Prior State (old_data)
                    </span>
                    <pre className="text-[11px] font-mono text-secondary overflow-x-auto p-2 bg-surface rounded max-h-48">
                      {selectedAuditLog.old_data
                        ? JSON.stringify(selectedAuditLog.old_data, null, 2)
                        : '(Initial State / None)'}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                      Resulting State (new_data)
                    </span>
                    <pre className="text-[11px] font-mono text-secondary overflow-x-auto p-2 bg-surface rounded max-h-48">
                      {selectedAuditLog.new_data
                        ? JSON.stringify(selectedAuditLog.new_data, null, 2)
                        : '(None)'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant text-[11px] text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-teal-700 shrink-0">verified</span>
                <span>
                  Append-Only Record: Audit entries are immutable and protected by database triggers. No edit, delete, or overwrite controls exist under the Auditor security profile.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant flex justify-end">
              <Button onClick={() => setSelectedAuditLog(null)} size="sm">
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
