const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const {
  validateStation,
  validateStationUpdate,
  validateRank,
  validateCategory,
  validateLegalSection,
  validateRoleUpdate,
  validateStationTransfer,
  validateUserStatus,
  validateSlaConfigUpdate
} = require('../validators/admin.validator');

// All administration routes require authentication
router.use(authenticate);

// ===================================================================
// 1. Police Stations Administration (FR-AD1)
// Allowed: ADMIN (manage), SUPERVISOR (read)
// ===================================================================
router.get('/stations', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getStations);
router.get('/stations/:id', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getStationById);
router.post('/stations', requireRole(['ADMIN']), validateStation, adminController.createStation);
router.put('/stations/:id', requireRole(['ADMIN']), validateStationUpdate, adminController.updateStation);
router.patch('/stations/:id/status', requireRole(['ADMIN']), adminController.toggleStationStatus);

// ===================================================================
// 2. Master Police Ranks Administration (FR-AD1)
// Allowed: ADMIN (manage), SUPERVISOR (read)
// ===================================================================
router.get('/ranks', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getRanks);
router.post('/ranks', requireRole(['ADMIN']), validateRank, adminController.createRank);
router.put('/ranks/:id', requireRole(['ADMIN']), adminController.updateRank);

// ===================================================================
// 3. Crime Categories Administration (FR-AD1)
// Allowed: ADMIN (manage), SUPERVISOR (read)
// ===================================================================
router.get('/categories', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getCategories);
router.post('/categories', requireRole(['ADMIN']), validateCategory, adminController.createCategory);
router.put('/categories/:id', requireRole(['ADMIN']), adminController.updateCategory);

// ===================================================================
// 4. Legal Sections Administration (FR-AD1)
// Allowed: ADMIN (manage), SUPERVISOR (read)
// ===================================================================
router.get('/legal-sections', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getLegalSections);
router.post('/legal-sections', requireRole(['ADMIN']), validateLegalSection, adminController.createLegalSection);
router.put('/legal-sections/:id', requireRole(['ADMIN']), adminController.updateLegalSection);

// ===================================================================
// 5. User & Officer Management / Soft Deactivation (FR-AD2)
// Allowed: ADMIN only
// ===================================================================
router.get('/users', requireRole(['ADMIN']), adminController.getUsers);
router.get('/users/:id', requireRole(['ADMIN']), adminController.getUserById);
router.patch('/users/:id/role', requireRole(['ADMIN']), validateRoleUpdate, adminController.updateUserRole);
router.patch('/users/:id/station', requireRole(['ADMIN']), validateStationTransfer, adminController.updateOfficerStation);
router.patch('/users/:id/status', requireRole(['ADMIN']), validateUserStatus, adminController.toggleUserStatus);
router.post('/users/:id/unlock', requireRole(['ADMIN']), adminController.unlockUserAccount);

// ===================================================================
// 6. SLA Configuration & Breach Monitoring (FR-AD3)
// Allowed: ADMIN (manage), SUPERVISOR (breach monitor)
// ===================================================================
router.get('/sla', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getSlaConfigs);
router.put('/sla/:key', requireRole(['ADMIN']), validateSlaConfigUpdate, adminController.updateSlaConfig);
router.get('/sla/breaches', requireRole(['ADMIN', 'SUPERVISOR']), adminController.getSlaBreaches);

module.exports = router;
