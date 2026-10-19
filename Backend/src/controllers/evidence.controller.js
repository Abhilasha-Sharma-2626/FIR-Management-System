const evidenceService = require('../services/evidence.service');
const {
  validateAddEvidenceInput,
  validateTransferCustodyInput
} = require('../validators/evidence.validator');

/**
 * POST /api/cases/:caseId/evidence
 * Add a new evidence item to an investigation case (IO / SHO)
 */
async function addEvidence(req, res, next) {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    if (!caseId || isNaN(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case identifier.'
      });
    }

    const { isValid, errors } = validateAddEvidenceInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const officerId = req.user.officerId;
    if (!officerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'User is not linked to a police officer profile.'
      });
    }

    const result = await evidenceService.addEvidence({
      caseId,
      officerId,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      data: req.body,
      file: req.file || null,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Evidence successfully logged and chain of custody initiated.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/evidence/:id/transfer
 * Handover / transfer evidence custody (IO / SHO)
 */
async function transferCustody(req, res, next) {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    if (!evidenceId || isNaN(evidenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid evidence identifier.'
      });
    }

    const { isValid, errors } = validateTransferCustodyInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const result = await evidenceService.transferCustody({
      evidenceId,
      officerId: req.user.officerId,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      toHolderId: parseInt(req.body.toHolderId, 10),
      purpose: req.body.purpose,
      newStatus: req.body.newStatus,
      remarks: req.body.remarks,
      locationStored: req.body.locationStored,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Evidence custody successfully transferred.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/evidence/:id/verify
 * Cryptographic SHA-256 integrity check against file on disk (FR-E6)
 */
async function verifyIntegrity(req, res, next) {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    if (!evidenceId || isNaN(evidenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid evidence identifier.'
      });
    }

    const result = await evidenceService.verifyEvidenceIntegrity(evidenceId);
    res.status(200).json({
      success: result.isValid,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cases/:caseId/evidence
 * List all evidence items for a case
 */
async function getCaseEvidence(req, res, next) {
  try {
    const caseId = parseInt(req.params.caseId, 10);
    if (!caseId || isNaN(caseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case identifier.'
      });
    }

    const evidenceList = await evidenceService.getCaseEvidence(caseId, req.user);
    res.status(200).json({
      success: true,
      count: evidenceList.length,
      data: evidenceList
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/evidence/:id
 * Retrieve single evidence item with full chain-of-custody history
 */
async function getEvidenceDetails(req, res, next) {
  try {
    const evidenceId = parseInt(req.params.id, 10);
    if (!evidenceId || isNaN(evidenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid evidence identifier.'
      });
    }

    const details = await evidenceService.getEvidenceDetails(evidenceId, req.user);
    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addEvidence,
  transferCustody,
  verifyIntegrity,
  getCaseEvidence,
  getEvidenceDetails
};
