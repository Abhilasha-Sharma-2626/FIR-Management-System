const caseService = require('../services/case.service');
const {
  validateAssignInput,
  validateUpdateInput,
  validateFinalReportInput,
  validateReviewReportInput,
  validateReopenInput
} = require('../validators/case.validator');

/**
 * GET /api/cases/workload
 * SHO views active workload of officers in their station
 */
async function getIoWorkload(req, res, next) {
  try {
    const stationId = req.user.stationId;
    if (!stationId) {
      return res.status(400).json({ success: false, message: 'User is not assigned to a police station.' });
    }

    const workload = await caseService.getStationIoWorkload(stationId);
    res.status(200).json({ success: true, data: workload });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/assign
 * SHO assigns or reassigns an IO to a case
 */
async function assignIo(req, res, next) {
  try {
    const { isValid, errors } = validateAssignInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const result = await caseService.assignCaseIo({
      firId: req.params.id,
      officerId: req.body.officerId,
      assignerUserId: req.user.userId,
      stationId: req.user.stationId,
      reason: req.body.reason,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Investigating Officer assigned successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/accept
 * IO accepts case and commences investigation
 */
async function acceptCase(req, res, next) {
  try {
    const result = await caseService.acceptInvestigation({
      firId: req.params.id,
      officerId: req.user.officerId,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Case accepted. Investigation is now active.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/updates
 * IO logs progress diary update
 */
async function addUpdate(req, res, next) {
  try {
    const { isValid, errors } = validateUpdateInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const result = await caseService.addCaseUpdate({
      firId: req.params.id,
      officerId: req.user.officerId,
      userId: req.user.userId,
      updateType: req.body.updateType.toUpperCase(),
      body: req.body.body,
      visibleToCitizen: req.body.visibleToCitizen,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Case progress update logged successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/persons
 * IO adds accused/witness/victim
 */
async function addPerson(req, res, next) {
  try {
    if (!req.body.fullName || !req.body.personRole) {
      return res.status(400).json({ success: false, message: 'fullName and personRole are required.' });
    }

    const result = await caseService.addCasePerson({
      firId: req.params.id,
      officerId: req.user.officerId,
      personData: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Person record linked to case.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/submit-report
 * IO submits final report (CHARGESHEET / CLOSURE)
 */
async function submitReport(req, res, next) {
  try {
    const { isValid, errors } = validateFinalReportInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const result = await caseService.submitFinalReport({
      firId: req.params.id,
      officerId: req.user.officerId,
      userId: req.user.userId,
      reportType: req.body.reportType.toUpperCase(),
      summary: req.body.summary,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Final investigation report submitted for SHO approval.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/review-report
 * SHO decides on report
 */
async function reviewReport(req, res, next) {
  try {
    const { isValid, errors } = validateReviewReportInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const result = await caseService.reviewFinalReport({
      firId: req.params.id,
      stationId: req.user.stationId,
      userId: req.user.userId,
      decision: req.body.decision.toUpperCase(),
      remarks: req.body.remarks,
      courtDetails: req.body.courtDetails,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Report decision processed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/reopen
 * SHO or SUPERVISOR reopens closed case
 */
async function reopenCase(req, res, next) {
  try {
    const { isValid, errors } = validateReopenInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const result = await caseService.reopenCase({
      firId: req.params.id,
      stationId: req.user.stationId,
      userRole: req.user.role,
      userId: req.user.userId,
      reason: req.body.reason,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Case successfully reopened.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cases/:id
 * Retrieve comprehensive case information
 */
async function getCaseDetails(req, res, next) {
  try {
    const caseData = await caseService.getCaseDetails(req.params.id, req.user);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }
    res.status(200).json({ success: true, data: caseData });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIoWorkload,
  assignIo,
  acceptCase,
  addUpdate,
  addPerson,
  submitReport,
  reviewReport,
  reopenCase,
  getCaseDetails
};
