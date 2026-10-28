const auditService = require('../services/audit.service');

async function getLogs(req, res, next) {
  try {
    const { entityType, entityId, actorId, actorRole, action, search, fromDate, toDate, limit, offset } = req.query;
    const { rows, totalCount } = await auditService.getAuditLogs({
      entityType,
      entityId,
      actorId,
      actorRole,
      action,
      search,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      totalCount,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

async function getLogById(req, res, next) {
  try {
    const { id } = req.params;
    const log = await auditService.getAuditLogById(parseInt(id, 10));
    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await auditService.getAuditOverviewMetrics();
    return res.status(200).json({
      success: true,
      data: metrics
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
  getLogById,
  getMetrics,
  verifyChain
};
