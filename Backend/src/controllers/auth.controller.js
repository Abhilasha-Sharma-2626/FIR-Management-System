const authService = require('../services/auth.service');
const {
  validateRegisterInput,
  validateLoginInput,
  validateRegisterOfficerInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
} = require('../validators/auth.validator');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
}

/**
 * Citizen registration (POST /api/auth/register)
 */
async function register(req, res, next) {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const ipAddress = getClientIp(req);
    const result = await authService.registerCitizen({
      ...req.body,
      ipAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * User login (POST /api/auth/login)
 */
async function login(req, res, next) {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const ipAddress = getClientIp(req);
    const result = await authService.loginUser({
      email: req.body.email,
      password: req.body.password,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Get current authenticated user profile (GET /api/auth/me)
 */
async function getMe(req, res, next) {
  try {
    const profile = await authService.getCurrentUserProfile(req.user.userId);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Register officer account by ADMIN (POST /api/auth/register-officer)
 */
async function registerOfficer(req, res, next) {
  try {
    const validation = validateRegisterOfficerInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const ipAddress = getClientIp(req);
    const result = await authService.registerOfficer({
      ...req.body,
      adminUserId: req.user.userId,
      ipAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Officer account created successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Request password reset (POST /api/auth/forgot-password)
 */
async function forgotPassword(req, res, next) {
  try {
    const validation = validateForgotPasswordInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const ipAddress = getClientIp(req);
    const result = await authService.forgotPassword({
      email: req.body.email,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * Reset password (POST /api/auth/reset-password)
 */
async function resetPassword(req, res, next) {
  try {
    const validation = validateResetPasswordInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const ipAddress = getClientIp(req);
    const result = await authService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * User logout (POST /api/auth/logout)
 */
async function logout(req, res, next) {
  try {
    const ipAddress = getClientIp(req);
    const result = await authService.logoutUser({
      userId: req.user?.userId,
      role: req.user?.role,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  registerOfficer,
  forgotPassword,
  resetPassword,
  logout
};
