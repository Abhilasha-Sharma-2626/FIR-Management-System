const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const evidenceController = require('../controllers/evidence.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(authenticateToken);

// 1. IO Workload Query (SHO & SUPERVISOR only)
router.get('/workload', requireRoles('SHO', 'SUPERVISOR'), caseController.getIoWorkload);

// 2. IO Assignment (SHO only)
router.post('/:id/assign', requireRoles('SHO'), caseController.assignIo);

// 3. IO Actions (IO only)
router.post('/:id/accept', requireRoles('IO'), caseController.acceptCase);
router.post('/:id/updates', requireRoles('IO'), caseController.addUpdate);
router.post('/:id/persons', requireRoles('IO'), caseController.addPerson);
router.post('/:id/submit-report', requireRoles('IO'), caseController.submitReport);

// 4. Report Decision & Approvals (SHO only)
router.post('/:id/review-report', requireRoles('SHO'), caseController.reviewReport);

// 5. Reopening Closed Cases (SHO & SUPERVISOR)
router.post('/:id/reopen', requireRoles('SHO', 'SUPERVISOR'), caseController.reopenCase);

// 6. Evidence Logging & Querying for Case (IO / SHO)
router.post(
  '/:caseId/evidence',
  requireRoles('IO', 'SHO', 'ADMIN'),
  upload.single('file'),
  evidenceController.addEvidence
);
router.get('/:caseId/evidence', evidenceController.getCaseEvidence);

// 7. View Full Case Details (All authenticated roles within scope)
router.get('/:id', caseController.getCaseDetails);

module.exports = router;

