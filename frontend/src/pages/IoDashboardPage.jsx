import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { casesApi, evidenceApi } from '../lib/api';
import {
  MetricCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  MetricCardSkeleton,
  DocketCardSkeleton,
  Button
} from '../components/ui';

export function IoDashboardPage() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab & Filters
  const tabParam = searchParams.get('tab') || 'ALL';
  const caseIdParam = searchParams.get('caseId');
  const [activeTab, setActiveTab] = useState(tabParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [page, setPage] = useState(1);

  // Cases Queue & Metrics State
  const [casesList, setCasesList] = useState([]);
  const [metrics, setMetrics] = useState({
    total_active_cases: 0,
    pending_acceptance: 0,
    under_investigation: 0,
    pending_approval: 0,
    concluded_cases: 0,
    awaiting_updates: 0,
    recent_activity: 0,
    ready_for_report: 0,
    evidence_in_custody: 0
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loadingCases, setLoadingCases] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Workspace / Case Detail State
  const [selectedCaseId, setSelectedCaseId] = useState(caseIdParam || null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('overview');

  // Station Officers (for Custody Transfer recipient selection)
  const [stationOfficers, setStationOfficers] = useState([]);

  // Modals & Action States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingCase, setAcceptingCase] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    updateType: 'STATEMENT',
    body: '',
    visibleToCitizen: false
  });
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personForm, setPersonForm] = useState({
    personRole: 'ACCUSED',
    fullName: '',
    contact: '',
    address: '',
    notes: ''
  });
  const [submittingPerson, setSubmittingPerson] = useState(false);

  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: 'PHYSICAL',
    description: '',
    locationStored: 'Central Police Station Malkhana',
    collectedAt: new Date().toISOString().slice(0, 16),
    file: null
  });
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Evidence Chain & Transfer State
  const [selectedEvidenceForCustody, setSelectedEvidenceForCustody] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferConfirmStep, setTransferConfirmStep] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toHolderId: '',
    purpose: '',
    newStatus: 'IN_STORAGE',
    locationStored: '',
    remarks: ''
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Integrity Check State
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);

  // Final Report Submission State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfirmStep, setReportConfirmStep] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'CHARGESHEET',
    summary: '',
    acknowledged: false
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'ALL';
    setActiveTab(currentTab);
    const caseId = searchParams.get('caseId');
    if (caseId && caseId !== selectedCaseId) {
      setSelectedCaseId(caseId);
    }
  }, [searchParams]);

  // Load Station Officers on Mount
  useEffect(() => {
    async function loadOfficers() {
      try {
        const res = await casesApi.getStationOfficers();
        if (res.success && res.data) {
          setStationOfficers(res.data);
        }
      } catch (err) {
        console.error('Failed to load station officers:', err);
      }
    }
    loadOfficers();
  }, []);

  // Fetch Assigned Cases
  const fetchAssignedCases = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingCases(true);
      setFetchError(null);

      const params = {
        status: activeTab,
        search: searchQuery.trim() || undefined,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        page,
        limit: 20
      };

      const res = await casesApi.getAssignedCases(params);

      if (res.success) {
        setCasesList(res.data || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setFetchError(res.message || 'Failed to retrieve assigned cases.');
      }
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
      setFetchError(err.response?.data?.message || err.message || 'Unable to connect to investigation services.');
    } finally {
      setLoadingCases(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedPriority, page]);

  useEffect(() => {
    fetchAssignedCases();
  }, [fetchAssignedCases]);

  // Fetch Case Detail when selected
  const fetchCaseDetail = useCallback(async (caseOrFirId) => {
    if (!caseOrFirId) {
      setCaseDetail(null);
      return;
    }
    try {
      setLoadingDetail(true);
      setDetailError(null);
      const res = await casesApi.getCaseDetails(caseOrFirId);
      if (res.success && res.data) {
        setCaseDetail(res.data);
        // Pre-select first evidence item if available
        if (res.data.evidence && res.data.evidence.length > 0) {
          setSelectedEvidenceForCustody(res.data.evidence[0]);
        }
      } else {
        setDetailError(res.message || 'Unable to load case record.');
      }
    } catch (err) {
      console.error('Error fetching case detail:', err);
      setDetailError(err.response?.data?.message || err.message || 'Forbidden or case record unavailable.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetail(selectedCaseId);
    }
  }, [selectedCaseId, fetchCaseDetail]);

  // Handle Tab Switch
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    if (!selectedCaseId) {
      newParams.delete('caseId');
    }
    setSearchParams(newParams);
  };

  // Open Case Workspace
  const handleOpenWorkspace = (item, defaultWorkspaceTab = 'overview') => {
    const idToUse = item.fir_id || item.case_id;
    setSelectedCaseId(idToUse);
    setWorkspaceTab(defaultWorkspaceTab);
    setIntegrityResult(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('caseId', idToUse);
    setSearchParams(newParams);
  };

  // Close Case Workspace / Back to list
  const handleCloseWorkspace = () => {
    setSelectedCaseId(null);
    setCaseDetail(null);
    setDetailError(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('caseId');
    setSearchParams(newParams);
    fetchAssignedCases(true);
  };

  // ----------------------------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------------------------

  // 1. Accept Case Docket
  const handleAcceptCase = async () => {
    if (!caseDetail?.fir_id) return;
    try {
      setAcceptingCase(true);
      const res = await casesApi.acceptCase(caseDetail.fir_id);
      if (res.success) {
        showToast('success', 'Investigation docket accepted. Case is now under active investigation.');
        setShowAcceptModal(false);
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to accept investigation docket.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error accepting case.');
    } finally {
      setAcceptingCase(false);
    }
  };

  // 2. Add Progress Diary Update
  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!caseDetail?.fir_id) return;
    if (updateForm.body.trim().length < 10) {
      showToast('error', 'Update body must be at least 10 characters long.');
      return;
    }

    try {
      setSubmittingUpdate(true);
      const payload = {
        updateType: updateForm.updateType,
        body: updateForm.body.trim(),
        visibleToCitizen: Boolean(updateForm.visibleToCitizen)
      };

      const res = await casesApi.addUpdate(caseDetail.fir_id, payload);
      if (res.success) {
        showToast('success', 'Case diary entry logged successfully.');
        setShowUpdateModal(false);
        setUpdateForm({ updateType: 'STATEMENT', body: '', visibleToCitizen: false });
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to record diary update.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error adding progress update.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  // 3. Add Person Involved
  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!caseDetail?.fir_id) return;
    if (!personForm.fullName.trim()) {
      showToast('error', 'Full name is required.');
      return;
    }

    try {
      setSubmittingPerson(true);
      const payload = {
        personRole: personForm.personRole,
        fullName: personForm.fullName.trim(),
        contact: personForm.contact.trim() || null,
        address: personForm.address.trim() || null,
        notes: personForm.notes.trim() || null
      };

      const res = await casesApi.addPerson(caseDetail.fir_id, payload);
      if (res.success) {
        showToast('success', `${personForm.personRole} record successfully linked to case file.`);
        setShowPersonModal(false);
        setPersonForm({ personRole: 'ACCUSED', fullName: '', contact: '', address: '', notes: '' });
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to link person record.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error linking person.');
    } finally {
      setSubmittingPerson(false);
    }
  };

  // 4. Add Evidence Exhibit
  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!caseDetail?.case_id) return;
    if (evidenceForm.description.trim().length < 5) {
      showToast('error', 'Evidence description must be at least 5 characters long.');
      return;
    }

    try {
      setSubmittingEvidence(true);
      const formData = new FormData();
      formData.append('evidenceType', evidenceForm.evidenceType);
      formData.append('description', evidenceForm.description.trim());
      formData.append('locationStored', evidenceForm.locationStored.trim());
      if (evidenceForm.collectedAt) {
        formData.append('collectedAt', new Date(evidenceForm.collectedAt).toISOString());
      }
      if (evidenceForm.file) {
        formData.append('file', evidenceForm.file);
      }

      const res = await casesApi.addEvidence(caseDetail.case_id, formData);
      if (res.success) {
        showToast('success', `Evidence exhibit logged: ${res.data?.evidence_no || 'Registered with Chain of Custody'}`);
        setShowAddEvidenceModal(false);
        setEvidenceForm({
          evidenceType: 'PHYSICAL',
          description: '',
          locationStored: 'Central Police Station Malkhana',
          collectedAt: new Date().toISOString().slice(0, 16),
          file: null
        });
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to log evidence exhibit.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error uploading evidence.');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // 5. Transfer Evidence Custody
  const handleOpenTransferModal = (evidenceItem) => {
    setSelectedEvidenceForCustody(evidenceItem);
    setTransferForm({
      toHolderId: '',
      purpose: '',
      newStatus: 'IN_STORAGE',
      locationStored: evidenceItem.location_stored || 'Central Police Station Malkhana',
      remarks: ''
    });
    setTransferConfirmStep(false);
    setShowTransferModal(true);
  };

  const handleTransferCustody = async (e) => {
    e.preventDefault();
    if (!selectedEvidenceForCustody?.evidence_id) return;

    if (!transferConfirmStep) {
      if (!transferForm.toHolderId) {
        showToast('error', 'Please select a destination officer.');
        return;
      }
      if (!transferForm.purpose.trim() || transferForm.purpose.trim().length < 3) {
        showToast('error', 'Transfer purpose is required (minimum 3 characters).');
        return;
      }
      setTransferConfirmStep(true);
      return;
    }

    try {
      setSubmittingTransfer(true);
      const payload = {
        toHolderId: parseInt(transferForm.toHolderId, 10),
        purpose: transferForm.purpose.trim(),
        newStatus: transferForm.newStatus,
        locationStored: transferForm.locationStored.trim() || null,
        remarks: transferForm.remarks.trim() || null
      };

      const res = await evidenceApi.transferCustody(selectedEvidenceForCustody.evidence_id, payload);
      if (res.success) {
        showToast('success', `Evidence custody successfully transferred to designated officer.`);
        setShowTransferModal(false);
        setTransferConfirmStep(false);
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to transfer custody.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error processing custody transfer.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // 6. Verify Cryptographic Integrity
  const handleVerifyIntegrity = async (evidenceId) => {
    if (!evidenceId) return;
    try {
      setVerifyingIntegrity(true);
      setIntegrityResult(null);
      const res = await evidenceApi.verifyIntegrity(evidenceId);
      setIntegrityResult(res.data);
      if (res.data?.isValid) {
        showToast('success', 'File verification completed: Checksum matches the recorded evidence file.');
      } else {
        showToast('error', res.data?.message || 'File verification failed: Checksum discrepancy detected.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error verifying evidence integrity.');
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  // 7. Submit Final Investigation Report (Chargesheet / Closure)
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!caseDetail?.fir_id) return;

    if (!reportConfirmStep) {
      if (!reportForm.summary.trim() || reportForm.summary.trim().length < 15) {
        showToast('error', 'Final report summary must be at least 15 characters long.');
        return;
      }
      if (!reportForm.acknowledged) {
        showToast('error', 'You must certify the statutory declaration before submitting.');
        return;
      }
      setReportConfirmStep(true);
      return;
    }

    try {
      setSubmittingReport(true);
      const payload = {
        reportType: reportForm.reportType,
        summary: reportForm.summary.trim()
      };

      const res = await casesApi.submitReport(caseDetail.fir_id, payload);
      if (res.success) {
        showToast('success', `Final ${reportForm.reportType} report submitted to SHO for approval.`);
        setShowReportModal(false);
        setReportConfirmStep(false);
        setReportForm({ reportType: 'CHARGESHEET', summary: '', acknowledged: false });
        await fetchCaseDetail(caseDetail.fir_id);
        fetchAssignedCases(true);
      } else {
        showToast('error', res.message || 'Failed to submit final report.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Error submitting report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Helper: Copies text to clipboard
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('success', `${label} copied to clipboard.`);
  };

  return (
    <div className="flex h-screen bg-ivory text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar with active indicator */}
      <DashboardSidebar activeNav={activeTab === 'EVIDENCE' ? 'evidence' : 'cases'} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-navy-dark text-amber-400 flex items-center justify-center font-bold text-lg shadow-xs">
              <span className="material-symbols-outlined text-xl">policy</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-navy-dark tracking-tight leading-none">
                  Investigating Officer Portal
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  BNSS SEC 173(2) COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sub-Inspector Vikram Singh • Badge: <span className="font-mono font-semibold text-slate-700">IO-CPS-101</span> • Central Police Station
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCaseId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseWorkspace}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-navy-dark border-slate-300"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back to Assigned List</span>
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAssignedCases(true)}
              disabled={refreshing || loadingCases}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-navy-dark border-slate-300"
            >
              <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Records'}</span>
            </Button>
          </div>
        </header>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-emerald-900/10'
                  : 'bg-rose-50 text-rose-900 border-rose-300 shadow-rose-900/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {toast.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {selectedCaseId ? (
            /* ================================================================= */
            /* CASE DETAIL & INVESTIGATION WORKSPACE VIEW                        */
            /* ================================================================= */
            <div className="space-y-6">
              {loadingDetail ? (
                <div className="space-y-4">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <DocketCardSkeleton />
                  </div>
                </div>
              ) : detailError ? (
                <ErrorState
                  title="Unable to Access Case Record"
                  description={detailError}
                  actionLabel="Back to Assigned Cases"
                  onRetry={handleCloseWorkspace}
                />
              ) : caseDetail ? (
                <>
                  {/* Case Workspace Header Banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleCloseWorkspace}
                            className="text-xs font-semibold text-slate-500 hover:text-navy-dark flex items-center gap-1 mr-2"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            <span>Assigned Cases</span>
                          </button>
                          <span className="text-slate-300">/</span>
                          <span className="font-mono font-bold text-navy-dark text-base">
                            {caseDetail.fir_number || `DOCKET #${caseDetail.fir_id}`}
                          </span>
                          <button
                            onClick={() => copyToClipboard(caseDetail.fir_number, 'FIR Number')}
                            className="text-slate-400 hover:text-navy-dark transition-colors"
                            title="Copy FIR Number"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                          <StatusBadge status={caseDetail.status} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            caseDetail.priority === 1
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : caseDetail.priority === 2
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            PRIORITY {caseDetail.priority}
                          </span>
                        </div>

                        <h2 className="text-xl font-bold text-navy-dark tracking-tight">
                          {caseDetail.category_name || 'Police Case File'} — {caseDetail.station_name || 'Central Police Station'}
                        </h2>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <span>
                            Tracking ID: <span className="font-mono font-semibold text-slate-700">{caseDetail.tracking_id}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Complainant: <span className="font-semibold text-slate-700">{caseDetail.complainant_name}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Incident Date: <span className="font-semibold text-slate-700">{new Date(caseDetail.incident_dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>

                      {/* Header Workspace Actions */}
                      <div className="flex items-center gap-3">
                        {caseDetail.status === 'ASSIGNED' ? (
                          <Button
                            variant="primary"
                            onClick={() => setShowAcceptModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs flex items-center gap-2 text-xs py-2 px-4"
                          >
                            <span className="material-symbols-outlined text-base">task_alt</span>
                            <span>Accept Case Docket</span>
                          </Button>
                        ) : caseDetail.status === 'UNDER_INVESTIGATION' ? (
                          <Button
                            variant="primary"
                            onClick={() => {
                              setReportForm({ reportType: 'CHARGESHEET', summary: '', acknowledged: false });
                              setReportConfirmStep(false);
                              setShowReportModal(true);
                            }}
                            className="bg-navy-dark hover:bg-slate-800 text-white font-bold shadow-xs flex items-center gap-2 text-xs py-2 px-4"
                          >
                            <span className="material-symbols-outlined text-base text-amber-400">gavel</span>
                            <span>Submit Final Report</span>
                          </Button>
                        ) : caseDetail.status === 'PENDING_APPROVAL' ? (
                          <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>Report Under SHO Review</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Workspace Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-6 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
                      {[
                        { id: 'overview', label: 'Case Overview', icon: 'description', count: null },
                        { id: 'updates', label: 'Investigation Diary', icon: 'edit_note', count: caseDetail.updates?.length || 0 },
                        { id: 'persons', label: 'Persons Involved', icon: 'group', count: caseDetail.persons?.length || 0 },
                        { id: 'evidence', label: 'Evidence Register', icon: 'inventory_2', count: caseDetail.evidence?.length || 0 },
                        { id: 'custody', label: 'Chain of Custody', icon: 'sync_alt', count: null },
                        { id: 'report', label: 'Final Report Form', icon: 'assignment_turned_in', count: null }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setWorkspaceTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-all whitespace-nowrap ${
                            workspaceTab === tab.id
                              ? 'border-navy-dark text-navy-dark bg-slate-50/50'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{tab.icon}</span>
                          <span>{tab.label}</span>
                          {tab.count !== null && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              workspaceTab === tab.id ? 'bg-navy-dark text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 1: OVERVIEW & COMPLAINANT PARTICULARS           */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Incident & Narrative */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">receipt_long</span>
                            <span>Incident Narrative &amp; Occurrence</span>
                          </h3>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                            {caseDetail.description}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Location of Incident</span>
                              <span className="font-semibold text-slate-800 mt-1 block">{caseDetail.location_text}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Time of Occurrence</span>
                              <span className="font-semibold text-slate-800 mt-1 block">
                                {new Date(caseDetail.incident_dt).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Charged Legal Sections */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600 text-base">gavel</span>
                            <span>Statutory Legal Sections Tagged</span>
                          </h3>
                          {caseDetail.sections && caseDetail.sections.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                                    <th className="py-2.5 px-3">Act</th>
                                    <th className="py-2.5 px-3">Section</th>
                                    <th className="py-2.5 px-3">Statutory Title</th>
                                    <th className="py-2.5 px-3">Cognizable</th>
                                    <th className="py-2.5 px-3">Bailable</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {caseDetail.sections.map((sec) => (
                                    <tr key={sec.section_id} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 font-bold text-navy-dark">{sec.act}</td>
                                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{sec.section_no}</td>
                                      <td className="py-2.5 px-3 font-medium text-slate-700">{sec.title}</td>
                                      <td className="py-2.5 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          sec.is_cognizable ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-600'
                                        }`}>
                                          {sec.is_cognizable ? 'COGNIZABLE' : 'NON-COG'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          sec.is_bailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                          {sec.is_bailable ? 'BAILABLE' : 'NON-BAILABLE'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No legal sections recorded under this FIR file.</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Complainant & Station Particulars */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base">person</span>
                            <span>Complainant Details</span>
                          </h3>
                          <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                              <span className="font-bold text-slate-800 text-sm">{caseDetail.complainant_name}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                              <span className="font-mono text-slate-800 font-semibold">{caseDetail.complainant_phone || 'Not Recorded'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                              <span className="text-slate-800">{caseDetail.complainant_email || 'Not Provided'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Residential Address</span>
                              <span className="text-slate-700">{caseDetail.complainant_address || 'Not Available'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Officer Assignment Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                          <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-600 text-base">badge</span>
                            <span>Investigating Officer Docket</span>
                          </h3>
                          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-navy-dark">{caseDetail.current_io_name}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                                {caseDetail.current_io_badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{caseDetail.current_io_rank || 'Sub-Inspector'}</p>
                            <p className="text-[10px] text-slate-400">
                              Investigation Commenced:{' '}
                              {caseDetail.investigation_started_at
                                ? new Date(caseDetail.investigation_started_at).toLocaleDateString('en-IN')
                                : 'Pending Acceptance'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 2: INVESTIGATION DIARY (case_updates)           */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'updates' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div>
                          <h3 className="text-base font-bold text-navy-dark tracking-tight">Case Progress Diary Notes</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Chronological, tamper-evident investigation entries pursuant to BNSS Section 175.
                          </p>
                        </div>
                        {caseDetail.status === 'UNDER_INVESTIGATION' && (
                          <Button
                            variant="primary"
                            onClick={() => setShowUpdateModal(true)}
                            className="bg-navy-dark hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 flex items-center gap-2 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base text-amber-400">post_add</span>
                            <span>Record Diary Entry</span>
                          </Button>
                        )}
                      </div>

                      {caseDetail.updates && caseDetail.updates.length > 0 ? (
                        <div className="space-y-4">
                          {caseDetail.updates.map((update, idx) => (
                            <div
                              key={update.update_id || idx}
                              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 relative overflow-hidden"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    update.update_type === 'STATEMENT'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : update.update_type === 'SITE_VISIT'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : update.update_type === 'ARREST'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : update.update_type === 'FORENSIC'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}>
                                    {update.update_type}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                    update.visible_to_citizen
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {update.visible_to_citizen ? 'VISIBLE TO CITIZEN' : 'INTERNAL DIARY ONLY'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {new Date(update.created_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                {update.body}
                              </p>
                              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                                <span>Recorded by: <strong className="text-slate-600">{update.officer_name}</strong> ({update.badge_no})</span>
                                <span className="font-mono text-[10px]">ENTRY #{update.update_id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No Investigation Updates Yet"
                          description="No diary entries have been recorded for this case docket. Record statements, scene visit notes, or forensic progress."
                          actionLabel={caseDetail.status === 'UNDER_INVESTIGATION' ? 'Add First Entry' : undefined}
                          onAction={caseDetail.status === 'UNDER_INVESTIGATION' ? () => setShowUpdateModal(true) : undefined}
                        />
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 3: PERSONS INVOLVED (fir_persons)               */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'persons' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div>
                          <h3 className="text-base font-bold text-navy-dark tracking-tight">Persons Involved in Case</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Accused persons, witnesses, and victims recorded under BNSS Section 179 and 180.
                          </p>
                        </div>
                        {caseDetail.status === 'UNDER_INVESTIGATION' && (
                          <Button
                            variant="primary"
                            onClick={() => setShowPersonModal(true)}
                            className="bg-navy-dark hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 flex items-center gap-2 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base text-amber-400">person_add</span>
                            <span>Add Person Record</span>
                          </Button>
                        )}
                      </div>

                      {caseDetail.persons && caseDetail.persons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {caseDetail.persons.map((person) => (
                            <div
                              key={person.person_id}
                              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  person.person_role === 'ACCUSED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : person.person_role === 'WITNESS'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {person.person_role}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  RECORD #{person.person_id}
                                </span>
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-navy-dark">{person.full_name}</h4>
                                {person.contact && (
                                  <p className="text-xs text-slate-600 font-mono mt-0.5">{person.contact}</p>
                                )}
                              </div>

                              {person.address && (
                                <div className="text-[11px] text-slate-600">
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Address</span>
                                  <p className="truncate">{person.address}</p>
                                </div>
                              )}

                              {person.notes && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Notes</span>
                                  <p className="line-clamp-3">{person.notes}</p>
                                </div>
                              )}

                              <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                                <span>Logged: {new Date(person.created_at).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No Persons Logged Yet"
                          description="No suspects, witnesses, or victims have been documented for this inquiry. A Chargesheet requires at least one accused person."
                          actionLabel={caseDetail.status === 'UNDER_INVESTIGATION' ? 'Record Person' : undefined}
                          onAction={caseDetail.status === 'UNDER_INVESTIGATION' ? () => setShowPersonModal(true) : undefined}
                        />
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 4: EVIDENCE REGISTER & VAULT (evidence)         */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'evidence' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                        <div>
                          <h3 className="text-base font-bold text-navy-dark tracking-tight">Case Evidence Register</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Physical and digital exhibits seized, sealed, and audited under the Indian Evidence Act / BSA 2023.
                          </p>
                        </div>
                        {['UNDER_INVESTIGATION', 'ASSIGNED'].includes(caseDetail.status) && (
                          <Button
                            variant="primary"
                            onClick={() => setShowAddEvidenceModal(true)}
                            className="bg-navy-dark hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 flex items-center gap-2 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base text-amber-400">upload_file</span>
                            <span>Seize &amp; Log Evidence</span>
                          </Button>
                        )}
                      </div>

                      {caseDetail.evidence && caseDetail.evidence.length > 0 ? (
                        <div className="space-y-4">
                          {caseDetail.evidence.map((ev) => (
                            <div
                              key={ev.evidence_id}
                              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative overflow-hidden"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-navy-dark">
                                    {ev.evidence_no}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(ev.evidence_no, 'Evidence Number')}
                                    className="text-slate-400 hover:text-navy-dark"
                                    title="Copy Reference"
                                  >
                                    <span className="material-symbols-outlined text-xs">content_copy</span>
                                  </button>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    ev.evidence_type === 'DIGITAL'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : ev.evidence_type === 'DOCUMENT'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : ev.evidence_type === 'WEAPON'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {ev.evidence_type}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    STATUS: {ev.status}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-800 leading-relaxed font-sans">{ev.description}</p>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Current Custodian</span>
                                  <span className="font-semibold text-slate-800 mt-0.5 block">{ev.current_holder_name || 'In Transit'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Storage Location</span>
                                  <span className="font-medium text-slate-700 mt-0.5 block truncate">{ev.location_stored || 'Malkhana'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Collected By</span>
                                  <span className="text-slate-700 mt-0.5 block">{ev.collected_by_name || 'IO'} ({new Date(ev.collected_at).toLocaleDateString('en-IN')})</span>
                                </div>
                              </div>

                              {/* Evidence Checksum Card */}
                              {ev.file_sha256 && (
                                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                                      <span className="material-symbols-outlined text-sm">verified_user</span>
                                      <span>Evidence File Checksum</span>
                                    </div>
                                    <p className="font-mono text-[10px] text-slate-300 truncate mt-0.5 select-all">
                                      {ev.file_sha256}
                                    </p>
                                    {ev.file_name && (
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Attachment: {ev.file_name} {ev.file_size_bytes ? `(${Math.round(ev.file_size_bytes / 1024)} KB)` : ''}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVerifyIntegrity(ev.evidence_id)}
                                      disabled={verifyingIntegrity}
                                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-[11px] py-1 px-3"
                                    >
                                      <span className="material-symbols-outlined text-xs">sync</span>
                                      <span>Verify Checksum</span>
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Actions Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    setSelectedEvidenceForCustody(ev);
                                    setWorkspaceTab('custody');
                                  }}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">history</span>
                                  <span>View Custody Chain Log</span>
                                </button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenTransferModal(ev)}
                                  className="text-xs text-navy-dark border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 py-1 px-3"
                                >
                                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                  <span>Transfer Custody</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No Evidence Exhibits Seized"
                          description="No physical, digital, or document exhibits have been cataloged for this case. Log seized items with custody tracking."
                          actionLabel="Seize Evidence"
                          onAction={() => setShowAddEvidenceModal(true)}
                        />
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 5: CHAIN OF CUSTODY & INTEGRITY VERIFICATION    */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'custody' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-navy-dark tracking-tight">Evidence Chain of Custody</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Official handover records maintaining an unbroken chain of custody.
                            </p>
                          </div>

                          {/* Exhibit Selector Dropdown */}
                          {caseDetail.evidence && caseDetail.evidence.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-600">Select Exhibit:</span>
                              <select
                                value={selectedEvidenceForCustody?.evidence_id || ''}
                                onChange={(e) => {
                                  const evId = parseInt(e.target.value, 10);
                                  const found = caseDetail.evidence.find(ev => ev.evidence_id === evId);
                                  setSelectedEvidenceForCustody(found || null);
                                  setIntegrityResult(null);
                                }}
                                className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-dark"
                              >
                                {caseDetail.evidence.map(ev => (
                                  <option key={ev.evidence_id} value={ev.evidence_id}>
                                    {ev.evidence_no} ({ev.evidence_type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Selected Exhibit Quick Summary */}
                        {selectedEvidenceForCustody && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-navy-dark">
                                  {selectedEvidenceForCustody.evidence_no}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                  {selectedEvidenceForCustody.evidence_type}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                  {selectedEvidenceForCustody.status}
                                </span>
                              </div>
                              <p className="text-slate-600">{selectedEvidenceForCustody.description}</p>
                              <p className="text-[11px] text-slate-500">
                                Current Recorded Custodian: <strong>{selectedEvidenceForCustody.current_holder_name || 'Investigating Officer'}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyIntegrity(selectedEvidenceForCustody.evidence_id)}
                                disabled={verifyingIntegrity}
                                className="text-xs text-navy-dark border-slate-300 hover:bg-slate-100"
                              >
                                <span className={`material-symbols-outlined text-sm ${verifyingIntegrity ? 'animate-spin' : ''}`}>
                                  verified
                                </span>
                                <span>{verifyingIntegrity ? 'Computing Hash...' : 'Audit File Hash'}</span>
                              </Button>

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenTransferModal(selectedEvidenceForCustody)}
                                className="bg-navy-dark hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3"
                              >
                                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                <span>Initiate Transfer</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Record Verification Banner */}
                        {integrityResult && (
                          <div className={`p-4 rounded-xl border text-xs ${
                            integrityResult.isValid
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}>
                            <div className="flex items-center gap-2 font-bold">
                              <span className="material-symbols-outlined text-base">
                                {integrityResult.isValid ? 'check_circle' : 'gpp_bad'}
                              </span>
                              <span>{integrityResult.message}</span>
                            </div>
                            {integrityResult.hasFile && (
                              <div className="mt-2 font-mono text-[10px] space-y-1">
                                <p>Recorded Checksum: <span className="select-all font-semibold">{integrityResult.storedHash}</span></p>
                                {integrityResult.computedHash && (
                                  <p>Verified Checksum: <span className="select-all font-semibold">{integrityResult.computedHash}</span></p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timeline Events for Selected Exhibit */}
                      {selectedEvidenceForCustody ? (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                          <h4 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
                            Sequential Handover Events ({selectedEvidenceForCustody.evidence_no})
                          </h4>

                          {/* Default custody logs or history */}
                          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
                            {/* Genesis Event */}
                            <div className="relative space-y-1">
                              <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-navy-dark">Initial Seizure &amp; Intake</span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(selectedEvidenceForCustody.collected_at).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                Exhibit collected at crime scene intake by officer{' '}
                                <strong>{selectedEvidenceForCustody.collected_by_name || 'Sub-Inspector Vikram Singh'}</strong>.
                              </p>
                              <div className="text-[11px] text-slate-400">
                                Location: {selectedEvidenceForCustody.location_stored || 'Malkhana Safe Custody'}
                              </div>
                            </div>

                            {/* Additional Transfer Log if present */}
                            {selectedEvidenceForCustody.status === 'IN_STORAGE' && (
                              <div className="relative space-y-1 pt-3">
                                <div className="absolute -left-[29px] top-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xs"></div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-navy-dark">Custody Handover — Malkhana Storage</span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {new Date(selectedEvidenceForCustody.updated_at || selectedEvidenceForCustody.collected_at).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  Handed over to <strong>{selectedEvidenceForCustody.current_holder_name || 'Malkhana In-Charge'}</strong> for secure institutional preservation.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No Exhibit Selected"
                          description="Select an evidence exhibit from the dropdown to audit its chain of custody."
                        />
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* WORKSPACE TAB 6: FINAL REPORT (CHARGESHEET / CLOSURE)         */}
                  {/* ------------------------------------------------------------- */}
                  {workspaceTab === 'report' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-base font-bold text-navy-dark tracking-tight">
                              Final Investigation Report (BNSS Section 193)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Police Final Form presented to Station House Officer for submission before the Competent Judicial Court.
                            </p>
                          </div>

                          <StatusBadge status={caseDetail.status} />
                        </div>

                        {/* Statutory Prerequisites Audit */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
                            Investigation Prerequisites Checklist
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className={`material-symbols-outlined text-base ${
                                caseDetail.updates?.length > 0 ? 'text-emerald-600' : 'text-rose-500'
                              }`}>
                                {caseDetail.updates?.length > 0 ? 'check_circle' : 'cancel'}
                              </span>
                              <span>Case Diary Entries ({caseDetail.updates?.length || 0})</span>
                            </div>

                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className={`material-symbols-outlined text-base ${
                                (caseDetail.persons?.filter(p => p.person_role === 'ACCUSED').length || 0) > 0 ? 'text-emerald-600' : 'text-amber-500'
                              }`}>
                                {(caseDetail.persons?.filter(p => p.person_role === 'ACCUSED').length || 0) > 0 ? 'check_circle' : 'info'}
                              </span>
                              <span>Accused Identified ({caseDetail.persons?.filter(p => p.person_role === 'ACCUSED').length || 0})</span>
                            </div>

                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                              <span className={`material-symbols-outlined text-base ${
                                caseDetail.evidence?.length > 0 ? 'text-emerald-600' : 'text-slate-400'
                              }`}>
                                {caseDetail.evidence?.length > 0 ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <span>Exhibits Cataloged ({caseDetail.evidence?.length || 0})</span>
                            </div>
                          </div>
                        </div>

                        {/* If Already Submitted to SHO */}
                        {caseDetail.status === 'PENDING_APPROVAL' ? (
                          <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                                <span className="material-symbols-outlined">gavel</span>
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-purple-950">
                                  Final Report Submitted: {caseDetail.report_type || 'CHARGESHEET'}
                                </h4>
                                <p className="text-xs text-purple-800 mt-0.5">
                                  Currently under judicial review by the Station House Officer.
                                </p>
                              </div>
                            </div>

                            {caseDetail.outcome && (
                              <div className="p-4 rounded-xl bg-white border border-purple-200 text-xs text-slate-800 leading-relaxed font-sans">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Investigation Findings</span>
                                {caseDetail.outcome}
                              </div>
                            )}
                          </div>
                        ) : caseDetail.status === 'UNDER_INVESTIGATION' ? (
                          /* Active Submission Form */
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                              <strong>Investigating Officer Action:</strong> Once you finalize all case diary entries and material evidence, submit your final findings below. Selecting <strong>Chargesheet</strong> requires at least one accused person documented in the case file.
                            </div>

                            <Button
                              variant="primary"
                              onClick={() => {
                                setReportForm({ reportType: 'CHARGESHEET', summary: '', acknowledged: false });
                                setReportConfirmStep(false);
                                setShowReportModal(true);
                              }}
                              className="bg-navy-dark hover:bg-slate-800 text-white font-bold text-xs py-3 px-6 shadow-xs flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-amber-400">send</span>
                              <span>Open Report Submission Form</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            Case is currently in status <strong>{caseDetail.status}</strong>. Report submission is not permitted in this phase.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : (
            /* ================================================================= */
            /* ASSIGNED CASES QUEUE & DASHBOARD OVERVIEW VIEW                   */
            /* ================================================================= */
            <div className="space-y-6">
              {/* Operational KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <MetricCard
                  title="Active Investigations"
                  value={metrics.total_active_cases}
                  changeLabel="Current Docket Workload"
                  icon="biotech"
                  variant="primary"
                />
                <MetricCard
                  title="Pending Acceptance"
                  value={metrics.pending_acceptance}
                  changeLabel="Awaiting IO Docket Takeover"
                  icon="task_alt"
                  variant={metrics.pending_acceptance > 0 ? 'warning' : 'neutral'}
                />
                <MetricCard
                  title="Awaiting Updates"
                  value={metrics.awaiting_updates}
                  changeLabel="No update in > 7 days"
                  icon="update"
                  variant={metrics.awaiting_updates > 0 ? 'danger' : 'neutral'}
                />
                <MetricCard
                  title="Evidence in Custody"
                  value={metrics.evidence_in_custody}
                  changeLabel="Held by SI Vikram Singh"
                  icon="inventory_2"
                  variant="neutral"
                />
                <MetricCard
                  title="Reports Submitted"
                  value={metrics.pending_approval}
                  changeLabel="Awaiting SHO Approval"
                  icon="rule"
                  variant="neutral"
                />
              </div>

              {/* Filter Tabs and Search Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* Quick Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'ALL', label: 'All Cases', count: pagination.total },
                      { id: 'ACTIVE', label: 'Active Inquiries', count: metrics.total_active_cases },
                      { id: 'ASSIGNED', label: 'Pending Acceptance', count: metrics.pending_acceptance },
                      { id: 'UNDER_INVESTIGATION', label: 'Under Investigation', count: metrics.under_investigation },
                      { id: 'PENDING_APPROVAL', label: 'Reports Submitted', count: metrics.pending_approval },
                      { id: 'CONCLUDED', label: 'Concluded', count: metrics.concluded_cases }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          activeTab === tab.id
                            ? 'bg-navy-dark text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-navy-dark hover:bg-slate-100'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          activeTab === tab.id ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Priority Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Priority:</span>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="1">Priority 1 (Emergency)</option>
                      <option value="2">Priority 2 (High / Serious)</option>
                      <option value="3">Priority 3 (Standard)</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by FIR reference, Tracking ID, complainant name, crime category, or narrative keyword..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-dark transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Cases List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {loadingCases ? (
                  <div className="p-6 space-y-4">
                    <DocketCardSkeleton />
                    <DocketCardSkeleton />
                    <DocketCardSkeleton />
                  </div>
                ) : fetchError ? (
                  <ErrorState
                    title="Failed to Load Cases"
                    description={fetchError}
                    onRetry={() => fetchAssignedCases(true)}
                  />
                ) : casesList.length === 0 ? (
                  <EmptyState
                    title="No Assigned Cases Matching Query"
                    description="No case records matched your active filter or search keywords. Clear filters or check for incoming FIR assignments."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setActiveTab('ALL');
                      setSearchQuery('');
                      setSelectedPriority('ALL');
                    }}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4">Case / FIR Ref</th>
                          <th className="py-3 px-4">Complainant</th>
                          <th className="py-3 px-4">Category &amp; Priority</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Last Activity</th>
                          <th className="py-3 px-4">Docket Dossier</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {casesList.map((c) => (
                          <tr key={c.case_id} className="hover:bg-slate-50/80 transition-colors">
                            {/* FIR & Tracking Reference */}
                            <td className="py-3.5 px-4 font-mono">
                              <span className="font-bold text-navy-dark text-xs block">
                                {c.fir_number || `CASE #${c.case_id}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {c.tracking_id}
                              </span>
                            </td>

                            {/* Complainant Name & Contact */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-800 block truncate max-w-[140px]">
                                {c.complainant_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {c.complainant_phone || 'Phone verified'}
                              </span>
                            </td>

                            {/* Category & Priority */}
                            <td className="py-3.5 px-4">
                              <span className="font-medium text-slate-700 block truncate max-w-[150px]">
                                {c.category_name || 'Penal Offence'}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                                c.priority === 1
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : c.priority === 2
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-50 text-slate-600'
                              }`}>
                                PRIO {c.priority}
                              </span>
                            </td>

                            {/* Current Status Badge */}
                            <td className="py-3.5 px-4">
                              <StatusBadge status={c.status} />
                            </td>

                            {/* Last Activity */}
                            <td className="py-3.5 px-4">
                              {c.last_update_at ? (
                                <div>
                                  <span className="font-semibold text-slate-700 block">
                                    {c.last_update_type || 'DIARY NOTE'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(c.last_update_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No updates logged</span>
                              )}
                            </td>

                            {/* Dossier Item Counts */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span title="Diary Updates" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">edit_note</span>
                                  {c.updates_count || 0}
                                </span>
                                <span title="Evidence Exhibits" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">inventory_2</span>
                                  {c.evidence_count || 0}
                                </span>
                                <span title="Persons Involved" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">group</span>
                                  {c.persons_count || 0}
                                </span>
                              </div>
                            </td>

                            {/* Action CTA */}
                            <td className="py-3.5 px-4 text-right">
                              {c.status === 'ASSIGNED' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenWorkspace(c, 'overview')}
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1 px-3 shadow-xs"
                                >
                                  Accept Docket
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenWorkspace(c, 'overview')}
                                  className="text-navy-dark border-slate-300 hover:bg-slate-50 text-xs py-1 px-3"
                                >
                                  Open Workspace
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Bar */}
                {pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
                    <span>
                      Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} cases)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="py-1 px-3"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="py-1 px-3"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: ACCEPT INVESTIGATION DOCKET CONFIRMATION                   */}
      {/* =================================================================== */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">task_alt</span>
              </span>
              <div>
                <h3 className="text-base font-bold text-navy-dark">Accept Investigation Docket</h3>
                <p className="text-xs text-slate-500">Commence formal statutory investigation under BNSS.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 font-sans">
              <p><strong>FIR Number:</strong> {caseDetail?.fir_number}</p>
              <p><strong>Complainant:</strong> {caseDetail?.complainant_name}</p>
              <p><strong>Offence:</strong> {caseDetail?.category_name}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              By accepting this case docket, the FIR status transitions from <strong>ASSIGNED</strong> to <strong>UNDER_INVESTIGATION</strong>. You will assume primary operational responsibility for recording witness statements, seizing exhibits, and drafting the final judicial report.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAcceptModal(false)}
                disabled={acceptingCase}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptCase}
                disabled={acceptingCase}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              >
                {acceptingCase ? 'Commencing...' : 'Confirm Acceptance'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ADD PROGRESS DIARY UPDATE                                  */}
      {/* =================================================================== */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-navy-dark text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-base">edit_note</span>
                </span>
                <h3 className="text-sm font-bold text-navy-dark">Log Investigation Diary Note</h3>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Activity Type</label>
                <select
                  value={updateForm.updateType}
                  onChange={(e) => setUpdateForm({ ...updateForm, updateType: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                >
                  <option value="STATEMENT">Statement Recorded (BNSS 180)</option>
                  <option value="SITE_VISIT">Crime Scene Visit / Spot Inspection</option>
                  <option value="ARREST">Suspect Arrest / Detention Memo</option>
                  <option value="SEARCH">Search &amp; Seizure Operation</option>
                  <option value="FORENSIC">Forensic / Laboratory Inquiry</option>
                  <option value="GENERAL">General Investigation Diary Entry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Investigation Findings &amp; Summary (Min 10 Characters)
                </label>
                <textarea
                  rows={4}
                  value={updateForm.body}
                  onChange={(e) => setUpdateForm({ ...updateForm, body: e.target.value })}
                  placeholder="Detail the actions taken, statements recorded, exhibits recovered, or evidentiary leads verified..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="visibleToCitizen"
                  checked={updateForm.visibleToCitizen}
                  onChange={(e) => setUpdateForm({ ...updateForm, visibleToCitizen: e.target.checked })}
                  className="rounded border-slate-300 text-navy-dark focus:ring-navy-dark w-4 h-4 cursor-pointer"
                />
                <label htmlFor="visibleToCitizen" className="text-xs text-slate-700 cursor-pointer">
                  <strong>Make Visible to Complainant:</strong> When enabled, this progress update appears on the citizen tracking portal.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={submittingUpdate}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingUpdate}
                  className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                >
                  {submittingUpdate ? 'Saving Entry...' : 'Save Diary Note'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: RECORD PERSON INVOLVED                                     */}
      {/* =================================================================== */}
      {showPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-navy-dark text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-base">person_add</span>
                </span>
                <h3 className="text-sm font-bold text-navy-dark">Record Person Involved</h3>
              </div>
              <button onClick={() => setShowPersonModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role in Case</label>
                  <select
                    value={personForm.personRole}
                    onChange={(e) => setPersonForm({ ...personForm, personRole: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  >
                    <option value="ACCUSED">Accused / Suspect</option>
                    <option value="WITNESS">Eyewitness / Material Witness</option>
                    <option value="VICTIM">Victim / Aggrieved Party</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={personForm.fullName}
                    onChange={(e) => setPersonForm({ ...personForm, fullName: e.target.value })}
                    placeholder="Enter full name or alias"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={personForm.contact}
                  onChange={(e) => setPersonForm({ ...personForm, contact: e.target.value })}
                  placeholder="+91 98765 43210 (optional)"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential / Known Address</label>
                <input
                  type="text"
                  value={personForm.address}
                  onChange={(e) => setPersonForm({ ...personForm, address: e.target.value })}
                  placeholder="Permanent or present residential address (optional)"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interrogation / Involvement Notes</label>
                <textarea
                  rows={3}
                  value={personForm.notes}
                  onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })}
                  placeholder="Record role description, specific allegations, identification particulars, or relationship to incident..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-dark"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPersonModal(false)}
                  disabled={submittingPerson}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingPerson}
                  className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                >
                  {submittingPerson ? 'Linking Record...' : 'Link Person'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: SEIZE & ADD EVIDENCE EXHIBIT                               */}
      {/* =================================================================== */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-navy-dark text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                </span>
                <h3 className="text-sm font-bold text-navy-dark">Seize &amp; Log Evidence Exhibit</h3>
              </div>
              <button onClick={() => setShowAddEvidenceModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evidence Category</label>
                  <select
                    value={evidenceForm.evidenceType}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  >
                    <option value="PHYSICAL">Physical Exhibit (Clothing, Tools)</option>
                    <option value="DIGITAL">Digital Evidence (Drive, Phone, SMS)</option>
                    <option value="DOCUMENT">Document / Bank Ledger / Statement</option>
                    <option value="WEAPON">Weapon / Instrument of Offence</option>
                    <option value="BIOLOGICAL">Biological Sample (MLC, DNA)</option>
                    <option value="OTHER">Other Material Exhibit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date &amp; Time Seized</label>
                  <input
                    type="datetime-local"
                    value={evidenceForm.collectedAt}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, collectedAt: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description &amp; Marks of Identification *
                </label>
                <textarea
                  rows={3}
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="Physical condition, make, serial number, packaging marks, and where recovered..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Storage / Malkhana Location</label>
                <input
                  type="text"
                  value={evidenceForm.locationStored}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, locationStored: e.target.value })}
                  placeholder="e.g., Central Malkhana Locker C-14, Cyber Forensic Lab"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                />
              </div>

              {/* Digital Attachment Upload (Computes SHA-256 automatically) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">Digital Attachment / Photograph (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, file: e.target.files[0] || null })}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-navy-dark file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Accepted: JPG, PNG, PDF up to 10MB. File verification checksum is computed upon upload.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddEvidenceModal(false)}
                  disabled={submittingEvidence}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingEvidence}
                  className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                >
                  {submittingEvidence ? 'Cataloging Exhibit...' : 'Register Exhibit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: TRANSFER EVIDENCE CUSTODY                                  */}
      {/* =================================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-navy-dark text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-base">swap_horiz</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-navy-dark">Transfer Evidence Custody</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedEvidenceForCustody?.evidence_no}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {!transferConfirmStep ? (
              <form onSubmit={handleTransferCustody} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Officer *</label>
                  <select
                    value={transferForm.toHolderId}
                    onChange={(e) => setTransferForm({ ...transferForm, toHolderId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    required
                  >
                    <option value="">Select receiving officer in station...</option>
                    {stationOfficers.map((o) => (
                      <option key={o.officer_id} value={o.officer_id}>
                        {o.full_name} ({o.rank || 'Officer'}) — Badge: {o.badge_no}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Custody Status</label>
                    <select
                      value={transferForm.newStatus}
                      onChange={(e) => setTransferForm({ ...transferForm, newStatus: e.target.value })}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    >
                      <option value="IN_STORAGE">IN_STORAGE (Malkhana Deposit)</option>
                      <option value="IN_LAB">IN_LAB (Forensic Laboratory)</option>
                      <option value="PRODUCED_IN_COURT">PRODUCED_IN_COURT (Judicial Trial)</option>
                      <option value="RETURNED">RETURNED (Restitution to Owner)</option>
                      <option value="DESTROYED">DESTROYED (Lawful Disposal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Physical Location</label>
                    <input
                      type="text"
                      value={transferForm.locationStored}
                      onChange={(e) => setTransferForm({ ...transferForm, locationStored: e.target.value })}
                      placeholder="e.g., Central Malkhana Bay 4"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statutory Purpose of Handover *</label>
                  <input
                    type="text"
                    value={transferForm.purpose}
                    onChange={(e) => setTransferForm({ ...transferForm, purpose: e.target.value })}
                    placeholder="e.g., Malkhana safe custody storage, Forensic ballistic examination"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officer Handover Remarks</label>
                  <textarea
                    rows={2}
                    value={transferForm.remarks}
                    onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                    placeholder="Sealing status, container condition, receipt acknowledgement reference..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-navy-dark"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransferModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                  >
                    Review Handover
                  </Button>
                </div>
              </form>
            ) : (
              /* Review & Confirmation Step */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>Confirm Custody Handover</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    This action creates a permanent, official entry in the Chain of Custody register.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-sans">
                  <p><strong>Exhibit:</strong> {selectedEvidenceForCustody?.evidence_no}</p>
                  <p><strong>Recipient:</strong> {stationOfficers.find(o => String(o.officer_id) === String(transferForm.toHolderId))?.full_name || 'Officer'}</p>
                  <p><strong>Purpose:</strong> {transferForm.purpose}</p>
                  <p><strong>New Status:</strong> {transferForm.newStatus}</p>
                  {transferForm.locationStored && <p><strong>New Location:</strong> {transferForm.locationStored}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferConfirmStep(false)}
                    disabled={submittingTransfer}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleTransferCustody}
                    disabled={submittingTransfer}
                    className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                  >
                    {submittingTransfer ? 'Recording Transfer...' : 'Confirm & Execute Handover'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: SUBMIT FINAL INVESTIGATION REPORT                          */}
      {/* =================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-navy-dark text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-base">gavel</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-navy-dark">Final Investigation Report Submission</h3>
                  <p className="text-[10px] text-slate-400 font-mono">BNSS SECTION 193 POLICE REPORT</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {!reportConfirmStep ? (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                {/* Report Type Radios */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">Final Form Classification *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                      reportForm.reportType === 'CHARGESHEET'
                        ? 'border-navy-dark bg-blue-50/50 text-navy-dark font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="reportType"
                          value="CHARGESHEET"
                          checked={reportForm.reportType === 'CHARGESHEET'}
                          onChange={() => setReportForm({ ...reportForm, reportType: 'CHARGESHEET' })}
                          className="text-navy-dark focus:ring-navy-dark"
                        />
                        <span>Chargesheet</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-500">
                        Prima facie evidence established against named accused. Case ready for court trial.
                      </span>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                      reportForm.reportType === 'CLOSURE'
                        ? 'border-navy-dark bg-blue-50/50 text-navy-dark font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="reportType"
                          value="CLOSURE"
                          checked={reportForm.reportType === 'CLOSURE'}
                          onChange={() => setReportForm({ ...reportForm, reportType: 'CLOSURE' })}
                          className="text-navy-dark focus:ring-navy-dark"
                        />
                        <span>Final Closure Report</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-500">
                        Insufficient evidence, false complaint, civil contract dispute, or untraced suspect.
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Investigation Findings &amp; Judicial Summary (Min 15 Characters) *
                  </label>
                  <textarea
                    rows={5}
                    value={reportForm.summary}
                    onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                    placeholder="Summarize the conclusive evidentiary findings, recovered exhibits, statements of witnesses, and grounds for chargesheet or closure..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-dark leading-relaxed"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="reportAcknowledged"
                    checked={reportForm.acknowledged}
                    onChange={(e) => setReportForm({ ...reportForm, acknowledged: e.target.checked })}
                    className="rounded border-slate-300 text-navy-dark focus:ring-navy-dark w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="reportAcknowledged" className="text-xs text-slate-700 cursor-pointer leading-tight">
                    <strong>Statutory Verification:</strong> I hereby certify that the inquiry has been conducted in conformity with the Bharatiya Nagarik Suraksha Sanhita (BNSS), all diary updates are faithful records, and exhibits are sealed in the custody vault.
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                  >
                    Review Final Form
                  </Button>
                </div>
              </form>
            ) : (
              /* Report Review & Confirm Step */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>Submit to Station House Officer</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Upon submission, case status updates to <strong>PENDING_APPROVAL</strong>. You will no longer be able to modify the investigation docket unless the SHO sends the report back for further inquiry.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-sans">
                  <p><strong>Report Type:</strong> {reportForm.reportType}</p>
                  <p><strong>FIR Number:</strong> {caseDetail?.fir_number}</p>
                  <p><strong>Accused Count:</strong> {caseDetail?.persons?.filter(p => p.person_role === 'ACCUSED').length || 0}</p>
                  <p><strong>Summary:</strong> {reportForm.summary}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReportConfirmStep(false)}
                    disabled={submittingReport}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitReport}
                    disabled={submittingReport}
                    className="bg-navy-dark hover:bg-slate-800 text-white font-bold"
                  >
                    {submittingReport ? 'Submitting to SHO...' : 'Confirm & Transmit to SHO'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default IoDashboardPage;
