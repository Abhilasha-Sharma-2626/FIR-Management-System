/**
 * Input validators for Authentication and Authorization
 * PO7 - Ethics: Validates data minimization (only last 4 digits of ID proof)
 */

function validateRegisterInput(data = {}) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  const name = data.fullName || data.fullname;
  if (!name || name.trim().length === 0) {
    errors.push('Full name is required.');
  }

  if (data.phone && !/^\+?[0-9]{10,15}$/.test(data.phone)) {
    errors.push('Phone number must be between 10 and 15 digits.');
  }

  if (data.idProofLast4 && !/^[0-9]{4}$/.test(data.idProofLast4)) {
    errors.push('idProofLast4 must be exactly 4 digits.');
  }

  const validIdTypes = ['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE', 'OTHER'];
  if (data.idProofType && !validIdTypes.includes(data.idProofType.toUpperCase())) {
    errors.push(`idProofType must be one of: ${validIdTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLoginInput(data = {}) {
  const errors = [];

  if (!data.email || !data.email.trim()) {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  if (!data.password) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateRegisterOfficerInput(data = {}) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  const name = data.fullName || data.fullname;
  if (!name || name.trim().length === 0) {
    errors.push('Full name is required.');
  }

  if (!data.badgeNo || data.badgeNo.trim().length === 0) {
    errors.push('Badge number is required.');
  }

  if (!data.rank || data.rank.trim().length === 0) {
    errors.push('Rank is required.');
  }

  const allowedRoles = ['DESK_OFFICER', 'IO', 'SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'];
  if (!data.role || !allowedRoles.includes(data.role)) {
    errors.push(`Role must be one of: ${allowedRoles.join(', ')}.`);
  }

  // Station ID is required for station-level officers
  if (['DESK_OFFICER', 'IO', 'SHO'].includes(data.role)) {
    if (!data.stationId || isNaN(parseInt(data.stationId, 10))) {
      errors.push('A valid stationId is required for this officer role.');
    }
  }

  if (data.phone && !/^\+?[0-9]{10,15}$/.test(data.phone)) {
    errors.push('Phone number must be between 10 and 15 digits.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateForgotPasswordInput(data = {}) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateResetPasswordInput(data = {}) {
  const errors = [];

  if (!data.token || !data.token.trim()) {
    errors.push('Password reset token is required.');
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateChangePasswordInput(data = {}) {
  const errors = [];

  if (!data.oldPassword) {
    errors.push('Current password is required.');
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateRegisterOfficerInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateChangePasswordInput
};