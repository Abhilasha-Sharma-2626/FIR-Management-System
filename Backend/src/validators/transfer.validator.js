/**
 * Validators for Inter-Station Case Transfer and Zero FIR Flow
 */

function validateTransferInitiation(data = {}) {
  const errors = [];
  const { toStationId, reason } = data;

  if (!toStationId || isNaN(parseInt(toStationId, 10)) || parseInt(toStationId, 10) <= 0) {
    errors.push('Valid target police station ID (toStationId) is required.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
    errors.push('Transfer reason is required and must be at least 10 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateTransferResolution(data = {}, isReject = false) {
  const errors = [];
  const { remarks } = data;

  if (isReject) {
    if (!remarks || typeof remarks !== 'string' || remarks.trim().length < 5) {
      errors.push('Rejection reason / remarks are required and must be at least 5 characters long.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTransferInitiation,
  validateTransferResolution
};
