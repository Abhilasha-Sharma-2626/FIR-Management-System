const appealService = require('../services/appeal.service');
const {
  validateAppealSubmission,
  validateAppealReview
} = require('../validators/appeal.validator');

/**
 * POST /api/firs/:id/appeal
 * Citizen submits appeal against rejected complaint
 */
async function submitAppeal(req, res, next) {
  try {
    const { isValid, errors } = validateAppealSubmission(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const firId = req.params.id;
    const citizenId = req.user.citizenId;
    if (!citizenId) {
      return res.status(403).json({
        success: false,
        message: 'Only registered citizen complainants can submit an appeal.'
      });
    }

    const result = await appealService.submitAppeal({
      firId,
      citizenId,
      userId: req.user.userId,
      reason: req.body.reason,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully and forwarded to supervisory officers for review.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/review-appeal
 * Supervisory review (SHO or SUPERVISOR accepts or rejects appeal)
 */
async function reviewAppeal(req, res, next) {
  try {
    const { isValid, errors } = validateAppealReview(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const firId = req.params.id;
    const { appealId, decision, reviewNotes } = req.body;

    const result = await appealService.reviewAppeal({
      firId,
      appealId,
      decision,
      reviewNotes,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      ipAddress: req.ip
    });

    const isAccepted = decision.toUpperCase() === 'ACCEPT';
    res.status(200).json({
      success: true,
      message: isAccepted
        ? 'Appeal accepted. Complaint has been returned to UNDER_REVIEW status.'
        : 'Appeal reviewed and rejected. Complaint remains REJECTED.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/firs/:id/appeals
 * List all appeals filed for an FIR
 */
async function getFirAppeals(req, res, next) {
  try {
    const firId = req.params.id;
    const appeals = await appealService.getFirAppeals(firId, req.user);

    res.status(200).json({
      success: true,
      count: appeals.length,
      data: appeals
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/station/appeals
 * List pending appeals awaiting supervisory review
 */
async function getPendingAppeals(req, res, next) {
  try {
    const appeals = await appealService.getPendingAppeals({
      stationId: req.user.stationId,
      userRole: req.user.role
    });

    res.status(200).json({
      success: true,
      count: appeals.length,
      data: appeals
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitAppeal,
  reviewAppeal,
  getFirAppeals,
  getPendingAppeals
};
