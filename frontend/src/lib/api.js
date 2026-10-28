import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('casesync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format error responses cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'An unexpected error occurred. Please verify your connection.';
    return Promise.reject(new Error(message));
  }
);

// ----------------------------------------------------------------------
// 1. Authentication & Identity
// ----------------------------------------------------------------------
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token, newPassword) => {
    const res = await api.post('/auth/reset-password', { token, new_password: newPassword });
    return res.data;
  },
  checkBackendHealth: async () => {
    const res = await api.get('/test');
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 2. Citizen Complaints & Intake
// ----------------------------------------------------------------------
export const complaintsApi = {
  create: async (complaintData) => {
    const res = await api.post('/complaints', complaintData);
    return res.data;
  },
  checkDuplicate: async (criteria) => {
    const res = await api.post('/complaints/check-duplicate', criteria);
    return res.data;
  },
  getMyComplaints: async () => {
    const res = await api.get('/complaints/my');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/complaints/${id}`);
    return res.data;
  },
  updateDraft: async (id, data) => {
    const res = await api.put(`/complaints/${id}`, data);
    return res.data;
  },
  submitDraft: async (id) => {
    const res = await api.post(`/complaints/${id}/submit`);
    return res.data;
  },
  uploadAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/complaints/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  respondToInfo: async (id, response_text) => {
    const res = await api.post(`/complaints/${id}/respond`, { response_text });
    return res.data;
  },
  getAcknowledgementSlip: async (id) => {
    const res = await api.get(`/complaints/${id}/acknowledgement`);
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 3. FIR Review & Police Station Inbox
// ----------------------------------------------------------------------
export const firApi = {
  getStationInbox: async (params = {}) => {
    const res = await api.get('/station/inbox', { params });
    return res.data;
  },
  getFirDetails: async (id) => {
    const res = await api.get(`/firs/${id}`);
    return res.data;
  },
  getLegalSections: async () => {
    const res = await api.get('/firs/master/legal-sections');
    return res.data;
  },
  startReview: async (id) => {
    const res = await api.post(`/firs/${id}/review`);
    return res.data;
  },
  requestInfo: async (id, clarification_notes) => {
    const res = await api.post(`/firs/${id}/request-info`, {
      questionText: clarification_notes,
      clarification_notes
    });
    return res.data;
  },
  rejectComplaint: async (id, rejection_reason) => {
    const res = await api.post(`/firs/${id}/reject`, {
      rejectionReason: rejection_reason,
      rejection_reason
    });
    return res.data;
  },
  tagSections: async (id, section_ids, isCognizable = true) => {
    const res = await api.post(`/firs/${id}/sections`, {
      sectionIds: section_ids,
      section_ids,
      isCognizable
    });
    return res.data;
  },
  registerFir: async (id, notes = '') => {
    const res = await api.post(`/firs/${id}/register`, { notes });
    return res.data;
  },
  getFirSlip: async (id) => {
    const res = await api.get(`/firs/${id}/slip`);
    return res.data;
  },
  submitAppeal: async (id, appeal_reason) => {
    const res = await api.post(`/firs/${id}/appeal`, { appeal_reason });
    return res.data;
  },
  getStationAppeals: async () => {
    const res = await api.get('/station/appeals');
    return res.data;
  },
  reviewAppeal: async (id, decision, reviewNotes, appealId) => {
    const res = await api.post(`/firs/${id}/review-appeal`, {
      decision,
      reviewNotes: reviewNotes || '',
      appealId: appealId || null
    });
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 4. Investigation & Case Management
// ----------------------------------------------------------------------
export const casesApi = {
  getAssignedCases: async (params = {}) => {
    const res = await api.get('/cases', { params });
    return res.data;
  },
  getStationOfficers: async () => {
    const res = await api.get('/cases/station-officers');
    return res.data;
  },
  getIoWorkload: async () => {
    const res = await api.get('/cases/workload');
    return res.data;
  },
  assignIo: async (id, io_id, reason = '') => {
    const res = await api.post(`/cases/${id}/assign`, {
      officerId: io_id,
      officer_id: io_id,
      reason
    });
    return res.data;
  },
  acceptCase: async (id) => {
    const res = await api.post(`/cases/${id}/accept`);
    return res.data;
  },
  addUpdate: async (id, updateData) => {
    const res = await api.post(`/cases/${id}/updates`, updateData);
    return res.data;
  },
  addPerson: async (id, personData) => {
    const res = await api.post(`/cases/${id}/persons`, personData);
    return res.data;
  },
  submitReport: async (id, reportData) => {
    const res = await api.post(`/cases/${id}/submit-report`, reportData);
    return res.data;
  },
  reviewReport: async (id, approvalData) => {
    const res = await api.post(`/cases/${id}/review-report`, approvalData);
    return res.data;
  },
  reopenCase: async (id, reopen_reason) => {
    const res = await api.post(`/cases/${id}/reopen`, { reopen_reason });
    return res.data;
  },
  getCaseDetails: async (id) => {
    const res = await api.get(`/cases/${id}`);
    return res.data;
  },
  addEvidence: async (caseId, formData) => {
    const res = await api.post(`/cases/${caseId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getCaseEvidence: async (caseId) => {
    const res = await api.get(`/cases/${caseId}/evidence`);
    return res.data;
  },
  transferCase: async (id, to_station_id, transfer_reason) => {
    const res = await api.post(`/cases/${id}/transfer`, { to_station_id, transfer_reason });
    return res.data;
  },
  getStationTransfers: async () => {
    const res = await api.get('/station/transfers');
    return res.data;
  },
  acceptTransfer: async (id) => {
    const res = await api.post(`/cases/${id}/accept-transfer`);
    return res.data;
  },
  rejectTransfer: async (id, rejection_reason) => {
    const res = await api.post(`/cases/${id}/reject-transfer`, { rejection_reason });
    return res.data;
  },
  recordCourtOutcome: async (id, outcomeData) => {
    const res = await api.post(`/cases/${id}/court-outcome`, outcomeData);
    return res.data;
  },
  getCourtOutcome: async (id) => {
    const res = await api.get(`/cases/${id}/court-outcome`);
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 5. Evidence Vault & Chain of Custody
// ----------------------------------------------------------------------
export const evidenceApi = {
  getEvidenceDetails: async (id) => {
    const res = await api.get(`/evidence/${id}`);
    return res.data;
  },
  verifyIntegrity: async (id) => {
    const res = await api.get(`/evidence/${id}/verify`);
    return res.data;
  },
  transferCustody: async (id, custodyData) => {
    const res = await api.post(`/evidence/${id}/transfer`, custodyData);
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 6. Public Tracking, Timeline & Citizen Feedback
// ----------------------------------------------------------------------
export const trackingApi = {
  trackPublic: async (trackingId) => {
    // Try both /tracking/track/:id and /track/:id fallback
    try {
      const res = await api.get(`/tracking/track/${encodeURIComponent(trackingId)}`);
      return res.data;
    } catch {
      const res = await api.get(`/track/${encodeURIComponent(trackingId)}`);
      return res.data;
    }
  },
  getTimeline: async (firId) => {
    const res = await api.get(`/tracking/firs/${firId}/timeline`);
    return res.data;
  },
  submitFeedback: async (firId, feedbackData) => {
    const res = await api.post(`/tracking/firs/${firId}/feedback`, feedbackData);
    return res.data;
  },
  getFeedback: async (firId) => {
    const res = await api.get(`/tracking/firs/${firId}/feedback`);
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 7. Notifications
// ----------------------------------------------------------------------
export const notificationsApi = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 8. System Administration & Master Data
// ----------------------------------------------------------------------
export const adminApi = {
  getMetrics: async () => {
    const res = await api.get('/admin/metrics');
    return res.data;
  },
  getStations: async (params = {}) => {
    const res = await api.get('/admin/stations', { params });
    return res.data;
  },
  getStationById: async (id) => {
    const res = await api.get(`/admin/stations/${id}`);
    return res.data;
  },
  createStation: async (data) => {
    const res = await api.post('/admin/stations', data);
    return res.data;
  },
  updateStation: async (id, data) => {
    const res = await api.put(`/admin/stations/${id}`, data);
    return res.data;
  },
  toggleStationStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/stations/${id}/status`, { isActive });
    return res.data;
  },
  getRanks: async (params = {}) => {
    const res = await api.get('/admin/ranks', { params });
    return res.data;
  },
  createRank: async (data) => {
    const res = await api.post('/admin/ranks', data);
    return res.data;
  },
  updateRank: async (id, data) => {
    const res = await api.put(`/admin/ranks/${id}`, data);
    return res.data;
  },
  getCategories: async (params = {}) => {
    const res = await api.get('/admin/categories', { params });
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data;
  },
  getLegalSections: async (params = {}) => {
    const res = await api.get('/admin/legal-sections', { params });
    return res.data;
  },
  createLegalSection: async (data) => {
    const res = await api.post('/admin/legal-sections', data);
    return res.data;
  },
  updateLegalSection: async (id, data) => {
    const res = await api.put(`/admin/legal-sections/${id}`, data);
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  getUserById: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },
  updateUserRole: async (id, roleCode) => {
    const res = await api.patch(`/admin/users/${id}/role`, { roleCode });
    return res.data;
  },
  updateOfficerStation: async (id, stationId) => {
    const res = await api.patch(`/admin/users/${id}/station`, { stationId });
    return res.data;
  },
  toggleUserStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },
  unlockUserAccount: async (id) => {
    const res = await api.post(`/admin/users/${id}/unlock`);
    return res.data;
  },
  getSla: async () => {
    const res = await api.get('/admin/sla');
    return res.data;
  },
  updateSlaConfig: async (key, data) => {
    const res = await api.put(`/admin/sla/${key}`, data);
    return res.data;
  },
  getSlaBreaches: async () => {
    const res = await api.get('/admin/sla/breaches');
    return res.data;
  },
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  },
  verifyAuditChain: async () => {
    const res = await api.get('/audit/verify');
    return res.data;
  },
  getReport: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}`, { params });
    return res.data;
  },
  exportReportCsv: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}/export`, {
      params,
      responseType: 'blob'
    });
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 9. Supervisor Oversight & Appellate Authority
// ----------------------------------------------------------------------
export const supervisorApi = {
  getOverviewMetrics: async (params = {}) => {
    const res = await api.get('/cases', { params: { limit: 1, ...params } });
    return res.data?.metrics || {};
  },
  getDistrictCases: async (params = {}) => {
    const res = await api.get('/cases', { params });
    return res.data;
  },
  getCaseDetails: async (id) => {
    const res = await api.get(`/cases/${id}`);
    return res.data;
  },
  getSlaBreaches: async () => {
    const res = await api.get('/admin/sla/breaches');
    return res.data;
  },
  getSlaConfigs: async () => {
    const res = await api.get('/admin/sla');
    return res.data;
  },
  getPendingAppeals: async () => {
    const res = await api.get('/station/appeals');
    return res.data;
  },
  getFirAppeals: async (firId) => {
    const res = await api.get(`/firs/${firId}/appeals`);
    return res.data;
  },
  reviewAppeal: async (firId, decision, reviewNotes, appealId) => {
    const res = await api.post(`/firs/${firId}/review-appeal`, {
      decision,
      reviewNotes: reviewNotes || '',
      appealId: appealId || null
    });
    return res.data;
  },
  reopenCase: async (id, reopen_reason) => {
    const res = await api.post(`/cases/${id}/reopen`, { reopen_reason });
    return res.data;
  },
  getIncomingTransfers: async () => {
    const res = await api.get('/station/transfers');
    return res.data;
  },
  getReport: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}`, { params });
    return res.data;
  },
  exportReportCsv: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}/export`, {
      params,
      responseType: 'blob'
    });
    return res.data;
  },
  verifyAuditChain: async () => {
    const res = await api.get('/audit/verify');
    return res.data;
  },
  getStations: async () => {
    const res = await api.get('/admin/stations');
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 10. Statutory Auditor & Vigilance Portal (Strictly Read-Only)
// ----------------------------------------------------------------------
export const auditorApi = {
  getOverviewMetrics: async () => {
    const res = await api.get('/audit/metrics');
    return res.data;
  },
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  },
  getAuditLogById: async (id) => {
    const res = await api.get(`/audit/${id}`);
    return res.data;
  },
  verifyAuditChain: async () => {
    const res = await api.get('/audit/verify');
    return res.data;
  },
  getReport: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}`, { params });
    return res.data;
  },
  exportReportCsv: async (reportType, params = {}) => {
    const res = await api.get(`/reports/${reportType}/export`, {
      params,
      responseType: 'blob'
    });
    return res.data;
  }
};

/**
 * Trigger client-side file download for Blob data
 */
export function downloadBlob(blobData, filename) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default api;
