const pool = require('../config/db');
const { logAuditEvent } = require('../services/audit.service');

/**
 * 1. Role-based guard (PROJECT_CONTEXT.md §4.1)
 * Restricts access to specific role codes
 */
function requireRole(roles = []) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await logAuditEvent({
        actorId: req.user?.userId || null,
        actorRole: req.user?.role || null,
        action: 'ACCESS_DENIED',
        entityType: 'route',
        oldData: {
          path: req.originalUrl,
          method: req.method,
          requiredRoles: allowedRoles,
          actualRole: req.user?.role || 'UNAUTHENTICATED'
        },
        ipAddress
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the required role to perform this action.'
      });
    }
    next();
  };
}

function requireRoles(...roles) {
  const allowed = Array.isArray(roles[0]) ? roles[0] : roles;
  return requireRole(allowed);
}

/**
 * 2. Data-driven permission guard (PROJECT_CONTEXT.md §4.2)
 * Queries role_permissions table to verify if the user's role grants this permission
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Authentication required.'
        });
      }

      const checkRes = await pool.query(
        `SELECT 1
         FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE r.code = $1 AND p.code = $2`,
        [req.user.role, permissionCode]
      );

      if (checkRes.rows.length === 0) {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logAuditEvent({
          actorId: req.user.userId,
          actorRole: req.user.role,
          action: 'ACCESS_DENIED',
          entityType: 'permission',
          oldData: {
            path: req.originalUrl,
            method: req.method,
            missingPermission: permissionCode
          },
          ipAddress
        });

        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permission '${permissionCode}'.`
        });
      }

      next();
    } catch (err) {
      console.error('Permission verification error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Permission verification failed due to internal error.'
      });
    }
  };
}

/**
 * 3. Station jurisdictional scope guard (PROJECT_CONTEXT.md §4.2)
 * Enforces station boundary: Officers may only access their own station.
 * SUPERVISOR and ADMIN have district/system-wide jurisdiction.
 */
function requireStationScope(stationIdParamKey = 'stationId') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // SUPERVISOR and ADMIN have district / system-wide jurisdiction
    if (['SUPERVISOR', 'ADMIN'].includes(req.user.role)) {
      return next();
    }

    const rawStationId =
      req.params[stationIdParamKey] ||
      req.body[stationIdParamKey] ||
      req.query[stationIdParamKey];
    const targetStationId = parseInt(rawStationId, 10);

    if (isNaN(targetStationId)) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid station identifier (${stationIdParamKey}).`
      });
    }

    if (!req.user.stationId || req.user.stationId !== targetStationId) {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED',
        entityType: 'station_scope',
        entityId: targetStationId,
        oldData: {
          userStationId: req.user.stationId,
          targetStationId
        },
        ipAddress
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have jurisdiction in this police station.'
      });
    }

    next();
  };
}

/**
 * 4. Citizen ownership scope guard (PROJECT_CONTEXT.md §4.2)
 * Enforces that CITIZEN users can only view/manage their own records
 */
function requireCitizenOwnership(complainantIdKey = 'complainantId') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Non-citizens (police officers, admin) bypass complainant ownership
    if (req.user.role !== 'CITIZEN') {
      return next();
    }

    const rawCitizenId =
      req.params[complainantIdKey] ||
      req.body[complainantIdKey] ||
      req.query[complainantIdKey];
    const targetCitizenId = parseInt(rawCitizenId, 10);

    if (!req.user.citizenId || req.user.citizenId !== targetCitizenId) {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await logAuditEvent({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED',
        entityType: 'citizen_scope',
        entityId: targetCitizenId,
        ipAddress
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: Citizens may only access their own records.'
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
  requireRoles,
  requirePermission,
  requireStationScope,
  requireCitizenOwnership
};