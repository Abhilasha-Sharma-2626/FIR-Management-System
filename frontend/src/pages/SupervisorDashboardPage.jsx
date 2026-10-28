import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supervisorApi, downloadBlob } from '../lib/api';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function SupervisorDashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Parameters Sync
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeTab = queryParams.get('tab') || 'overview';
  const activeReport = queryParams.get('report') || 'cases-by-status';

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Data
  const [metrics, setMetrics] = useState({});
  const [slaBreaches, setSlaBreaches] = useState({ summary: {}, thresholds: {}, breaches: {} });
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [cases, setCases] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stations, setStations] = useState([]);

  // Reports Data
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [escalationFilter, setEscalationFilter] = useState('ALL');

  // Modals & Active Selections
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [loadingCaseDetail, setLoadingCaseDetail] = useState(false);
  const [caseDetailTab, setCaseDetailTab] = useState('overview');

  // Appeal Review Modal
  const [appealToReview, setAppealToReview] = useState(null);
  const [appealDecision, setAppealDecision] = useState('ACCEPT');
  const [appealNotes, setAppealNotes] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealActionError, setAppealActionError] = useState('');

  // Reopen Case Modal
  const [caseToReopen, setCaseToReopen] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);
  const [reopenActionError, setReopenActionError] = useState('');

  // Cryptographic Audit Modal / Verification State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [auditVerifyResult, setAuditVerifyResult] = useState(null);

  // Success Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Set active tab in URL
  const handleTabChange = (newTab, reportType = null) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', newTab);
    if (reportType) {
      params.set('report', reportType);
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Fetch Core Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, breachesRes, slaRes, appealsRes, casesRes, transfersRes, stationsRes] =
        await Promise.allSettled([
          supervisorApi.getOverviewMetrics(selectedStation !== 'ALL' ? { stationId: selectedStation } : {}),
          supervisorApi.getSlaBreaches(),
          supervisorApi.getSlaConfigs(),
          supervisorApi.getPendingAppeals(),
          supervisorApi.getDistrictCases({
            limit: 100,
            stationId: selectedStation !== 'ALL' ? selectedStation : undefined
          }),
          supervisorApi.getIncomingTransfers(),
          supervisorApi.getStations()
        ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value || {});
      }
      if (breachesRes.status === 'fulfilled') {
        setSlaBreaches(breachesRes.value?.data || breachesRes.value || {});
      }
      if (slaRes.status === 'fulfilled') {
        setSlaConfigs(slaRes.value?.data || slaRes.value || []);
      }
      if (appealsRes.status === 'fulfilled') {
        setAppeals(appealsRes.value?.data || appealsRes.value || []);
      }
      if (casesRes.status === 'fulfilled') {
        setCases(casesRes.value?.data || casesRes.value?.cases || []);
      }
      if (transfersRes.status === 'fulfilled') {
        setTransfers(transfersRes.value?.data || transfersRes.value || []);
      }
      if (stationsRes.status === 'fulfilled') {
        setStations(stationsRes.value?.data || stationsRes.value || []);
      }
    } catch (err) {
      console.error('Error loading supervisor dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load supervisor command center data.');
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Fetch Reports Data when on reports tab
  const loadReportData = useCallback(async (reportType) => {
    try {
      setReportLoading(true);
      setReportError(null);
      const params = {};
      if (selectedStation !== 'ALL') {
        params.stationId = selectedStation;
      }
      const res = await supervisorApi.getReport(reportType, params);
      setReportData(res?.data || []);
    } catch (err) {
      console.error(`Error loading report ${reportType}:`, err);
      setReportError(err.response?.data?.message || 'Failed to generate oversight report.');
    } finally {
      setReportLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReportData(activeReport);
    }
  }, [activeTab, activeReport, loadReportData]);

  // Handle CSV Export
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const params = {};
      if (selectedStation !== 'ALL') {
        params.stationId = selectedStation;
      }
      const blobData = await supervisorApi.exportReportCsv(activeReport, params);
      const filename = `CaseSync_Report_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(blobData, filename);
      showToast(`Report '${activeReport}' exported successfully as CSV.`);
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Export failed. Please check network connectivity or try again.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Inspect Case Dossier
  const handleOpenCaseDetail = async (caseIdOrFirId) => {
    try {
      setSelectedCaseId(caseIdOrFirId);
      setLoadingCaseDetail(true);
      setCaseDetailTab('overview');
      const res = await supervisorApi.getCaseDetails(caseIdOrFirId);
      setSelectedCaseDetail(res?.data || res);
    } catch (err) {
      console.error('Failed to load case dossier:', err);
      showToast('Unable to load case dossier. Access denied or record missing.');
      setSelectedCaseId(null);
    } finally {
      setLoadingCaseDetail(false);
    }
  };

  // Submit Appeal Review
  const handleReviewAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealToReview) return;
    if (!appealNotes.trim() || appealNotes.trim().length < 10) {
      setAppealActionError('Supervisory decision notes must be at least 10 characters.');
      return;
    }

    try {
      setSubmittingAppeal(true);
      setAppealActionError('');
      await supervisorApi.reviewAppeal(
        appealToReview.fir_id,
        appealDecision,
        appealNotes.trim(),
        appealToReview.appeal_id
      );

      showToast(
        appealDecision === 'ACCEPT'
          ? `Appeal #${appealToReview.appeal_id} accepted. Complaint returned to active review.`
          : `Appeal #${appealToReview.appeal_id} reviewed and rejected.`
      );
      setAppealToReview(null);
      setAppealNotes('');
      loadDashboardData();
    } catch (err) {
      console.error('Appeal review error:', err);
      setAppealActionError(err.response?.data?.message || 'Failed to submit appeal decision.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Submit Reopen Case
  const handleReopenCaseSubmit = async (e) => {
    e.preventDefault();
    if (!caseToReopen) return;
    if (!reopenReason.trim() || reopenReason.trim().length < 10) {
      setReopenActionError('Reopening order and rationale must be at least 10 characters.');
      return;
    }

    try {
      setSubmittingReopen(true);
      setReopenActionError('');
      await supervisorApi.reopenCase(caseToReopen.fir_id || caseToReopen.case_id, reopenReason.trim());

      showToast(`Case ${caseToReopen.fir_number || '#' + caseToReopen.case_id} formally reopened under supervisory order.`);
      setCaseToReopen(null);
      setReopenReason('');
      if (selectedCaseId) {
        handleOpenCaseDetail(selectedCaseId);
      }
      loadDashboardData();
    } catch (err) {
      console.error('Reopen case error:', err);
      setReopenActionError(err.response?.data?.message || 'Failed to reopen case.');
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Run Cryptographic Hash Chain Audit
  const handleRunAuditVerify = async () => {
    try {
      setVerifyingAudit(true);
      setAuditVerifyResult(null);
      const res = await supervisorApi.verifyAuditChain();
      setAuditVerifyResult(res);
    } catch (err) {
      console.error('Audit chain verification failed:', err);
      setAuditVerifyResult({
        success: false,
        verified: false,
        message: err.response?.data?.message || err.message || 'Audit chain verification check failed.'
      });
    } finally {
      setVerifyingAudit(false);
    }
  };

  // Combined Escalation Items
  const escalationItems = useMemo(() => {
    const list = [];

    // 1. Complaint Review Breaches
    const complaintBreaches = slaBreaches?.breaches?.complaintReview || [];
    complaintBreaches.forEach((b) => {
      list.push({
        id: `complaint-${b.fir_id}`,
        type: 'COMPLAINT_REVIEW',
        typeLabel: 'Review SLA Breach',
        severity: parseFloat(b.hours_overdue) > 48 ? 'CRITICAL' : 'HIGH',
        firId: b.fir_id,
        trackingId: b.tracking_id,
        reference: b.tracking_id || `CMP-#${b.fir_id}`,
        status: b.status,
        stationName: b.station_name,
        stationCode: b.station_code,
        hoursElapsed: b.hours_elapsed,
        hoursOverdue: b.hours_overdue,
        timestamp: b.submitted_at,
        responsibleRole: 'Desk Officer / SHO',
        reasonText: `Initial complaint review pending for ${b.hours_elapsed}h (exceeded statutory 24h review SLA by ${b.hours_overdue}h)`
      });
    });

    // 2. IO Assignment Breaches
    const ioBreaches = slaBreaches?.breaches?.ioAssignment || [];
    ioBreaches.forEach((b) => {
      list.push({
        id: `io-${b.fir_id}`,
        type: 'IO_ASSIGNMENT',
        typeLabel: 'IO Assignment SLA Breach',
        severity: parseFloat(b.hours_overdue) > 48 ? 'CRITICAL' : 'HIGH',
        firId: b.fir_id,
        firNumber: b.fir_number,
        reference: b.fir_number || `FIR-#${b.fir_id}`,
        status: b.status,
        stationName: b.station_name,
        stationCode: b.station_code,
        hoursElapsed: b.hours_elapsed,
        hoursOverdue: b.hours_overdue,
        timestamp: b.registered_at,
        responsibleRole: 'SHO',
        reasonText: `FIR registered ${b.hours_elapsed}h ago without Investigating Officer assignment (exceeded 48h SLA by ${b.hours_overdue}h)`
      });
    });

    // 3. Stale Investigation Case Inactivity Breaches
    const staleBreaches = slaBreaches?.breaches?.staleCases || [];
    staleBreaches.forEach((b) => {
      list.push({
        id: `stale-${b.case_id}`,
        type: 'STALE_CASE',
        typeLabel: 'Investigation Inactivity Breach',
        severity: 'CRITICAL',
        caseId: b.case_id,
        firNumber: b.fir_number,
        reference: b.fir_number || `Case-#${b.case_id}`,
        status: b.status,
        stationCode: b.station_code,
        assignedIo: b.io_name,
        hoursElapsed: b.hours_inactive,
        hoursOverdue: b.hours_overdue,
        timestamp: b.last_update_at,
        responsibleRole: 'Investigating Officer / SHO',
        reasonText: `Active investigation inactive for ${Math.round(parseFloat(b.hours_inactive) / 24)} days (${b.hours_inactive}h) without recorded case diary update (exceeded 15-day SLA by ${b.hours_overdue}h)`
      });
    });

    // 4. Statutory Appeals
    appeals.forEach((a) => {
      list.push({
        id: `appeal-${a.appeal_id}`,
        type: 'APPEAL',
        typeLabel: 'BNSS § 173(4) Rejection Appeal',
        severity: 'ELEVATED',
        firId: a.fir_id,
        appealId: a.appeal_id,
        trackingId: a.tracking_id,
        reference: a.tracking_id || `Appeal-#${a.appeal_id}`,
        status: 'PENDING_REVIEW',
        citizenName: a.citizen_name,
        stationName: a.station_name,
        timestamp: a.created_at,
        responsibleRole: 'District Supervisor',
        reasonText: `Citizen appeal filed under BNSS § 173(4) against complaint rejection: "${a.appeal_reason}"`
      });
    });

    return list;
  }, [slaBreaches, appeals]);

  // Filtered Escalation Queue
  const filteredEscalations = useMemo(() => {
    return escalationItems.filter((item) => {
      if (escalationFilter !== 'ALL' && item.type !== escalationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = item.reference?.toLowerCase().includes(q);
        const stationMatch = item.stationName?.toLowerCase().includes(q) || item.stationCode?.toLowerCase().includes(q);
        const reasonMatch = item.reasonText?.toLowerCase().includes(q);
        const citMatch = item.citizenName?.toLowerCase().includes(q);
        if (!refMatch && !stationMatch && !reasonMatch && !citMatch) return false;
      }
      return true;
    });
  }, [escalationItems, escalationFilter, searchQuery]);

  // Filtered District Cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ACTIVE' && !['ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL', 'REOPENED'].includes(c.status)) return false;
        if (selectedStatus === 'CONCLUDED' && !['CHARGESHEET_FILED', 'CLOSED'].includes(c.status)) return false;
        if (selectedStatus !== 'ACTIVE' && selectedStatus !== 'CONCLUDED' && c.status !== selectedStatus) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = c.fir_number?.toLowerCase().includes(q);
        const trackMatch = c.tracking_id?.toLowerCase().includes(q);
        const citMatch = c.complainant_name?.toLowerCase().includes(q);
        const catMatch = c.category_name?.toLowerCase().includes(q);
        const ioMatch = c.current_io_name?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        if (!numMatch && !trackMatch && !citMatch && !catMatch && !ioMatch && !descMatch) return false;
      }
      return true;
    });
  }, [cases, selectedStatus, searchQuery]);

  // Overdue Breaches (combined from SLA monitoring)
  const overdueBreachesList = useMemo(() => {
    return escalationItems.filter((item) => item.type !== 'APPEAL');
  }, [escalationItems]);

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Shared Dashboard Sidebar configured for SUPERVISOR */}
      <DashboardSidebar activeNav={activeTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950">
        
        {/* Sticky Supervisory Command Header */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                  District Police Headquarters • Supervisory Command
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono font-bold">
                  SP-DIST-001
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>Supervisory Oversight &amp; Appellate Command</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Senior Police Oversight (DSP/SP) across Central Division • Escalations, Appeals &amp; Statutory Compliance
              </p>
            </div>

            {/* Quick Action Badges & Session Info */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAuditModalOpen(true);
                  handleRunAuditVerify();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-700/60 hover:bg-purple-900/40 text-purple-200 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <span className="material-symbols-outlined text-sm text-purple-400">verified</span>
                <span>Verify Record Integrity</span>
              </button>

              <button
                type="button"
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/60 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* District Station Scope Selector */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/60 flex-wrap">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-purple-400">domain</span>
              <span>Station Jurisdiction Scope:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedStation('ALL')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedStation === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                All District Stations
              </button>
              {stations.map((st) => (
                <button
                  key={st.station_id}
                  type="button"
                  onClick={() => setSelectedStation(st.station_id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedStation === st.station_id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {st.name} ({st.code})
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-purple-950 border border-purple-500/80 text-purple-100 shadow-2xl flex items-center gap-3 animate-slide-up">
            <span className="material-symbols-outlined text-purple-400 text-xl">check_circle</span>
            <p className="text-xs font-semibold flex-1">{toastMessage}</p>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-purple-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Dashboard Main Container */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {error && (
            <ErrorState
              title="Supervisory Command Sync Error"
              message={error}
              onRetry={loadDashboardData}
            />
          )}

          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="District Active Caseload"
              value={metrics.total_active_cases ?? cases.length}
              icon="local_police"
              trend={selectedStation === 'ALL' ? 'District-wide' : 'Station Scoped'}
              trendType="neutral"
            />
            <MetricCard
              label="Open SLA Escalations"
              value={slaBreaches?.summary?.totalBreaches ?? escalationItems.length}
              icon="crisis_alert"
              trend={`${slaBreaches?.summary?.complaintReviewBreaches || 0} Review • ${slaBreaches?.summary?.ioAssignmentBreaches || 0} IO`}
              trendType={slaBreaches?.summary?.totalBreaches > 0 ? 'down' : 'up'}
            />
            <MetricCard
              label="Overdue Cases Monitor"
              value={overdueBreachesList.length}
              icon="alarm_on"
              trend={`${slaBreaches?.summary?.staleCaseBreaches || 0} Inactive Dockets`}
              trendType={overdueBreachesList.length > 0 ? 'down' : 'up'}
            />
            <MetricCard
              label="Pending Statutory Appeals"
              value={appeals.length}
              icon="balance"
              trend="BNSS § 173(4)"
              trendType={appeals.length > 0 ? 'neutral' : 'up'}
            />
            <MetricCard
              label="Active Investigations"
              value={metrics.under_investigation ?? 0}
              icon="biotech"
              trend={`${metrics.pending_approval || 0} Ready for Report`}
              trendType="neutral"
            />
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Overview &amp; Intelligence</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('escalations')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'escalations'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-amber-400">crisis_alert</span>
              <span>Escalation Queue</span>
              {escalationItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                  {escalationItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('overdue')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'overdue'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-rose-400">alarm_on</span>
              <span>Overdue Cases</span>
              {overdueBreachesList.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                  {overdueBreachesList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('appeals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'appeals'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-cyan-400">balance</span>
              <span>Statutory Appeals</span>
              {appeals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {appeals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('cases')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'cases'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-blue-400">folder_managed</span>
              <span>District Dockets</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                {cases.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('transfers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'transfers'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-amber-400">swap_horiz</span>
              <span>Inter-Station Transfers</span>
              {transfers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                  {transfers.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('reports')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className="material-symbols-outlined text-base text-indigo-400">analytics</span>
              <span>Oversight Reports</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & INTELLIGENCE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Alert Banner for Pending Escalations / Appeals */}
              {(escalationItems.length > 0 || appeals.length > 0) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-600/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-2xl text-amber-400 shrink-0">
                      warning
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Supervisory Attention Required: {escalationItems.length} Open Escalations
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {slaBreaches.summary?.complaintReviewBreaches || 0} complaints past review window,{' '}
                        {slaBreaches.summary?.ioAssignmentBreaches || 0} registered FIRs pending IO assignment, and{' '}
                        {appeals.length} statutory citizen appeals pending review.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTabChange('escalations')}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    >
                      Process Escalations
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTabChange('appeals')}
                    >
                      Review Appeals ({appeals.length})
                    </Button>
                  </div>
                </div>
              )}

              {/* Statutory SLA Thresholds Reference Cards */}
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-purple-400">timer</span>
                  <span>Statutory SLA Configurations &amp; Escalation Path</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {slaConfigs.map((cfg) => (
                    <div
                      key={cfg.config_key}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {cfg.config_key}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            Escalate: {cfg.escalation_role}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{cfg.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {cfg.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Threshold:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {cfg.threshold_hours} Hours ({Math.round(cfg.threshold_hours / 24)} Days)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* District Case Distribution & Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Appeals Spotlight */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400">balance</span>
                        <span>Statutory Appeals Queue</span>
                      </h4>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {appeals.length} Pending
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Citizen appeals filed against complaint rejections under BNSS § 173(4). Supervisors have appellate jurisdiction to reinstate or uphold decisions.
                    </p>

                    {appeals.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                        No appeals pending supervisory decision.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {appeals.slice(0, 3).map((a) => (
                          <div
                            key={a.appeal_id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono font-bold text-cyan-300">
                                {a.tracking_id || `CMP-#${a.fir_id}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(a.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium truncate">
                              Complainant: {a.citizen_name} ({a.station_name})
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                              "{a.appeal_reason}"
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setAppealToReview(a);
                                  setAppealNotes('');
                                  setAppealActionError('');
                                }}
                                className="text-cyan-300 border-cyan-700/60 hover:bg-cyan-950"
                              >
                                Review Decision
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {appeals.length > 3 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleTabChange('appeals')}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        View All {appeals.length} Appeals →
                      </Button>
                    </div>
                  )}
                </div>

                {/* Overdue Cases SLA Monitor Spotlight */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-400">warning</span>
                        <span>Overdue Cases Monitor</span>
                      </h4>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        {overdueBreachesList.length} Breaches
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Cases genuinely exceeding statutory deadlines under live SLA engine. Automated alerts triggered for supervisory review.
                    </p>

                    {overdueBreachesList.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                        All cases currently within configured SLA thresholds.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {overdueBreachesList.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono font-bold text-amber-300">
                                {item.reference}
                              </span>
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                                +{item.hoursOverdue}h Overdue
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium truncate">
                              {item.typeLabel} • {item.stationName || item.stationCode}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {item.reasonText}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleOpenCaseDetail(item.firId || item.caseId)}
                              >
                                View Dossier
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {overdueBreachesList.length > 3 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleTabChange('overdue')}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        View All {overdueBreachesList.length} Overdue Cases →
                      </Button>
                    </div>
                  )}
                </div>

                {/* Record Integrity & Governance Box */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">shield_check</span>
                        <span>Record Integrity &amp; Compliance</span>
                      </h4>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Official case history and statutory activity records for all stations in the district.
                    </p>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Record Protection:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check</span>
                          Protected
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Jurisdiction Scope:</span>
                        <span className="text-purple-300 font-medium">District-Wide</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Data Privacy:</span>
                        <span className="text-slate-200">Enforced</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAuditModalOpen(true);
                        handleRunAuditVerify();
                      }}
                      className="w-full justify-center text-emerald-300 border-emerald-700/60 hover:bg-emerald-950"
                    >
                      <span className="material-symbols-outlined text-sm">shield_check</span>
                      <span>Verify Record Integrity</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESCALATION QUEUE */}
          {activeTab === 'escalations' && (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by FIR, tracking, station or ground..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                  <span className="text-xs text-slate-400 shrink-0">Filter Category:</span>
                  {[
                    { id: 'ALL', label: 'All Escalations' },
                    { id: 'COMPLAINT_REVIEW', label: 'Review Overdue' },
                    { id: 'IO_ASSIGNMENT', label: 'IO Assignment' },
                    { id: 'STALE_CASE', label: 'Inactivity Breaches' },
                    { id: 'APPEAL', label: 'Citizen Appeals' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEscalationFilter(f.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                        escalationFilter === f.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escalations Table */}
              {loading ? (
                <LoadingSkeleton lines={6} />
              ) : filteredEscalations.length === 0 ? (
                <EmptyState
                  title="No Escalation Alerts"
                  description="All complaint reviews, IO assignments, and investigation timelines across the district are currently compliant."
                  actionLabel="Refresh Monitoring"
                  onAction={loadDashboardData}
                />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-200">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Reference / Docket</th>
                          <th className="px-4 py-3">Escalation Category</th>
                          <th className="px-4 py-3">Police Station</th>
                          <th className="px-4 py-3">Time Overdue</th>
                          <th className="px-4 py-3">Responsible Authority</th>
                          <th className="px-4 py-3">Reason / Statutory Grounds</th>
                          <th className="px-4 py-3 text-right">Supervisory Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredEscalations.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                              {item.reference}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  item.type === 'COMPLAINT_REVIEW'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                    : item.type === 'IO_ASSIGNMENT'
                                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                    : item.type === 'STALE_CASE'
                                    ? 'bg-red-950 text-red-300 border-red-800'
                                    : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                }`}
                              >
                                {item.typeLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                              {item.stationName || item.stationCode || 'District Pool'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono">
                              {item.hoursOverdue ? (
                                <span className="text-rose-400 font-bold">
                                  +{item.hoursOverdue}h overdue
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300 font-medium">
                              {item.responsibleRole}
                            </td>
                            <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                              {item.reasonText}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {item.type === 'APPEAL' ? (
                                <Button
                                  size="xs"
                                  variant="primary"
                                  onClick={() => {
                                    setAppealToReview({
                                      appeal_id: item.appealId,
                                      fir_id: item.firId,
                                      tracking_id: item.trackingId,
                                      citizen_name: item.citizenName,
                                      station_name: item.stationName,
                                      appeal_reason: item.reasonText
                                    });
                                    setAppealNotes('');
                                    setAppealActionError('');
                                  }}
                                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                                >
                                  Review Appeal
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleOpenCaseDetail(item.firId || item.caseId)}
                                >
                                  Inspect Dossier
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OVERDUE CASES MONITOR */}
          {activeTab === 'overdue' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Live Statutory SLA Breach Monitor ({overdueBreachesList.length} Cases Overdue)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Records classified as overdue strictly according to database SLA thresholds configured in `sla_configs`.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={loadDashboardData}>
                  <span className="material-symbols-outlined text-sm">sync</span>
                  <span>Recalculate Breaches</span>
                </Button>
              </div>

              {overdueBreachesList.length === 0 ? (
                <EmptyState
                  title="No Overdue Cases Recorded"
                  description="All active complaints and investigations in the selected jurisdiction are within their statutory SLA deadlines."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overdueBreachesList.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-sm font-bold text-white">
                            {item.reference}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            +{item.hoursOverdue}h Overdue
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.typeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.stationName || item.stationCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {item.reasonText}
                        </p>
                        <div className="space-y-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                          <div className="flex justify-between">
                            <span>Elapsed Time:</span>
                            <span className="font-mono text-slate-200">{item.hoursElapsed} Hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Responsible:</span>
                            <span className="text-slate-200 font-medium">{item.responsibleRole}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleOpenCaseDetail(item.firId || item.caseId)}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                        >
                          View Full Dossier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATUTORY APPEALS */}
          {activeTab === 'appeals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Statutory Citizen Appeals under BNSS § 173(4)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Citizens whose complaints were rejected at the police station desk have statutory right to appeal directly to the Superintendent of Police.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {appeals.length} Appeals Pending
                </span>
              </div>

              {appeals.length === 0 ? (
                <EmptyState
                  title="No Pending Appeals"
                  description="There are currently no citizen appeals awaiting supervisory adjudication in the district queue."
                />
              ) : (
                <div className="space-y-3">
                  {appeals.map((a) => (
                    <div
                      key={a.appeal_id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-cyan-300">
                              {a.tracking_id || `CMP-#${a.fir_id}`}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                              Appeal #{a.appeal_id}
                            </span>
                            <span className="text-xs text-slate-400">
                              Filed on {new Date(a.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Complainant: <span className="font-bold text-white">{a.citizen_name}</span> • Police Station: <span className="font-medium text-slate-200">{a.station_name}</span>
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setAppealToReview(a);
                            setAppealNotes('');
                            setAppealActionError('');
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          <span>Adjudicate Appeal</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-rose-400 uppercase font-mono block mb-1">
                            Desk Officer / SHO Rejection Rationale:
                          </span>
                          <p className="text-slate-300 leading-relaxed italic">
                            {a.rejection_reason || 'No specific rejection reason recorded.'}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono block mb-1">
                            Citizen's Appeal Grounds (BNSS § 173(4)):
                          </span>
                          <p className="text-slate-200 leading-relaxed">
                            {a.appeal_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DISTRICT DOCKETS */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by FIR, Complainant, IO, Category..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                  <span className="text-xs text-slate-400 shrink-0">Status:</span>
                  {[
                    { id: 'ALL', label: 'All Cases' },
                    { id: 'ACTIVE', label: 'Active' },
                    { id: 'UNDER_INVESTIGATION', label: 'Investigation' },
                    { id: 'PENDING_APPROVAL', label: 'Pending SHO Review' },
                    { id: 'CHARGESHEET_FILED', label: 'Chargesheet' },
                    { id: 'CLOSED', label: 'Closed' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStatus(st.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                        selectedStatus === st.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* District Cases Table */}
              {loading ? (
                <LoadingSkeleton lines={6} />
              ) : filteredCases.length === 0 ? (
                <EmptyState
                  title="No Dockets Match Query"
                  description="No registered cases match your current filter parameters or station selection."
                />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-200">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">FIR Number / Tracking</th>
                          <th className="px-4 py-3">Station</th>
                          <th className="px-4 py-3">Crime Category</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Investigating Officer</th>
                          <th className="px-4 py-3">Incident Date</th>
                          <th className="px-4 py-3 text-right">Supervisory Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredCases.map((c) => (
                          <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono">
                              <p className="font-bold text-white">{c.fir_number || `Case #${c.case_id}`}</p>
                              <p className="text-[10px] text-slate-400">{c.tracking_id}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                              {c.station_name || 'Central PS'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                              {c.category_name || 'General Offence'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {c.current_io_name ? (
                                <div>
                                  <p className="font-medium text-slate-200">{c.current_io_name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{c.current_io_badge}</p>
                                </div>
                              ) : (
                                <span className="text-amber-400 italic text-[11px]">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono">
                              {new Date(c.incident_dt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                              {c.status === 'CLOSED' && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    setCaseToReopen(c);
                                    setReopenReason('');
                                    setReopenActionError('');
                                  }}
                                  className="text-emerald-300 border-emerald-700/60 hover:bg-emerald-950"
                                >
                                  Reopen Case
                                </Button>
                              )}
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleOpenCaseDetail(c.fir_id || c.case_id)}
                              >
                                View Dossier
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INTER-STATION TRANSFERS */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    District Inter-Station Transfers &amp; Zero FIR Pool
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supervisory visibility over jurisdiction transfers between police stations in the division.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800">
                  {transfers.length} Incoming Transfers
                </span>
              </div>

              {transfers.length === 0 ? (
                <EmptyState
                  title="No Pending Transfers"
                  description="There are currently no cross-station transfers awaiting processing."
                />
              ) : (
                <div className="space-y-3">
                  {transfers.map((t) => (
                    <div
                      key={t.transfer_id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-amber-300">
                            Transfer #{t.transfer_id}
                          </span>
                          <span className="text-xs font-mono text-white font-bold">
                            FIR #{t.fir_number || t.fir_id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="font-medium text-slate-400">From:</span>
                          <span className="font-bold text-white">{t.from_station_name}</span>
                          <span className="material-symbols-outlined text-sm text-purple-400">arrow_forward</span>
                          <span className="font-medium text-slate-400">To:</span>
                          <span className="font-bold text-white">{t.to_station_name}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 italic">
                          Reason: "{t.transfer_reason}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenCaseDetail(t.fir_id)}
                        >
                          Inspect Case File
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: OVERSIGHT REPORTS & ANALYTICS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Report Sub-Nav Switcher & Export */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
                  {[
                    { id: 'cases-by-status', label: 'Station Caseloads', icon: 'table_chart' },
                    { id: 'turnaround-time', label: 'Turnaround Times', icon: 'timelapse' },
                    { id: 'io-workload', label: 'IO Caseload Rankings', icon: 'leaderboard' },
                    { id: 'crime-trends', label: 'Crime Trends', icon: 'trending_up' },
                    { id: 'stale-cases', label: 'Stale Cases Monitor', icon: 'alarm_on' },
                    { id: 'evidence-summary', label: 'Evidence Summary', icon: 'lock_person' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleTabChange('reports', r.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                        activeReport === r.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={exportingCsv || reportLoading}
                    onClick={handleExportCsv}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
                  </Button>
                </div>
              </div>

              {/* Report Content Display */}
              {reportLoading ? (
                <LoadingSkeleton lines={8} />
              ) : reportError ? (
                <ErrorState title="Report Error" message={reportError} onRetry={() => loadReportData(activeReport)} />
              ) : !reportData || (Array.isArray(reportData) && reportData.length === 0) ? (
                <EmptyState title="No Data Found" description="No records available for the selected report filters." />
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                      Report: {activeReport.replace(/-/g, ' ')}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Generated at: {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Render based on report type */}
                  {activeReport === 'turnaround-time' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Avg Registration Time</span>
                        <p className="text-2xl font-black text-amber-300 font-mono">
                          {reportData.avg_days_to_register ?? 0} <span className="text-xs font-normal">Days</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Avg Investigation to Close</span>
                        <p className="text-2xl font-black text-purple-300 font-mono">
                          {reportData.avg_days_to_close ?? 0} <span className="text-xs font-normal">Days</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Total Lifecycle Duration</span>
                        <p className="text-2xl font-black text-cyan-300 font-mono">
                          {reportData.avg_total_lifecycle_days ?? 0} <span className="text-xs font-normal">Days</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Closed Cases Sample</span>
                        <p className="text-2xl font-black text-emerald-300 font-mono">
                          {reportData.sample_closed_cases ?? 0} <span className="text-xs font-normal">Dockets</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Generic Table View for other reports */}
                  {Array.isArray(reportData) && (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-200">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                          <tr>
                            {Object.keys(reportData[0] || {}).map((col) => (
                              <th key={col} className="px-4 py-3 capitalize">
                                {col.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {reportData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="px-4 py-2.5 font-mono">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL VIEW */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">shield_check</span>
                    <span>Audit Trail &amp; Record Integrity</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verification of the official activity logs across all district police stations.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={verifyingAudit}
                  onClick={handleRunAuditVerify}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  <span className={`material-symbols-outlined text-sm ${verifyingAudit ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{verifyingAudit ? 'Checking Records...' : 'Verify Record Integrity'}</span>
                </Button>
              </div>

              {auditVerifyResult && (
                <div
                  className={`p-6 rounded-2xl border ${
                    auditVerifyResult.verified
                      ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-600/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-2xl">
                      {auditVerifyResult.verified ? 'verified_user' : 'gpp_bad'}
                    </span>
                    <h4 className="text-base font-bold">
                      {auditVerifyResult.verified
                        ? 'Verification Completed: No Discrepancies Found'
                        : 'Verification Warning: Issues Detected in Records'}
                    </h4>
                  </div>
                  <p className="text-xs mb-4 leading-relaxed">
                    {auditVerifyResult.message}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Total Records Audited:</span>
                      <span className="font-bold text-white text-base">
                        {auditVerifyResult.totalRecords ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Record Status:</span>
                      <span className="font-bold text-emerald-400 text-base">Verified &amp; Protected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADJUDICATE STATUTORY APPEAL */}
      {appealToReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-cyan-400 text-xl">gavel</span>
                <h3 className="text-base font-bold text-white">
                  Supervisory Appeal Adjudication (BNSS § 173(4))
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAppealToReview(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleReviewAppealSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Complaint Tracking:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {appealToReview.tracking_id || `CMP-#${appealToReview.fir_id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Citizen Complainant:</span>
                  <span className="font-medium text-white">{appealToReview.citizen_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Police Station:</span>
                  <span className="text-slate-300">{appealToReview.station_name}</span>
                </div>
              </div>

              {/* Grounds display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono block mb-1">
                  Citizen Grounds under BNSS § 173(4):
                </span>
                <p className="text-slate-200 italic leading-relaxed">
                  "{appealToReview.appeal_reason}"
                </p>
              </div>

              {/* Decision Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Supervisory Decision:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppealDecision('ACCEPT')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      appealDecision === 'ACCEPT'
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Accept Appeal (Reopen to Review)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppealDecision('REJECT')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      appealDecision === 'REJECT'
                        ? 'bg-rose-950 text-rose-200 border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    <span>Reject Appeal (Uphold Order)</span>
                  </button>
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Supervisory Rationale &amp; Order Notes (Mandatory, min 10 chars):
                </label>
                <textarea
                  rows={3}
                  value={appealNotes}
                  onChange={(e) => setAppealNotes(e.target.value)}
                  placeholder="Record formal reasons under Section 173(4) Bharatiya Nagarik Suraksha Sanhita..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {appealActionError && (
                <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                  {appealActionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submittingAppeal}
                  onClick={() => setAppealToReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingAppeal}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {submittingAppeal ? 'Recording Decision...' : 'Confirm Adjudication Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REOPEN CLOSED CASE */}
      {caseToReopen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 text-xl">replay</span>
                <h3 className="text-base font-bold text-white">
                  Supervisory Order: Reopen Closed Case
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCaseToReopen(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleReopenCaseSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">FIR Number:</span>
                  <span className="font-mono font-bold text-white">
                    {caseToReopen.fir_number || `Case #${caseToReopen.case_id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <StatusBadge status={caseToReopen.status} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Legal Consequence:</span>
                </p>
                <p>
                  Reopening this case will atomically transition it from <strong>CLOSED</strong> to <strong>REOPENED</strong> and back to <strong>UNDER_INVESTIGATION</strong>, recording an immutable audit entry in the state machine history.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Supervisory Reopening Grounds (Mandatory, min 10 chars):
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Record formal reasons for reopening (e.g. fresh forensic evidence, witness emergence)..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {reopenActionError && (
                <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                  {reopenActionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submittingReopen}
                  onClick={() => setCaseToReopen(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingReopen}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {submittingReopen ? 'Issuing Reopen Order...' : 'Confirm Reopen Case'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL CASE DOSSIER WORKSPACE */}
      {selectedCaseId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-400 text-2xl">
                  folder_managed
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Supervisory Case Dossier</span>
                    {selectedCaseDetail && (
                      <span className="font-mono text-xs font-normal text-slate-400">
                        ({selectedCaseDetail.fir_number || `Case #${selectedCaseDetail.case_id}`})
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    District Oversight Inspection File • All actions, diary entries &amp; evidence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCaseId(null);
                  setSelectedCaseDetail(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {loadingCaseDetail ? (
              <div className="py-12">
                <LoadingSkeleton lines={8} />
              </div>
            ) : !selectedCaseDetail ? (
              <EmptyState title="Case Record Not Found" description="Could not load the requested case file." />
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Dossier Header Info */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Status:</span>
                    <StatusBadge status={selectedCaseDetail.status} />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Police Station:</span>
                    <span className="font-bold text-white">{selectedCaseDetail.station_name || 'Central PS'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Assigned IO:</span>
                    <span className="font-medium text-slate-200">
                      {selectedCaseDetail.current_io_name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Complainant:</span>
                    <span className="font-medium text-slate-200">{selectedCaseDetail.complainant_name}</span>
                  </div>
                </div>

                {/* Sub-Tabs for Dossier */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1 text-xs">
                  {[
                    { id: 'overview', label: 'Case Incident & Sections' },
                    { id: 'diary', label: `Investigation Diary (${selectedCaseDetail.updates?.length || 0})` },
                    { id: 'persons', label: `Persons Involved (${selectedCaseDetail.persons?.length || 0})` },
                    { id: 'evidence', label: `Evidence Exhibits (${selectedCaseDetail.evidence?.length || 0})` },
                    { id: 'assignments', label: `Assignment History (${selectedCaseDetail.assignments?.length || 0})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCaseDetailTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        caseDetailTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Dossier Tab Content */}
                {caseDetailTab === 'overview' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400 block mb-1">
                        Incident Description:
                      </span>
                      <p className="text-slate-200 leading-relaxed">{selectedCaseDetail.description}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400 block mb-2">
                        Legal Sections Invoked:
                      </span>
                      {selectedCaseDetail.sections?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCaseDetail.sections.map((sec) => (
                            <span
                              key={sec.section_id}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs font-semibold"
                            >
                              {sec.act} § {sec.section_no} — {sec.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No legal sections attached.</p>
                      )}
                    </div>
                  </div>
                )}

                {caseDetailTab === 'diary' && (
                  <div className="space-y-2 text-xs">
                    {selectedCaseDetail.updates?.length > 0 ? (
                      selectedCaseDetail.updates.map((u) => (
                        <div key={u.update_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-purple-300 font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                              {u.update_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(u.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">{u.body}</p>
                          <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Recorded By: {u.officer_name} ({u.badge_no})</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                {u.visible_to_citizen ? 'visibility' : 'lock'}
                              </span>
                              <span>{u.visible_to_citizen ? 'Visible to Citizen' : 'Internal Only'}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No Diary Entries" description="The investigating officer has not recorded updates on this case yet." />
                    )}
                  </div>
                )}

                {caseDetailTab === 'persons' && (
                  <div className="space-y-2 text-xs">
                    {selectedCaseDetail.persons?.length > 0 ? (
                      selectedCaseDetail.persons.map((p) => (
                        <div key={p.person_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{p.full_name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {p.person_role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">Contact: {p.contact || 'N/A'}</p>
                            <p className="text-[11px] text-slate-400">Address: {p.address || 'N/A'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No Persons Linked" description="No suspects, witnesses, or victims recorded." />
                    )}
                  </div>
                )}

                {caseDetailTab === 'evidence' && (
                  <div className="space-y-2 text-xs">
                    {selectedCaseDetail.evidence?.length > 0 ? (
                      selectedCaseDetail.evidence.map((e) => (
                        <div key={e.evidence_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300">{e.evidence_number}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {e.evidence_type}
                              </span>
                            </div>
                            <p className="text-slate-200 mt-1">{e.description}</p>
                            {e.file_sha256 && (
                              <p className="text-[10px] font-mono text-purple-300 mt-0.5">
                                Checksum: {e.file_sha256}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={e.status} />
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No Exhibits Seized" description="No evidence items registered on this docket." />
                    )}
                  </div>
                )}

                {caseDetailTab === 'assignments' && (
                  <div className="space-y-2 text-xs">
                    {selectedCaseDetail.assignments?.length > 0 ? (
                      selectedCaseDetail.assignments.map((a) => (
                        <div key={a.assignment_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{a.officer_name} ({a.badge_no})</p>
                            <p className="text-[11px] text-slate-400">Rank: {a.officer_rank} • Reason: {a.reason || 'Primary assignment'}</p>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(a.from_ts).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-center py-4">No historical assignment logs.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: AUDIT INTEGRITY VERIFICATION DIALOG */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 text-xl">shield_check</span>
                <h3 className="text-base font-bold text-white">
                  Audit Record Integrity Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                CaseSync verifies the authenticity and continuity of official case logs, officer assignments, and evidence handovers across district stations.
              </p>

              {verifyingAudit ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-purple-300">Verifying records against the district audit log...</p>
                </div>
              ) : auditVerifyResult ? (
                <div
                  className={`p-4 rounded-xl border ${
                    (auditVerifyResult.isValid ?? auditVerifyResult.verified)
                      ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    <span className="material-symbols-outlined text-lg">
                      {(auditVerifyResult.isValid ?? auditVerifyResult.verified) ? 'check_circle' : 'error'}
                    </span>
                    <span>
                      {(auditVerifyResult.isValid ?? auditVerifyResult.verified)
                        ? 'Verification Completed: No Discrepancies Found'
                        : 'Issues Detected in District Records'}
                    </span>
                  </div>
                  <p className="text-xs">{auditVerifyResult.message}</p>
                  {auditVerifyResult.totalRecords && (
                    <p className="text-[11px] font-mono mt-2 pt-2 border-t border-slate-800/80">
                      Records Validated: {auditVerifyResult.totalRecords} entries
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
