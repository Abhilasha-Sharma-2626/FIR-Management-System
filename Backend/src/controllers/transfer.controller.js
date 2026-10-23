const transferService = require('../services/transfer.service');
const {
  validateTransferInitiation,
  validateTransferResolution
} = require('../validators/transfer.validator');

/**
 * POST /api/cases/:id/transfer
 * Initiate inter-station case transfer (SHO / SUPERVISOR)
 */
async function initiateTransfer(req, res, next) {
  try {
    const { isValid, errors } = validateTransferInitiation(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const firId = req.params.id;
    const { toStationId, reason } = req.body;

    const result = await transferService.initiateCaseTransfer({
      firId,
      toStationId,
      reason,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Case transfer initiated successfully and dispatched to target police station.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/accept-transfer
 * Receiving station SHO or SUPERVISOR accepts case transfer
 */
async function acceptTransfer(req, res, next) {
  try {
    const { isValid, errors } = validateTransferResolution(req.body, false);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const firId = req.params.id;
    const { remarks } = req.body;

    const result = await transferService.acceptCaseTransfer({
      firId,
      remarks,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Case transfer accepted. Case successfully registered at receiving station awaiting IO assignment.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cases/:id/reject-transfer
 * Receiving station SHO or SUPERVISOR rejects case transfer
 */
async function rejectTransfer(req, res, next) {
  try {
    const { isValid, errors } = validateTransferResolution(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const firId = req.params.id;
    const { remarks } = req.body;

    const result = await transferService.rejectCaseTransfer({
      firId,
      remarks,
      userId: req.user.userId,
      userRole: req.user.role,
      stationId: req.user.stationId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Case transfer rejected. Case returned to originating police station.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/station/transfers
 * List incoming transfers awaiting acceptance
 */
async function getIncomingTransfers(req, res, next) {
  try {
    const transfers = await transferService.getStationIncomingTransfers({
      stationId: req.user.stationId,
      userRole: req.user.role
    });

    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cases/:id/transfers
 * View complete transfer history for a case
 */
async function getCaseTransfers(req, res, next) {
  try {
    const firId = req.params.id;
    const transfers = await transferService.getCaseTransfers(firId, req.user);

    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  initiateTransfer,
  acceptTransfer,
  rejectTransfer,
  getIncomingTransfers,
  getCaseTransfers
};
