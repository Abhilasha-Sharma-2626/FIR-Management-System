const auditService = require('../services/audit.service');

async function getLogs(req, res, next) {
  try {
    const { entityType, entityId, actorId, action, fromDate, toDate, limit, offset } = req.query;
    const logs = await auditService.getAuditLogs({
      entityType,
      entityId,
      actorId,
      action,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

async function verifyChain(req, res, next) {
  try {
    const result = await auditService.verifyAuditChain();
    return res.status(200).json({
      success: result.isValid,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLogs,
  verifyChain
};
