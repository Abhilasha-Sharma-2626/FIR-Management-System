const express = require('express');
const router = express.Router();
const firController = require('../controllers/fir.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Legal Sections Master Data (Available to all logged in officers)
router.get('/master/legal-sections', firController.listLegalSections);

// Desk Officer / SHO Review Endpoints
router.post('/:id/review', requireRoles('DESK_OFFICER', 'SHO'), firController.startReview);
router.post('/:id/request-info', requireRoles('DESK_OFFICER', 'SHO'), firController.requestInfo);
router.post('/:id/reject', requireRoles('DESK_OFFICER', 'SHO'), firController.rejectComplaint);
router.post('/:id/sections', requireRoles('DESK_OFFICER', 'SHO'), firController.tagSections);

// Formal FIR Approval (SHO ONLY)
router.post('/:id/register', requireRoles('SHO'), firController.registerFir);

module.exports = router;