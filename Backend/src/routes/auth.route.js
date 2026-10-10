const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  requireRole,
  requirePermission,
  requireStationScope
} = require('../middlewares/rbac.middleware');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

// Admin-only officer registration (PROJECT_CONTEXT.md §5.1 FR-A4)
router.post(
  '/register-officer',
  authenticate,
  requireRole(['ADMIN']),
  authController.registerOfficer
);

// ===== RBAC & Scope Test Endpoints for easy API testing & verification =====

// 1. Public test
router.get('/test/public', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Public test route accessible without authentication.'
  });
});

// 2. Authenticated test
router.get('/test/authenticated', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Authenticated successfully as ${req.user.email} (${req.user.role}).`,
    user: req.user
  });
});

// 3. Role test: SHO only
router.get('/test/role/sho', authenticate, requireRole(['SHO']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: User is an SHO.',
    user: req.user
  });
});

// 4. Role test: ADMIN only
router.get('/test/role/admin', authenticate, requireRole(['ADMIN']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: User is an ADMIN.',
    user: req.user
  });
});

// 5. Role test: CITIZEN only
router.get('/test/role/citizen', authenticate, requireRole(['CITIZEN']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: User is a CITIZEN.',
    user: req.user
  });
});

// 6. Permission test: fir:create
router.get(
  '/test/permission/fir-create',
  authenticate,
  requirePermission('fir:create'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Access granted: User has 'fir:create' permission.",
      role: req.user.role
    });
  }
);

// 7. Permission test: user:manage
router.get(
  '/test/permission/user-manage',
  authenticate,
  requirePermission('user:manage'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Access granted: User has 'user:manage' permission.",
      role: req.user.role
    });
  }
);

// 8. Permission test: audit:read
router.get(
  '/test/permission/audit-read',
  authenticate,
  requirePermission('audit:read'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Access granted: User has 'audit:read' permission.",
      role: req.user.role
    });
  }
);

// 9. Station jurisdictional scope test
router.get(
  '/test/station/:stationId',
  authenticate,
  requireStationScope('stationId'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Access granted: User has jurisdiction in police station ID ${req.params.stationId}.`,
      userStationId: req.user.stationId,
      targetStationId: req.params.stationId
    });
  }
);

module.exports = router;