const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(authenticateToken);

// 1. Evidence List & Details
router.get('/:id', evidenceController.getEvidenceDetails);
router.get('/:id/verify', requireRoles('IO', 'SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'), evidenceController.verifyIntegrity);

// 2. Evidence Custody Transfer (IO / SHO)
router.post(
  '/:id/transfer',
  requireRoles('IO', 'SHO', 'ADMIN'),
  evidenceController.transferCustody
);

module.exports = router;
