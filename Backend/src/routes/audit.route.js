const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/rbac.middleware');

// Audit logs viewable by SUPERVISOR, AUDITOR, ADMIN (PROJECT_CONTEXT.md §4.1, §4.3)
router.get(
  '/',
  authenticate,
  requireRole(['SUPERVISOR', 'AUDITOR', 'ADMIN']),
  auditController.getLogs
);

// Cryptographic hash-chain verification endpoint (PROJECT_CONTEXT.md §9.3 & §12.2)
router.get(
  '/verify',
  authenticate,
  requireRole(['SUPERVISOR', 'AUDITOR', 'ADMIN']),
  auditController.verifyChain
);

module.exports = router;
