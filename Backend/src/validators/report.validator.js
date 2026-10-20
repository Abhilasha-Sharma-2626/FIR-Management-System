const ALLOWED_REPORTS = [
  'cases-by-status',
  'turnaround-time',
  'io-workload',
  'crime-trends',
  'stale-cases',
  'evidence-summary'
];

function validateReportType(req, res, next) {
  const { reportType } = req.params;
  if (!ALLOWED_REPORTS.includes(reportType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid report type: '${reportType}'. Allowed types: ${ALLOWED_REPORTS.join(', ')}`
    });
  }
  next();
}

module.exports = {
  validateReportType,
  ALLOWED_REPORTS
};
