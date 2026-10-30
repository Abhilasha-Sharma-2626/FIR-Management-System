const express = require('express');
const router = express.Router();
const firController = require('../controllers/fir.controller');
const appealController = require('../controllers/appeal.controller');
const complaintController = require('../controllers/complaint.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Legal Sections Master Data (Available to all logged in officers)
router.get('/master/legal-sections', firController.listLegalSections);

// Officer Complaint Docket Details
router.get('/:id', requireRoles('DESK_OFFICER', 'SHO', 'IO', 'SUPERVISOR', 'ADMIN'), firController.getFirDetails);

// Desk Officer / SHO Review Endpoints
router.post('/:id/review', requireRoles('DESK_OFFICER', 'SHO'), firController.startReview);
router.post('/:id/request-info', requireRoles('DESK_OFFICER', 'SHO'), firController.requestInfo);
router.post('/:id/reject', requireRoles('DESK_OFFICER', 'SHO'), firController.rejectComplaint);
router.post('/:id/sections', requireRoles('DESK_OFFICER', 'SHO'), firController.tagSections);

// Rejection Appeals (FR-R4: Citizen submits appeal, SHO / SUPERVISOR reviews)
router.post('/:id/appeal', requireRoles('CITIZEN'), appealController.submitAppeal);
router.post('/:id/review-appeal', requireRoles('SHO', 'SUPERVISOR', 'ADMIN'), appealController.reviewAppeal);
router.get('/:id/appeals', appealController.getFirAppeals);

// Formal FIR Approval (SHO ONLY)
router.post('/:id/register', requireRoles('SHO'), firController.registerFir);

// Official FIR Slip / Acknowledgement (Officers & Citizens)
router.get('/:id/slip', complaintController.getAcknowledgementSlip);

module.exports = router;