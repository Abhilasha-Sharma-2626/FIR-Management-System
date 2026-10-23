const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const upload = require('../middlewares/upload.middleware');

// Public tracking
router.get('/track/:trackingId', complaintController.trackComplaint);

// Citizen authenticated routes
router.use(authenticateToken);
router.use(requireRoles('CITIZEN'));

router.post('/', complaintController.createComplaint);
router.post('/check-duplicate', complaintController.checkDuplicate);
router.get('/my', complaintController.getMyComplaints);
router.get('/:id', complaintController.getComplaintDetails);
router.put('/:id', complaintController.updateDraft);
router.post('/:id/submit', complaintController.submitDraft);
router.post('/:id/attachments', upload.single('file'), complaintController.uploadAttachment);
router.post('/:id/respond', complaintController.respondToInfo);
router.get('/:id/acknowledgement', complaintController.getAcknowledgementSlip);

module.exports = router;