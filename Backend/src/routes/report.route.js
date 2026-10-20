const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const { validateReportType } = require('../validators/report.validator');

// Reports accessible to SHO, SUPERVISOR, AUDITOR, ADMIN
router.use(authenticateToken);
router.use(requireRoles('SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'));

router.get('/:reportType/export', validateReportType, reportController.exportReportCsv);
router.get('/:reportType', validateReportType, reportController.getReport);

module.exports = router;
