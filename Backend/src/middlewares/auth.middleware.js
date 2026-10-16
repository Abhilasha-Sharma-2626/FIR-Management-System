const { verifyToken } = require('../utils/auth.util');

/**
 * Authentication Middleware:
 * Validates Bearer JWT token from Authorization header and sets req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Token is empty.'
    });
  }

  try {
    const decoded = verifyToken(token);
    // Attach decoded user payload: { userId, email, role, citizenId, officerId, stationId }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token.'
    });
  }
}

module.exports = {
  authenticate,
  authenticateToken: authenticate
};