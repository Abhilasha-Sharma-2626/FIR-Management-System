const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const { validateFeedbackInput } = require('../validators/tracking.validator');

// Public tracking lookup (no authentication required)
router.get('/track/:trackingId', trackingController.trackPublic);

// Authenticated chronological case timeline
router.get('/firs/:id/timeline', authenticateToken, trackingController.getTimeline);

// Citizen feedback on closed cases
router.post(
  '/firs/:id/feedback',
  authenticateToken,
  requireRoles('CITIZEN'),
  validateFeedbackInput,
  trackingController.postFeedback
);

router.get(
  '/firs/:id/feedback',
  authenticateToken,
  requireRoles('CITIZEN', 'SHO', 'SUPERVISOR', 'ADMIN'),
  trackingController.getFeedback
);

module.exports = router;
