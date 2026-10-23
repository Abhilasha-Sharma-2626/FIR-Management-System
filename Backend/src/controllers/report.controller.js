const reportService = require('../services/report.service');

async function fetchReportData(reportType, query, user) {
  const stationId = ['DESK_OFFICER', 'SHO'].includes(user.role) ? user.stationId : query.stationId;

  switch (reportType) {
    case 'cases-by-status':
      return await reportService.getCasesByStatus({ stationId });
    case 'turnaround-time':
      return await reportService.getTurnaroundTime({ stationId });
    case 'io-workload':
      return await reportService.getIOWorkload({ stationId });
    case 'crime-trends':
      return await reportService.getCrimeTrends({ months: query.months || 12 });
    case 'stale-cases':
      return await reportService.getStaleCases({ thresholdDays: query.thresholdDays || 15 });
    case 'evidence-summary':
      return await reportService.getEvidenceSummary();
    default:
      throw new Error(`Report ${reportType} not implemented`);
  }
}

async function getReport(req, res, next) {
  try {
    const { reportType } = req.params;
    const data = await fetchReportData(reportType, req.query, req.user);
    return res.status(200).json({
      success: true,
      reportType,
      generatedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    next(error);
  }
}

async function exportReportCsv(req, res, next) {
  try {
    const { reportType } = req.params;
    const data = await fetchReportData(reportType, req.query, req.user);
    const records = Array.isArray(data) ? data : [data];
    const csvContent = reportService.toCsv(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReport,
  exportReportCsv
};
