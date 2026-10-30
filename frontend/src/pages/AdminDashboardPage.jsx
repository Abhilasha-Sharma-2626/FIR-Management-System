import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, downloadBlob } from '../lib/api';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function AdminDashboardPage() {
  const { user: currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Parameters Sync
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeTab = queryParams.get('tab') || 'overview';
  const masterDataSubTab = queryParams.get('subtab') || 'categories';

  // Core State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Administrative Datasets
  const [metrics, setMetrics] = useState({
    users: { total_users: 0, active_users: 0, inactive_users: 0, locked_users: 0 },
    roles: [],
    stations: { total_stations: 0, active_stations: 0, inactive_stations: 0 },
    masterData: { crimeCategories: 0, legalSections: 0, policeRanks: 0, slaConfigs: 0 },
    activeCases: 0,
    systemHealth: { status: 'OPERATIONAL' }
  });

  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [crimeCategories, setCrimeCategories] = useState([]);
  const [legalSections, setLegalSections] = useState([]);
  const [policeRanks, setPoliceRanks] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [slaBreaches, setSlaBreaches] = useState({ summary: {}, thresholds: {}, breaches: {} });
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userStationFilter, setUserStationFilter] = useState('ALL');

  const [stationSearch, setStationSearch] = useState('');
  const [stationStatusFilter, setStationStatusFilter] = useState('ALL');

  const [categorySearch, setCategorySearch] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionActFilter, setSectionActFilter] = useState('ALL');

  // Modals & Action States
  // 1. User Details Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // 2. Role Assignment Modal
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newSelectedRole, setNewSelectedRole] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');

  // 3. Officer Station Transfer Modal
  const [transferModalUser, setTransferModalUser] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [transferModalError, setTransferModalError] = useState('');

  // 4. User Status Toggle Modal (Soft Deactivation / Reactivation)
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusModalError, setStatusModalError] = useState('');

  // 5. Unlock User Modal
  const [unlockModalUser, setUnlockModalUser] = useState(null);
  const [submittingUnlock, setSubmittingUnlock] = useState(false);
  const [unlockModalError, setUnlockModalError] = useState('');

  // 6. Station Create / Edit Modal
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [stationFormData, setStationFormData] = useState({
    code: '',
    name: '',
    district: 'New Delhi',
    state: 'Delhi',
    address: '',
    pincode: '',
    phone: '',
    email: ''
  });
  const [submittingStation, setSubmittingStation] = useState(false);
  const [stationFormError, setStationFormError] = useState('');

  // 7. Station Status Toggle Modal
  const [statusModalStation, setStatusModalStation] = useState(null);
  const [submittingStationStatus, setSubmittingStationStatus] = useState(false);
  const [stationStatusError, setStationStatusError] = useState('');

  // 8. Crime Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_cognizable: true
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState('');

  // 9. Legal Section Modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({
    act: 'BNS',
    section_no: '',
    title: '',
    description: '',
    punishment_years: 3,
    is_cognizable: true,
    is_bailable: false
  });
  const [submittingSection, setSubmittingSection] = useState(false);
  const [sectionFormError, setSectionFormError] = useState('');

  // 10. Police Rank Modal
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState(null);
  const [rankFormData, setRankFormData] = useState({
    hierarchy_level: 5,
    code: '',
    title: '',
    description: ''
  });
  const [submittingRank, setSubmittingRank] = useState(false);
  const [rankFormError, setRankFormError] = useState('');

  // 11. SLA Configuration Modal
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [editingSlaConfig, setEditingSlaConfig] = useState(null);
  const [slaFormData, setSlaFormData] = useState({
    thresholdHours: 24,
    escalationTargetRole: 'SHO'
  });
  const [submittingSla, setSubmittingSla] = useState(false);
  const [slaFormError, setSlaFormError] = useState('');

  // 12. Cryptographic Ledger Verification Modal
  const [auditVerifyModalOpen, setAuditVerifyModalOpen] = useState(false);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [auditVerifyResult, setAuditVerifyResult] = useState(null);

  // Success Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Sync tab navigation
  const handleTabChange = (newTab, newSubTab = null) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', newTab);
    if (newSubTab) {
      params.set('subtab', newSubTab);
    } else if (newTab !== 'master-data') {
      params.delete('subtab');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Fetch Core Admin Data
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        metricsRes,
        usersRes,
        stationsRes,
        categoriesRes,
        sectionsRes,
        ranksRes,
        slaRes,
        breachesRes,
        auditRes
      ] = await Promise.allSettled([
        adminApi.getMetrics(),
        adminApi.getUsers({ limit: 100 }),
        adminApi.getStations({ limit: 100 }),
        adminApi.getCategories(),
        adminApi.getLegalSections(),
        adminApi.getRanks(),
        adminApi.getSla(),
        adminApi.getSlaBreaches(),
        adminApi.getAuditLogs({ limit: 25 })
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      }
      if (stationsRes.status === 'fulfilled' && stationsRes.value?.data) {
        setStations(stationsRes.value.data);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) {
        setCrimeCategories(categoriesRes.value.data);
      }
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data) {
        setLegalSections(sectionsRes.value.data);
      }
      if (ranksRes.status === 'fulfilled' && ranksRes.value?.data) {
        setPoliceRanks(ranksRes.value.data);
      }
      if (slaRes.status === 'fulfilled' && slaRes.value?.data) {
        setSlaConfigs(slaRes.value.data);
      }
      if (breachesRes.status === 'fulfilled' && breachesRes.value?.data) {
        setSlaBreaches(breachesRes.value.data);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
        setAuditLogs(auditRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load administrative portal data:', err);
      setError(err.message || 'Unable to load administration dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Handler: Inspect User Details
  const handleViewUserDetail = async (userId) => {
    try {
      setLoadingUserDetail(true);
      const res = await adminApi.getUserById(userId);
      setSelectedUserDetail(res.data);
    } catch (err) {
      showToast(`Error fetching user details: ${err.message}`);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Handler: Update User Role
  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setNewSelectedRole(user.role_code || 'CITIZEN');
    setRoleModalError('');
  };

  const handleSubmitRoleChange = async () => {
    if (!roleModalUser || !newSelectedRole) return;
    try {
      setSubmittingRole(true);
      setRoleModalError('');
      await adminApi.updateUserRole(roleModalUser.user_id, newSelectedRole);
      showToast(`User ${roleModalUser.email} role updated to ${newSelectedRole} successfully.`);
      setRoleModalUser(null);
      await loadAdminData();
    } catch (err) {
      setRoleModalError(err.message || 'Failed to update user role');
    } finally {
      setSubmittingRole(false);
    }
  };

  // Handler: Transfer Officer Station
  const handleOpenTransferModal = (user) => {
    setTransferModalUser(user);
    setSelectedStationId(user.station_id ? String(user.station_id) : '');
    setTransferModalError('');
  };

  const handleSubmitTransfer = async () => {
    if (!transferModalUser || !selectedStationId) return;
    try {
      setSubmittingTransfer(true);
      setTransferModalError('');
      await adminApi.updateOfficerStation(transferModalUser.user_id, parseInt(selectedStationId, 10));
      showToast(`Officer ${transferModalUser.officer_name || transferModalUser.email} transferred successfully.`);
      setTransferModalUser(null);
      await loadAdminData();
    } catch (err) {
      setTransferModalError(err.message || 'Failed to transfer officer station');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Handler: Toggle User Status
  const handleOpenStatusModal = (user) => {
    setStatusModalUser(user);
    setStatusModalError('');
  };

  const handleSubmitUserStatus = async () => {
    if (!statusModalUser) return;
    // Client-side self-deactivation guard
    if (statusModalUser.user_id === currentUser?.userId && statusModalUser.is_active) {
      setStatusModalError('Security Guard: Administrators cannot deactivate their own account.');
      return;
    }

    try {
      setSubmittingStatus(true);
      setStatusModalError('');
      await adminApi.toggleUserStatus(statusModalUser.user_id, !statusModalUser.is_active);
      showToast(`User ${statusModalUser.email} ${statusModalUser.is_active ? 'deactivated' : 'activated'} successfully.`);
      setStatusModalUser(null);
      await loadAdminData();
    } catch (err) {
      setStatusModalError(err.message || 'Failed to toggle account status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Handler: Unlock User Account
  const handleOpenUnlockModal = (user) => {
    setUnlockModalUser(user);
    setUnlockModalError('');
  };

  const handleSubmitUnlock = async () => {
    if (!unlockModalUser) return;
    try {
      setSubmittingUnlock(true);
      setUnlockModalError('');
      await adminApi.unlockUserAccount(unlockModalUser.user_id);
      showToast(`Account ${unlockModalUser.email} unlocked successfully. Failed attempt counter reset.`);
      setUnlockModalUser(null);
      await loadAdminData();
    } catch (err) {
      setUnlockModalError(err.message || 'Failed to unlock user account');
    } finally {
      setSubmittingUnlock(false);
    }
  };

  // Handler: Station Create / Edit
  const handleOpenStationModal = (station = null) => {
    if (station) {
      setEditingStation(station);
      setStationFormData({
        code: station.code || '',
        name: station.name || '',
        district: station.district || 'New Delhi',
        state: station.state || 'Delhi',
        address: station.address || '',
        pincode: station.pincode || '',
        phone: station.phone || '',
        email: station.email || ''
      });
    } else {
      setEditingStation(null);
      setStationFormData({
        code: '',
        name: '',
        district: 'New Delhi',
        state: 'Delhi',
        address: '',
        pincode: '',
        phone: '',
        email: ''
      });
    }
    setStationFormError('');
    setStationModalOpen(true);
  };

  const handleSubmitStationForm = async (e) => {
    e.preventDefault();
    if (!stationFormData.name.trim() || (!editingStation && !stationFormData.code.trim())) {
      setStationFormError('Please fill in all mandatory station fields.');
      return;
    }

    try {
      setSubmittingStation(true);
      setStationFormError('');

      if (editingStation) {
        await adminApi.updateStation(editingStation.station_id, {
          name: stationFormData.name.trim(),
          district: stationFormData.district.trim(),
          state: stationFormData.state.trim(),
          address: stationFormData.address.trim(),
          pincode: stationFormData.pincode.trim(),
          phone: stationFormData.phone.trim(),
          email: stationFormData.email.trim()
        });
        showToast(`Police Station "${stationFormData.name}" updated successfully.`);
      } else {
        await adminApi.createStation({
          code: stationFormData.code.trim().toUpperCase(),
          name: stationFormData.name.trim(),
          district: stationFormData.district.trim(),
          state: stationFormData.state.trim(),
          address: stationFormData.address.trim(),
          pincode: stationFormData.pincode.trim(),
          phone: stationFormData.phone.trim(),
          email: stationFormData.email.trim()
        });
        showToast(`New Police Station "${stationFormData.name}" created successfully.`);
      }

      setStationModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setStationFormError(err.message || 'Failed to save police station record');
    } finally {
      setSubmittingStation(false);
    }
  };

  // Handler: Toggle Station Status
  const handleOpenStationStatusModal = (station) => {
    setStatusModalStation(station);
    setStationStatusError('');
  };

  const handleSubmitStationStatus = async () => {
    if (!statusModalStation) return;
    try {
      setSubmittingStationStatus(true);
      setStationStatusError('');
      await adminApi.toggleStationStatus(statusModalStation.station_id, !statusModalStation.is_active);
      showToast(`Station "${statusModalStation.name}" ${statusModalStation.is_active ? 'deactivated' : 'reactivated'} successfully.`);
      setStatusModalStation(null);
      await loadAdminData();
    } catch (err) {
      setStationStatusError(err.message || 'Failed to toggle station status');
    } finally {
      setSubmittingStationStatus(false);
    }
  };

  // Handler: Crime Category Create / Edit
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        code: cat.code || '',
        name: cat.name || '',
        description: cat.description || '',
        is_cognizable: cat.is_cognizable !== false
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        code: '',
        name: '',
        description: '',
        is_cognizable: true
      });
    }
    setCategoryFormError('');
    setCategoryModalOpen(true);
  };

  const handleSubmitCategoryForm = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim() || (!editingCategory && !categoryFormData.code.trim())) {
      setCategoryFormError('Category code and name are required.');
      return;
    }

    try {
      setSubmittingCategory(true);
      setCategoryFormError('');
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.category_id, {
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          isCognizable: categoryFormData.is_cognizable
        });
        showToast(`Crime Category "${categoryFormData.name}" updated successfully.`);
      } else {
        await adminApi.createCategory({
          code: categoryFormData.code.trim().toUpperCase(),
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim(),
          isCognizable: categoryFormData.is_cognizable
        });
        showToast(`Crime Category "${categoryFormData.name}" created successfully.`);
      }
      setCategoryModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setCategoryFormError(err.message || 'Failed to save crime category');
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Handler: Legal Section Create / Edit
  const handleOpenSectionModal = (sec = null) => {
    if (sec) {
      setEditingSection(sec);
      setSectionFormData({
        act: sec.act || 'BNS',
        section_no: sec.section_no || '',
        title: sec.title || '',
        description: sec.description || '',
        punishment_years: sec.punishment_years ?? 3,
        is_cognizable: sec.is_cognizable !== false,
        is_bailable: sec.is_bailable === true
      });
    } else {
      setEditingSection(null);
      setSectionFormData({
        act: 'BNS',
        section_no: '',
        title: '',
        description: '',
        punishment_years: 3,
        is_cognizable: true,
        is_bailable: false
      });
    }
    setSectionFormError('');
    setSectionModalOpen(true);
  };

  const handleSubmitSectionForm = async (e) => {
    e.preventDefault();
    if (!sectionFormData.section_no.trim() || !sectionFormData.title.trim()) {
      setSectionFormError('Section number and title are required.');
      return;
    }

    try {
      setSubmittingSection(true);
      setSectionFormError('');
      if (editingSection) {
        await adminApi.updateLegalSection(editingSection.section_id, {
          title: sectionFormData.title.trim(),
          description: sectionFormData.description.trim(),
          punishmentYears: parseInt(sectionFormData.punishment_years, 10),
          isCognizable: sectionFormData.is_cognizable,
          isBailable: sectionFormData.is_bailable
        });
        showToast(`Legal Section ${editingSection.act} ${editingSection.section_no} updated successfully.`);
      } else {
        await adminApi.createLegalSection({
          act: sectionFormData.act,
          sectionNo: sectionFormData.section_no.trim(),
          title: sectionFormData.title.trim(),
          description: sectionFormData.description.trim(),
          punishmentYears: parseInt(sectionFormData.punishment_years, 10),
          isCognizable: sectionFormData.is_cognizable,
          isBailable: sectionFormData.is_bailable
        });
        showToast(`Legal Section ${sectionFormData.act} ${sectionFormData.section_no} created successfully.`);
      }
      setSectionModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setSectionFormError(err.message || 'Failed to save legal section');
    } finally {
      setSubmittingSection(false);
    }
  };

  // Handler: Police Rank Create / Edit
  const handleOpenRankModal = (rank = null) => {
    if (rank) {
      setEditingRank(rank);
      setRankFormData({
        hierarchy_level: rank.hierarchy_level || 5,
        code: rank.code || '',
        title: rank.title || '',
        description: rank.description || ''
      });
    } else {
      setEditingRank(null);
      setRankFormData({
        hierarchy_level: 5,
        code: '',
        title: '',
        description: ''
      });
    }
    setRankFormError('');
    setRankModalOpen(true);
  };

  const handleSubmitRankForm = async (e) => {
    e.preventDefault();
    if (!rankFormData.code.trim() || !rankFormData.title.trim()) {
      setRankFormError('Rank code and title are required.');
      return;
    }

    try {
      setSubmittingRank(true);
      setRankFormError('');
      if (editingRank) {
        await adminApi.updateRank(editingRank.rank_id, {
          title: rankFormData.title.trim(),
          description: rankFormData.description.trim(),
          hierarchyLevel: parseInt(rankFormData.hierarchy_level, 10)
        });
        showToast(`Police Rank "${rankFormData.title}" updated successfully.`);
      } else {
        await adminApi.createRank({
          code: rankFormData.code.trim().toUpperCase(),
          title: rankFormData.title.trim(),
          description: rankFormData.description.trim(),
          hierarchyLevel: parseInt(rankFormData.hierarchy_level, 10)
        });
        showToast(`Police Rank "${rankFormData.title}" created successfully.`);
      }
      setRankModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setRankFormError(err.message || 'Failed to save police rank');
    } finally {
      setSubmittingRank(false);
    }
  };

  // Handler: SLA Configuration Update
  const handleOpenSlaModal = (config) => {
    setEditingSlaConfig(config);
    setSlaFormData({
      thresholdHours: config.threshold_hours || 24,
      escalationTargetRole: config.escalation_target_role || 'SHO'
    });
    setSlaFormError('');
    setSlaModalOpen(true);
  };

  const handleSubmitSlaConfig = async (e) => {
    e.preventDefault();
    if (!editingSlaConfig) return;

    try {
      setSubmittingSla(true);
      setSlaFormError('');
      await adminApi.updateSlaConfig(editingSlaConfig.config_key, {
        thresholdHours: parseInt(slaFormData.thresholdHours, 10),
        escalationTargetRole: slaFormData.escalationTargetRole
      });
      showToast(`SLA Policy "${editingSlaConfig.config_key}" updated to ${slaFormData.thresholdHours} hours successfully.`);
      setSlaModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setSlaFormError(err.message || 'Failed to update SLA configuration');
    } finally {
      setSubmittingSla(false);
    }
  };

  // Handler: Cryptographic Audit Verification
  const handleVerifyAuditLedger = async () => {
    try {
      setVerifyingAudit(true);
      setAuditVerifyModalOpen(true);
      const res = await adminApi.verifyAuditChain();
      setAuditVerifyResult(res.data || res);
    } catch (err) {
      setAuditVerifyResult({
        isValid: false,
        error: err.message || 'Audit verification failed'
      });
    } finally {
      setVerifyingAudit(false);
    }
  };

  // Filtered Lists
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !userSearch ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.officer_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.citizen_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.badge_no?.toLowerCase().includes(userSearch.toLowerCase());

      const matchesRole = userRoleFilter === 'ALL' || u.role_code === userRoleFilter;
      const matchesStatus =
        userStatusFilter === 'ALL' ||
        (userStatusFilter === 'ACTIVE' && u.is_active) ||
        (userStatusFilter === 'INACTIVE' && !u.is_active) ||
        (userStatusFilter === 'LOCKED' && u.locked_until && new Date(u.locked_until) > new Date());
      const matchesStation =
        userStationFilter === 'ALL' || String(u.station_id) === String(userStationFilter);

      return matchesSearch && matchesRole && matchesStatus && matchesStation;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter, userStationFilter]);

  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      const matchesSearch =
        !stationSearch ||
        st.code?.toLowerCase().includes(stationSearch.toLowerCase()) ||
        st.name?.toLowerCase().includes(stationSearch.toLowerCase()) ||
        st.district?.toLowerCase().includes(stationSearch.toLowerCase());
      const matchesStatus =
        stationStatusFilter === 'ALL' ||
        (stationStatusFilter === 'ACTIVE' && st.is_active) ||
        (stationStatusFilter === 'INACTIVE' && !st.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [stations, stationSearch, stationStatusFilter]);

  const filteredCategories = useMemo(() => {
    return crimeCategories.filter((c) => {
      return (
        !categorySearch ||
        c.code?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(categorySearch.toLowerCase())
      );
    });
  }, [crimeCategories, categorySearch]);

  const filteredSections = useMemo(() => {
    return legalSections.filter((sec) => {
      const matchesSearch =
        !sectionSearch ||
        sec.section_no?.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        sec.title?.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        sec.description?.toLowerCase().includes(sectionSearch.toLowerCase());
      const matchesAct = sectionActFilter === 'ALL' || sec.act === sectionActFilter;
      return matchesSearch && matchesAct;
    });
  }, [legalSections, sectionSearch, sectionActFilter]);

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body text-on-surface antialiased">
      {/* 1. Global Navigation Sidebar */}
      <DashboardSidebar activeNav={activeTab} />

      {/* 2. Main Portal Stage */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Government Header & Operational Status Bar */}
        <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-900 via-primary to-navy-dark text-white flex items-center justify-center shadow-sm border border-rose-500/30">
              <span className="material-symbols-outlined text-2xl text-rose-300">shield_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Statutory Administrative Command
                </span>
                <span className="text-xs text-secondary font-medium">
                  Headquarters Administration
                </span>
              </div>
              <h1 className="text-lg font-bold text-primary tracking-tight leading-tight">
                CaseSync Police Administration Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyAuditLedger}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border-outline-variant bg-surface-container-low hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              Verify Audit Trail
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </Button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-800 text-xs flex items-center justify-between shadow-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
              <span className="font-medium">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4">
            <ErrorState message={error} onRetry={loadAdminData} />
          </div>
        )}

        {/* 3. Core Administrative Content */}
        <main className="p-6 space-y-6">
          {/* Top Real Administrative Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Registered Accounts"
              value={metrics.users?.total_users || 0}
              icon="manage_accounts"
              color="primary"
              subtitle={`${metrics.users?.active_users || 0} active • ${metrics.users?.inactive_users || 0} inactive`}
            />
            <MetricCard
              title="Police Jurisdictions"
              value={metrics.stations?.total_stations || 0}
              icon="apartment"
              color="tertiary"
              subtitle={`${metrics.stations?.active_stations || 0} operational stations`}
            />
            <MetricCard
              title="Configured Master Data"
              value={
                (metrics.masterData?.crimeCategories || 0) +
                (metrics.masterData?.legalSections || 0) +
                (metrics.masterData?.policeRanks || 0)
              }
              icon="inventory_2"
              color="secondary"
              subtitle={`${metrics.masterData?.crimeCategories || 0} Categories • ${metrics.masterData?.legalSections || 0} Sections • ${metrics.masterData?.policeRanks || 0} Ranks`}
            />
            <MetricCard
              title="SLA Compliance & Cases"
              value={metrics.activeCases || 0}
              icon="policy"
              color="error"
              subtitle={`${metrics.masterData?.slaConfigs || 4} SLA rules active • Zero broken hashes`}
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
              <span>System Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('users')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">group</span>
              <span>User Accounts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] text-secondary">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('stations')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'stations'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">local_police</span>
              <span>Police Stations</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] text-secondary">
                {stations.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('master-data', 'categories')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'master-data'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">dataset</span>
              <span>Master Data</span>
            </button>

            <button
              onClick={() => handleTabChange('config')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>Service Rules &amp; SLAs</span>
            </button>

            <button
              onClick={() => handleTabChange('audit')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">history_edu</span>
              <span>System Audit Log</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & SYSTEM DIAGNOSTICS                                      */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Role Distribution Grid */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary">
                      Identity &amp; Role Distribution Breakdown
                    </h3>
                    <p className="text-body-sm text-secondary">
                      Real-time user count allocated across the 7 recognized statutory roles under the CaseSync Security Model.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-mono font-semibold">
                    {metrics.users?.total_users || 0} Total Identifiers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { role: 'CITIZEN', label: 'Citizens', icon: 'person', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                    { role: 'DESK_OFFICER', label: 'Desk Officers', icon: 'desk', color: 'bg-amber-50 text-amber-900 border-amber-200' },
                    { role: 'IO', label: 'Investigating Officers', icon: 'badge', color: 'bg-blue-50 text-blue-900 border-blue-200' },
                    { role: 'SHO', label: 'Station House Officers', icon: 'security', color: 'bg-cyan-50 text-cyan-900 border-cyan-200' },
                    { role: 'SUPERVISOR', label: 'Supervisors (SP)', icon: 'shield', color: 'bg-purple-50 text-purple-900 border-purple-200' },
                    { role: 'AUDITOR', label: 'Statutory Auditors', icon: 'verified', color: 'bg-slate-50 text-slate-900 border-slate-200' },
                    { role: 'ADMIN', label: 'Administrators', icon: 'admin_panel_settings', color: 'bg-rose-50 text-rose-900 border-rose-200' }
                  ].map((item) => {
                    const match = metrics.roles?.find((r) => r.role_code === item.role);
                    const count = match ? match.user_count : 0;
                    return (
                      <div
                        key={item.role}
                        className={`p-3.5 rounded-xl border ${item.color} flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-lg">{item.icon}</span>
                          <span className="text-lg font-bold">{count}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider">{item.label}</p>
                          <p className="text-[9px] opacity-75 font-mono">{item.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Service Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                  <h3 className="font-title-md text-title-md font-bold text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    System Status &amp; Service Health
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant">
                      <span className="text-secondary">System Services</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Operational (All Services Online)
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant">
                      <span className="text-secondary">Audit Trail Logging</span>
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                        Active (Statutory Activity Logged)
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-outline-variant">
                      <span className="text-secondary">Data Protection Standard</span>
                      <span className="font-semibold text-primary">
                        DPDP Act &amp; BNSS Compliant
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-secondary">Active Cases Monitored</span>
                      <span className="font-semibold text-primary">
                        {metrics.activeCases || 0} active cases
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-700">admin_panel_settings</span>
                      Statutory Authority Boundaries
                    </h3>
                    <p className="text-xs text-secondary leading-relaxed mb-4">
                      Administrators manage identity, police stations, jurisdictional routing, statutory master data, and system thresholds. Case docket evidence, witness statements, and FIR judicial decisions are protected by statutory separation of powers and tamper-evident audit hashing.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleTabChange('users')}
                      className="text-xs"
                    >
                      Manage Users
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenStationModal()}
                      className="text-xs"
                    >
                      + Create Police Station
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTabChange('config')}
                      className="text-xs"
                    >
                      Configure SLAs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USER DIRECTORY & ACCESS CONTROL                                 */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search users by name, email, badge..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Roles ({users.length})</option>
                    <option value="CITIZEN">Citizen</option>
                    <option value="DESK_OFFICER">Desk Officer</option>
                    <option value="IO">Investigating Officer (IO)</option>
                    <option value="SHO">Station House Officer (SHO)</option>
                    <option value="SUPERVISOR">Supervisor (SP)</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="ACTIVE">Active Accounts</option>
                    <option value="INACTIVE">Inactive / Deactivated</option>
                    <option value="LOCKED">Temporarily Locked</option>
                  </select>

                  <select
                    value={userStationFilter}
                    onChange={(e) => setUserStationFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Stations</option>
                    {stations.map((st) => (
                      <option key={st.station_id} value={st.station_id}>
                        {st.code} — {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-secondary font-mono">
                  Showing {filteredUsers.length} of {users.length} accounts
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      <tr>
                        <th className="py-3 px-4">User / Identity</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Jurisdiction / Badge</th>
                        <th className="py-3 px-3">Account Status</th>
                        <th className="py-3 px-3">Created</th>
                        <th className="py-3 px-4 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8">
                            <EmptyState
                              icon="person_search"
                              title="No Users Found"
                              description="No user accounts matched your search and filter parameters."
                            />
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
                          const isSelf = u.user_id === currentUser?.userId;
                          return (
                            <tr key={u.user_id} className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {(u.officer_name || u.citizen_name || u.email || 'U')[0].toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-primary truncate">
                                        {u.officer_name || u.citizen_name || 'Registered User'}
                                      </p>
                                      {isSelf && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-secondary font-mono truncate">{u.email}</p>
                                    {u.phone && <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    u.role_code === 'ADMIN'
                                      ? 'bg-rose-50 text-rose-900 border-rose-300'
                                      : u.role_code === 'SUPERVISOR'
                                      ? 'bg-purple-50 text-purple-900 border-purple-300'
                                      : u.role_code === 'SHO'
                                      ? 'bg-cyan-50 text-cyan-900 border-cyan-300'
                                      : u.role_code === 'IO'
                                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                                      : u.role_code === 'DESK_OFFICER'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  {u.role_code}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                {u.station_name ? (
                                  <div>
                                    <p className="font-medium text-primary truncate max-w-[160px]">
                                      {u.station_name}
                                    </p>
                                    <p className="text-[10px] text-secondary font-mono">
                                      Badge: {u.badge_no || 'N/A'} • {u.officer_rank || 'Officer'}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-secondary italic">Civic Complainant</span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      u.is_active
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        u.is_active ? 'bg-emerald-600' : 'bg-rose-600'
                                      }`}
                                    ></span>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                  </span>

                                  {isLocked && (
                                    <div className="flex items-center gap-1 text-[10px] text-rose-700 font-semibold">
                                      <span className="material-symbols-outlined text-xs">lock</span>
                                      Locked ({u.failed_logins} failed)
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-secondary font-mono text-[11px]">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleViewUserDetail(u.user_id)}
                                    title="View Profile Dossier"
                                    className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-base">visibility</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenRoleModal(u)}
                                    title="Assign Role"
                                    className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-base">shield_person</span>
                                  </button>

                                  {u.officer_id && (
                                    <button
                                      onClick={() => handleOpenTransferModal(u)}
                                      title="Transfer Station Jurisdiction"
                                      className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-base">swap_horiz</span>
                                    </button>
                                  )}

                                  {isLocked && (
                                    <button
                                      onClick={() => handleOpenUnlockModal(u)}
                                      title="Unlock Account"
                                      className="p-1 rounded hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-base">lock_open</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleOpenStatusModal(u)}
                                    disabled={isSelf && u.is_active}
                                    title={
                                      isSelf && u.is_active
                                        ? 'Security Guard: Cannot deactivate self'
                                        : u.is_active
                                        ? 'Deactivate Account'
                                        : 'Reactivate Account'
                                    }
                                    className={`p-1 rounded transition-colors cursor-pointer ${
                                      isSelf && u.is_active
                                        ? 'opacity-30 cursor-not-allowed'
                                        : u.is_active
                                        ? 'hover:bg-rose-100 text-rose-700'
                                        : 'hover:bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      {u.is_active ? 'person_off' : 'person_check'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: POLICE STATIONS & JURISDICTIONS                                     */}
          {/* ========================================================================= */}
          {activeTab === 'stations' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search stations by code, name, district..."
                      value={stationSearch}
                      onChange={(e) => setStationSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <select
                    value={stationStatusFilter}
                    onChange={(e) => setStationStatusFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="ALL">All Stations ({stations.length})</option>
                    <option value="ACTIVE">Active Jurisdictions</option>
                    <option value="INACTIVE">Decommissioned / Inactive</option>
                  </select>
                </div>

                <Button
                  onClick={() => handleOpenStationModal()}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  + Add Police Station
                </Button>
              </div>

              {/* Stations Grid / Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      <tr>
                        <th className="py-3 px-4">Station Code &amp; Name</th>
                        <th className="py-3 px-3">District &amp; State</th>
                        <th className="py-3 px-3">SHO In-Charge</th>
                        <th className="py-3 px-3">Assigned Officers</th>
                        <th className="py-3 px-3">Active Caseload</th>
                        <th className="py-3 px-3">Operational Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredStations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8">
                            <EmptyState
                              icon="apartment"
                              title="No Stations Found"
                              description="No police stations matched your query."
                            />
                          </td>
                        </tr>
                      ) : (
                        filteredStations.map((st) => (
                          <tr key={st.station_id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                                  {st.code?.substring(0, 3)}
                                </div>
                                <div>
                                  <p className="font-semibold text-primary">{st.name}</p>
                                  <p className="text-[10px] text-secondary font-mono">{st.code}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-secondary">
                              <p className="font-medium text-primary">{st.district}</p>
                              <p className="text-[10px]">{st.state} • PIN: {st.pincode || 'N/A'}</p>
                            </td>

                            <td className="py-3 px-3">
                              {st.sho_name ? (
                                <div>
                                  <p className="font-medium text-primary">{st.sho_name}</p>
                                  <p className="text-[10px] text-secondary font-mono">Badge: {st.sho_badge_no}</p>
                                </div>
                              ) : (
                                <span className="text-secondary italic">Unassigned</span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-semibold text-primary">
                              {st.officer_count || 0} Officers
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-amber-700">
                                {st.active_cases_count || 0} Dockets
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  st.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    st.is_active ? 'bg-emerald-600' : 'bg-rose-600'
                                  }`}
                                ></span>
                                {st.is_active ? 'Operational' : 'Decommissioned'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenStationModal(st)}
                                  title="Edit Station Details"
                                  className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>

                                <button
                                  onClick={() => handleOpenStationStatusModal(st)}
                                  title={st.is_active ? 'Decommission Station' : 'Reactivate Station'}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    st.is_active
                                      ? 'hover:bg-rose-100 text-rose-700'
                                      : 'hover:bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {st.is_active ? 'block' : 'check_circle'}
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MASTER DATA MANAGEMENT                                             */}
          {/* ========================================================================= */}
          {activeTab === 'master-data' && (
            <div className="space-y-4">
              {/* Master Data Sub-Navigation */}
              <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                <button
                  onClick={() => handleTabChange('master-data', 'categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    masterDataSubTab === 'categories'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-primary'
                  }`}
                >
                  Crime Categories ({crimeCategories.length})
                </button>
                <button
                  onClick={() => handleTabChange('master-data', 'sections')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    masterDataSubTab === 'sections'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-primary'
                  }`}
                >
                  Legal Sections BNS &amp; IPC ({legalSections.length})
                </button>
                <button
                  onClick={() => handleTabChange('master-data', 'ranks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    masterDataSubTab === 'ranks'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-primary'
                  }`}
                >
                  Police Hierarchy Ranks ({policeRanks.length})
                </button>
              </div>

              {/* Sub-tab 1: Crime Categories */}
              {masterDataSubTab === 'categories' && (
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-sm">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <Button
                      onClick={() => handleOpenCategoryModal()}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      + Add Crime Category
                    </Button>
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        <tr>
                          <th className="py-3 px-4">Category Code</th>
                          <th className="py-3 px-4">Name &amp; Description</th>
                          <th className="py-3 px-3">Statutory Nature</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredCategories.map((c) => (
                          <tr key={c.category_id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-primary">
                              {c.code}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-primary">{c.name}</p>
                              <p className="text-[11px] text-secondary mt-0.5">{c.description || 'No description'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  c.is_cognizable
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {c.is_cognizable ? 'Cognizable (Mandatory FIR)' : 'Non-Cognizable'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {c.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenCategoryModal(c)}
                                className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Legal Sections */}
              {masterDataSubTab === 'sections' && (
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-sm">
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Search section number, title, offenses..."
                          value={sectionSearch}
                          onChange={(e) => setSectionSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <select
                        value={sectionActFilter}
                        onChange={(e) => setSectionActFilter(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg border border-outline-variant bg-surface text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="ALL">All Acts</option>
                        <option value="BNS">BNS (Bharatiya Nyaya Sanhita)</option>
                        <option value="IPC">IPC (Indian Penal Code)</option>
                      </select>
                    </div>

                    <Button
                      onClick={() => handleOpenSectionModal()}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      + Add Legal Section
                    </Button>
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        <tr>
                          <th className="py-3 px-4">Statute &amp; Section</th>
                          <th className="py-3 px-4">Title &amp; Offense Definition</th>
                          <th className="py-3 px-3">Max Punishment</th>
                          <th className="py-3 px-3">Bailability</th>
                          <th className="py-3 px-3">Cognizability</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredSections.map((sec) => (
                          <tr key={sec.section_id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-primary font-mono">
                                {sec.act} Sec. {sec.section_no}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-primary">{sec.title}</p>
                              <p className="text-[11px] text-secondary mt-0.5 line-clamp-1">{sec.description}</p>
                            </td>
                            <td className="py-3 px-3 text-secondary font-mono">
                              {sec.punishment_years !== null && sec.punishment_years !== undefined
                                ? `${sec.punishment_years} Years`
                                : 'Varies'}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  sec.is_bailable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {sec.is_bailable ? 'Bailable' : 'Non-Bailable'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  sec.is_cognizable
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {sec.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenSectionModal(sec)}
                                className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Police Ranks */}
              {masterDataSubTab === 'ranks' && (
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-xs flex items-center justify-between gap-3">
                    <p className="text-xs text-secondary">
                      Standardized Police Hierarchy and Officer Designation Master Data.
                    </p>
                    <Button
                      onClick={() => handleOpenRankModal()}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      + Add Police Rank
                    </Button>
                  </div>

                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        <tr>
                          <th className="py-3 px-4">Level</th>
                          <th className="py-3 px-4">Rank Code</th>
                          <th className="py-3 px-4">Official Designation</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {policeRanks.map((rk) => (
                          <tr key={rk.rank_id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-secondary">
                              Tier {rk.hierarchy_level}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-primary">
                              {rk.code}
                            </td>
                            <td className="py-3 px-4 font-semibold text-primary">
                              {rk.title}
                            </td>
                            <td className="py-3 px-4 text-secondary text-[11px]">
                              {rk.description || 'Statutory police rank designation'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenRankModal(rk)}
                                className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
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

          {/* ========================================================================= */}
          {/* TAB 5: SYSTEM SLAS & CONFIGURATION                                        */}
          {/* ========================================================================= */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                <div className="mb-4 pb-3 border-b border-outline-variant flex items-center justify-between">
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-primary">
                      Statutory SLA Workflow Thresholds
                    </h3>
                    <p className="text-body-sm text-secondary">
                      Service Level Agreement policies governing mandatory complaint preliminary inquiry, IO assignment, and stale case alerts.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-mono font-semibold">
                    {slaConfigs.length} Active SLA Policies
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      <tr>
                        <th className="py-3 px-4">Policy Key</th>
                        <th className="py-3 px-4">Statutory Description</th>
                        <th className="py-3 px-3">Statutory Window</th>
                        <th className="py-3 px-3">Escalation Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {slaConfigs.map((cfg) => (
                        <tr key={cfg.sla_id || cfg.config_key} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {cfg.config_key}
                          </td>
                          <td className="py-3 px-4 text-secondary">
                            {cfg.description}
                          </td>
                          <td className="py-3 px-3 font-semibold text-primary font-mono">
                            {cfg.threshold_hours} Hours ({Math.round(cfg.threshold_hours / 24)} Days)
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-900 border border-purple-200">
                              {cfg.escalation_target_role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Active Policy
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSlaModal(cfg)}
                              className="text-xs"
                            >
                              Edit Threshold
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live SLA Breach Engine Summary */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant">
                  <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-700">alarm_on</span>
                    Live SLA Breach &amp; Escalation Monitor
                  </h3>
                  <span className="text-xs text-secondary font-mono">
                    Automated background evaluation
                  </span>
                </div>
                <p className="text-xs text-secondary mb-4">
                  The automated SLA engine continuously monitors all open complaints and registered FIR dockets. When a statutory threshold is exceeded without judicial action, cases are flagged and auto-escalated to the designated Supervisory authority.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-[11px] font-bold text-amber-900 uppercase">Complaint Review Breaches</p>
                    <p className="text-2xl font-bold text-amber-950 mt-1">
                      {slaBreaches.summary?.complaint_review_breaches || 0}
                    </p>
                    <p className="text-[10px] text-amber-800 mt-1">Pending inquiry &gt; 24h</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-[11px] font-bold text-blue-900 uppercase">IO Assignment Overdue</p>
                    <p className="text-2xl font-bold text-blue-950 mt-1">
                      {slaBreaches.summary?.io_assignment_breaches || 0}
                    </p>
                    <p className="text-[10px] text-blue-800 mt-1">Registered FIR without IO &gt; 48h</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[11px] font-bold text-rose-900 uppercase">Stale Investigation Cases</p>
                    <p className="text-2xl font-bold text-rose-950 mt-1">
                      {slaBreaches.summary?.stale_cases || 0}
                    </p>
                    <p className="text-[10px] text-rose-800 mt-1">Zero diary updates &gt; 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: AUDIT TRAIL & CRYPTOGRAPHIC VERIFICATION                           */}
          {/* ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700">verified</span>
                    Official System Audit Trail
                  </h3>
                  <p className="text-body-sm text-secondary">
                    Every administrative action (role assignment, account deactivation, station status change, SLA update) is permanently recorded in the official audit register.
                  </p>
                </div>
                <Button
                  onClick={handleVerifyAuditLedger}
                  className="flex items-center gap-2 text-xs font-semibold bg-rose-900 hover:bg-rose-950 text-white"
                >
                  <span className="material-symbols-outlined text-sm">shield_check</span>
                  Verify Record Integrity
                </Button>
              </div>

              {/* Audit Logs Table */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-outline-variant text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    <tr>
                      <th className="py-3 px-4">Timestamp (IST)</th>
                      <th className="py-3 px-3">Actor Role</th>
                      <th className="py-3 px-3">Action</th>
                      <th className="py-3 px-3">Entity Type</th>
                      <th className="py-3 px-3">Entity ID</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-mono text-[11px]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-secondary font-body">
                          No audit events recorded in current window.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.audit_id || log.log_id || Math.random()} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-2.5 px-4 text-secondary">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-bold text-[10px]">
                              {log.actor_role || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.action === 'CREATE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.action === 'UPDATE' || log.action === 'ROLE_CHANGE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-primary">
                            {log.entity_type}
                          </td>
                          <td className="py-2.5 px-3 text-secondary">
                            #{log.entity_id}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* ADMINISTRATIVE MODALS & CONFIRMATION DIALOGS                             */}
      {/* ========================================================================= */}

      {/* 1. User Detail Dossier Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
                  {(selectedUserDetail.officer_name || selectedUserDetail.citizen_name || selectedUserDetail.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-primary">
                    {selectedUserDetail.officer_name || selectedUserDetail.citizen_name || 'User Profile Dossier'}
                  </h3>
                  <p className="text-xs text-secondary font-mono">{selectedUserDetail.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">User Identifier</span>
                  <p className="font-mono font-bold text-primary">USR-{String(selectedUserDetail.user_id).padStart(5, '0')}</p>
                </div>
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Assigned Role</span>
                  <p className="font-bold text-rose-700">{selectedUserDetail.role_code}</p>
                </div>
                <div>
                  <span className="text-secondary text-[10px] uppercase font-bold">Account Status</span>
                  <p className="font-bold text-emerald-700">{selectedUserDetail.is_active ? 'Active' : 'Inactive / Suspended'}</p>
                </div>
              </div>

              {selectedUserDetail.officer_id && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                  <h4 className="font-bold text-blue-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    Law Enforcement Officer Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-blue-900">
                    <div>
                      <span className="text-[10px] text-blue-800">Badge Number:</span>
                      <p className="font-mono font-bold">{selectedUserDetail.badge_no || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-800">Rank:</span>
                      <p className="font-bold">{selectedUserDetail.officer_rank || 'Officer'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-blue-800">Station Jurisdiction:</span>
                      <p className="font-bold">{selectedUserDetail.station_name || 'Unassigned'} ({selectedUserDetail.station_code || 'N/A'})</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUserDetail.citizen_id && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <h4 className="font-bold text-emerald-950 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                    Citizen Identity &amp; Statutory KYC
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-emerald-900">
                    <div>
                      <span className="text-[10px] text-emerald-800">Full Legal Name:</span>
                      <p className="font-bold">{selectedUserDetail.citizen_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800">ID Proof:</span>
                      <p className="font-mono font-bold">
                        {selectedUserDetail.id_proof_type || 'Aadhaar'} (•••• {selectedUserDetail.id_proof_last4 || 'XXXX'})
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-emerald-800">Residential Address:</span>
                      <p className="font-medium">{selectedUserDetail.citizen_address || 'New Delhi, India'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant space-y-1">
                <div className="flex justify-between text-secondary">
                  <span>Failed Login Attempts:</span>
                  <span className="font-mono font-bold text-primary">{selectedUserDetail.failed_logins || 0}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Account Locked Until:</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedUserDetail.locked_until
                      ? new Date(selectedUserDetail.locked_until).toLocaleString()
                      : 'None (Account Unlocked)'}
                  </span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Account Created:</span>
                  <span className="font-mono text-primary">
                    {selectedUserDetail.created_at ? new Date(selectedUserDetail.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant flex justify-end">
              <Button onClick={() => setSelectedUserDetail(null)} size="sm">
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Role Assignment Confirmation Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-700">shield_person</span>
                Assign User Statutory Role
              </h3>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-secondary">
                Modifying the role for account <span className="font-bold text-primary font-mono">{roleModalUser.email}</span>. Current role: <span className="font-bold text-rose-700">{roleModalUser.role_code}</span>.
              </p>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1.5">
                  Select New Authority Role <span className="text-rose-600">*</span>
                </label>
                <select
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-semibold text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="CITIZEN">CITIZEN (Complainant Portal Access)</option>
                  <option value="DESK_OFFICER">DESK_OFFICER (General Diary &amp; Citizen Ingestion)</option>
                  <option value="IO">IO (Investigating Officer)</option>
                  <option value="SHO">SHO (Station House Officer &amp; FIR Approval)</option>
                  <option value="SUPERVISOR">SUPERVISOR (District Oversight &amp; Appeals)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                  <option value="AUDITOR">AUDITOR (Statutory Read-Only Auditor)</option>
                </select>
              </div>

              {(newSelectedRole === 'ADMIN' || newSelectedRole === 'SUPERVISOR') && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-amber-700 shrink-0">warning</span>
                  <div>
                    <span className="font-bold">Privilege Escalation Warning:</span> You are assigning elevated administrative or supervisory authority. This action is permanently audited.
                  </div>
                </div>
              )}

              {roleModalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {roleModalError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalUser(null)}
                disabled={submittingRole}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitRoleChange}
                disabled={submittingRole}
                className="bg-primary text-white"
              >
                {submittingRole ? 'Saving Role...' : 'Confirm Role Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Officer Station Transfer Modal */}
      {transferModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-700">swap_horiz</span>
                Transfer Officer Jurisdiction
              </h3>
              <button
                onClick={() => setTransferModalUser(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-secondary">
                Transferring officer <span className="font-bold text-primary">{transferModalUser.officer_name || transferModalUser.email}</span> (Badge: {transferModalUser.badge_no || 'N/A'}).
              </p>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1.5">
                  Target Police Station <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-semibold text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select Operational Police Station</option>
                  {stations
                    .filter((st) => st.is_active)
                    .map((st) => (
                      <option key={st.station_id} value={st.station_id}>
                        {st.code} — {st.name} ({st.district})
                      </option>
                    ))}
                </select>
              </div>

              {transferModalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {transferModalError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferModalUser(null)}
                disabled={submittingTransfer}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitTransfer}
                disabled={submittingTransfer || !selectedStationId}
              >
                {submittingTransfer ? 'Transferring...' : 'Execute Station Transfer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. User Status Toggle Confirmation Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className={`material-symbols-outlined ${statusModalUser.is_active ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {statusModalUser.is_active ? 'person_off' : 'person_check'}
                </span>
                {statusModalUser.is_active ? 'Deactivate User Account' : 'Reactivate User Account'}
              </h3>
              <button
                onClick={() => setStatusModalUser(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-secondary leading-relaxed">
                Are you sure you want to {statusModalUser.is_active ? 'deactivate' : 'reactivate'} the account for{' '}
                <span className="font-bold text-primary font-mono">{statusModalUser.email}</span>?
              </p>

              {statusModalUser.is_active ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Consequence of Deactivation:
                  </span>
                  <p>
                    The user will be immediately barred from logging in or filing complaints. Historical records, complaints, and signed FIR dockets associated with this user will remain preserved for legal integrity.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  Reactivating will restore authentication and portal access for this account.
                </div>
              )}

              {statusModalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {statusModalError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalUser(null)}
                disabled={submittingStatus}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitUserStatus}
                disabled={submittingStatus}
                className={statusModalUser.is_active ? 'bg-rose-900 hover:bg-rose-950 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}
              >
                {submittingStatus
                  ? 'Processing...'
                  : statusModalUser.is_active
                  ? 'Confirm Deactivation'
                  : 'Confirm Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Unlock User Modal */}
      {unlockModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700">lock_open</span>
                Unlock User Account
              </h3>
              <button
                onClick={() => setUnlockModalUser(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-secondary">
                Resetting failed authentication lock for <span className="font-bold text-primary font-mono">{unlockModalUser.email}</span>.
              </p>
              <p className="text-secondary">
                This will reset the failed login counter to zero and immediately permit credential verification.
              </p>

              {unlockModalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {unlockModalError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnlockModalUser(null)}
                disabled={submittingUnlock}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitUnlock}
                disabled={submittingUnlock}
                className="bg-primary text-white"
              >
                {submittingUnlock ? 'Unlocking...' : 'Confirm Account Unlock'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Police Station Create / Edit Modal */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                {editingStation ? 'Edit Police Station' : 'Create New Police Station'}
              </h3>
              <button
                onClick={() => setStationModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitStationForm} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Station Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStation}
                    value={stationFormData.code}
                    onChange={(e) => setStationFormData({ ...stationFormData, code: e.target.value })}
                    placeholder="e.g. CPS-001"
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Station Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stationFormData.name}
                    onChange={(e) => setStationFormData({ ...stationFormData, name: e.target.value })}
                    placeholder="e.g. Connaught Place Police Station"
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stationFormData.district}
                    onChange={(e) => setStationFormData({ ...stationFormData, district: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stationFormData.state}
                    onChange={(e) => setStationFormData({ ...stationFormData, state: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Jurisdictional Address
                </label>
                <textarea
                  rows="2"
                  value={stationFormData.address}
                  onChange={(e) => setStationFormData({ ...stationFormData, address: e.target.value })}
                  placeholder="Street, locality, landmarks..."
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">Pincode</label>
                  <input
                    type="text"
                    value={stationFormData.pincode}
                    onChange={(e) => setStationFormData({ ...stationFormData, pincode: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">Station Phone</label>
                  <input
                    type="text"
                    value={stationFormData.phone}
                    onChange={(e) => setStationFormData({ ...stationFormData, phone: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">Official Email</label>
                  <input
                    type="email"
                    value={stationFormData.email}
                    onChange={(e) => setStationFormData({ ...stationFormData, email: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {stationFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {stationFormError}
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStationModalOpen(false)}
                  disabled={submittingStation}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingStation}>
                  {submittingStation ? 'Saving Station...' : editingStation ? 'Save Changes' : 'Create Station'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Station Status Toggle Modal */}
      {statusModalStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-700">warning</span>
                {statusModalStation.is_active ? 'Decommission Police Station' : 'Reactivate Police Station'}
              </h3>
              <button
                onClick={() => setStatusModalStation(null)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-secondary">
                Are you sure you want to {statusModalStation.is_active ? 'decommission' : 'reactivate'} station{' '}
                <span className="font-bold text-primary">{statusModalStation.name}</span> ({statusModalStation.code})?
              </p>

              {statusModalStation.is_active && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <span className="font-bold">Statutory Preservation Warning:</span>
                  <p>
                    Deactivating this station will prevent assigning new cases or transferring officers to it. Historical FIRs and case dockets linked to this station will remain intact for statutory preservation.
                  </p>
                </div>
              )}

              {stationStatusError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {stationStatusError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalStation(null)}
                disabled={submittingStationStatus}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitStationStatus}
                disabled={submittingStationStatus}
                className={statusModalStation.is_active ? 'bg-rose-900 hover:bg-rose-950 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}
              >
                {submittingStationStatus ? 'Updating...' : statusModalStation.is_active ? 'Confirm Decommission' : 'Confirm Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Crime Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                {editingCategory ? 'Edit Crime Category' : 'Add Crime Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitCategoryForm} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Category Code <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryFormData.code}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })}
                  placeholder="e.g. CYBER_CRIME"
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Cyber Fraud &amp; Financial Identity Theft"
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Statutory guidance and scope..."
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cognizable_toggle"
                  checked={categoryFormData.is_cognizable}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, is_cognizable: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                />
                <label htmlFor="cognizable_toggle" className="text-xs text-primary font-semibold cursor-pointer">
                  Cognizable Offense (Mandatory First Information Report)
                </label>
              </div>

              {categoryFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {categoryFormError}
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryModalOpen(false)}
                  disabled={submittingCategory}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingCategory}>
                  {submittingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Legal Section Modal */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">gavel</span>
                {editingSection ? 'Edit Legal Section' : 'Add Statutory Legal Section'}
              </h3>
              <button
                onClick={() => setSectionModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitSectionForm} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Statute / Act <span className="text-rose-600">*</span>
                  </label>
                  <select
                    disabled={!!editingSection}
                    value={sectionFormData.act}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, act: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-semibold text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="BNS">BNS (Bharatiya Nyaya Sanhita, 2023)</option>
                    <option value="IPC">IPC (Indian Penal Code, 1860)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Section Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSection}
                    value={sectionFormData.section_no}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, section_no: e.target.value })}
                    placeholder="e.g. 303(2)"
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Section Title / Offense Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                  placeholder="e.g. Theft in dwelling house"
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Legal Description &amp; Scope
                </label>
                <textarea
                  rows="2"
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                  placeholder="Statutory definition under statute..."
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">Max Punishment (Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sectionFormData.punishment_years}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, punishment_years: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="sec_cognizable"
                    checked={sectionFormData.is_cognizable}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, is_cognizable: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                  />
                  <label htmlFor="sec_cognizable" className="text-xs text-primary font-semibold cursor-pointer">
                    Cognizable
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="sec_bailable"
                    checked={sectionFormData.is_bailable}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, is_bailable: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                  />
                  <label htmlFor="sec_bailable" className="text-xs text-primary font-semibold cursor-pointer">
                    Bailable
                  </label>
                </div>
              </div>

              {sectionFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {sectionFormError}
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSectionModalOpen(false)}
                  disabled={submittingSection}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingSection}>
                  {submittingSection ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Legal Section'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Police Rank Modal */}
      {rankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">military_tech</span>
                {editingRank ? 'Edit Police Rank' : 'Add Police Rank'}
              </h3>
              <button
                onClick={() => setRankModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitRankForm} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Rank Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRank}
                    value={rankFormData.code}
                    onChange={(e) => setRankFormData({ ...rankFormData, code: e.target.value })}
                    placeholder="e.g. INSP"
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                    Hierarchy Tier Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={rankFormData.hierarchy_level}
                    onChange={(e) => setRankFormData({ ...rankFormData, hierarchy_level: e.target.value })}
                    className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Official Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rankFormData.title}
                  onChange={(e) => setRankFormData({ ...rankFormData, title: e.target.value })}
                  placeholder="e.g. Inspector of Police"
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={rankFormData.description}
                  onChange={(e) => setRankFormData({ ...rankFormData, description: e.target.value })}
                  placeholder="Statutory scope and duties..."
                  className="w-full py-1.5 px-3 rounded-lg border border-outline-variant bg-surface text-primary text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                ></textarea>
              </div>

              {rankFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {rankFormError}
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRankModalOpen(false)}
                  disabled={submittingRank}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingRank}>
                  {submittingRank ? 'Saving...' : editingRank ? 'Save Changes' : 'Create Rank'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. SLA Configuration Modal */}
      {slaModalOpen && editingSlaConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Configure SLA Policy Threshold
              </h3>
              <button
                onClick={() => setSlaModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitSlaConfig} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary">Policy Identifier</span>
                <p className="font-mono font-bold text-primary text-sm">{editingSlaConfig.config_key}</p>
                <p className="text-secondary mt-0.5">{editingSlaConfig.description}</p>
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Threshold Duration (Hours) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  required
                  value={slaFormData.thresholdHours}
                  onChange={(e) => setSlaFormData({ ...slaFormData, thresholdHours: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <span className="text-[10px] text-secondary mt-1 block">
                  Approximately {Math.round(slaFormData.thresholdHours / 24)} days.
                </span>
              </div>

              <div>
                <label className="block text-secondary font-bold uppercase text-[10px] mb-1">
                  Escalation Target Role <span className="text-rose-600">*</span>
                </label>
                <select
                  value={slaFormData.escalationTargetRole}
                  onChange={(e) => setSlaFormData({ ...slaFormData, escalationTargetRole: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-outline-variant bg-surface text-primary font-semibold text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="SHO">SHO (Station House Officer)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Superintendent of Police / SP)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              {slaFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {slaFormError}
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSlaModalOpen(false)}
                  disabled={submittingSla}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingSla}>
                  {submittingSla ? 'Updating Policy...' : 'Save SLA Threshold'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Cryptographic Ledger Verification Result Modal */}
      {auditVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700">shield_check</span>
                System Audit Record Integrity Verification
              </h3>
              <button
                onClick={() => setAuditVerifyModalOpen(false)}
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {verifyingAudit ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                  <p className="font-semibold text-primary">Verifying Record Integrity Against Official Audit Log...</p>
                  <p className="text-secondary text-[11px]">Validating record continuity across all administrative entries.</p>
                </div>
              ) : auditVerifyResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      auditVerifyResult.isValid
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl shrink-0 text-emerald-700">
                      {auditVerifyResult.isValid ? 'verified' : 'gpp_bad'}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm">
                        {auditVerifyResult.isValid
                          ? 'Verification Completed'
                          : 'Discrepancies Detected'}
                      </h4>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {auditVerifyResult.isValid
                          ? 'No discrepancies found in the official audit records.'
                          : 'A record mismatch was detected during verification.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-secondary">Verified Record Count:</span>
                      <span className="font-bold text-primary">{auditVerifyResult.totalRecords || 0} records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Discrepancies:</span>
                      <span className="font-bold text-emerald-700">{auditVerifyResult.brokenLinks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Checked At:</span>
                      <span className="text-primary">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-outline-variant flex justify-end">
              <Button onClick={() => setAuditVerifyModalOpen(false)} size="sm">
                Close Verification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
