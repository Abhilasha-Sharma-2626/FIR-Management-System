const express = require('express');
const router = express.Router();
const firController = require('../controllers/fir.controller');
const appealController = require('../controllers/appeal.controller');
const transferController = require('../controllers/transfer.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');

router.use(authenticateToken);
router.use(requireRoles('DESK_OFFICER', 'SHO', 'SUPERVISOR', 'ADMIN'));

router.get('/inbox', firController.getStationInbox);
router.get('/appeals', requireRoles('SHO', 'SUPERVISOR', 'ADMIN'), appealController.getPendingAppeals);
router.get('/transfers', requireRoles('SHO', 'SUPERVISOR', 'ADMIN'), transferController.getIncomingTransfers);

module.exports = router;
