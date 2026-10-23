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
  getLegalSections: async () => {
    const res = await api.get('/firs/master/legal-sections');
    return res.data;
  },
  startReview: async (id) => {
    const res = await api.post(`/firs/${id}/review`);
    return res.data;
  },
  requestInfo: async (id, clarification_notes) => {
    const res = await api.post(`/firs/${id}/request-info`, { clarification_notes });
    return res.data;
  },
  rejectComplaint: async (id, rejection_reason) => {
    const res = await api.post(`/firs/${id}/reject`, { rejection_reason });
    return res.data;
  },
  tagSections: async (id, section_ids) => {
    const res = await api.post(`/firs/${id}/sections`, { section_ids });
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
  reviewAppeal: async (id, decision, decision_notes) => {
    const res = await api.post(`/firs/${id}/review-appeal`, { decision, decision_notes });
    return res.data;
  }
};

// ----------------------------------------------------------------------
// 4. Investigation & Case Management
// ----------------------------------------------------------------------
export const casesApi = {
  getIoWorkload: async () => {
    const res = await api.get('/cases/workload');
    return res.data;
  },
  assignIo: async (id, io_id) => {
    const res = await api.post(`/cases/${id}/assign`, { io_id });
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
  getStations: async () => {
    const res = await api.get('/admin/stations');
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/admin/categories');
    return res.data;
  },
  getLegalSections: async () => {
    const res = await api.get('/admin/legal-sections');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  getSla: async () => {
    const res = await api.get('/admin/sla');
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
  }
};

export default api;
