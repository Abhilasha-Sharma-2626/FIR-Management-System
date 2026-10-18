function validateAssignInput(data) {
  const errors = [];
  if (!data.officerId || isNaN(parseInt(data.officerId, 10))) {
    errors.push('A valid officerId is required for assignment.');
  }
  return { isValid: errors.length === 0, errors };
}

function validateUpdateInput(data) {
  const errors = [];
  const validTypes = ['STATEMENT', 'SITE_VISIT', 'ARREST', 'SEARCH', 'FORENSIC', 'GENERAL'];

  if (!data.updateType || !validTypes.includes(data.updateType.toUpperCase())) {
    errors.push(`updateType must be one of: ${validTypes.join(', ')}`);
  }

  if (!data.body || data.body.trim().length < 10) {
    errors.push('Update body must be at least 10 characters long.');
  }

  return { isValid: errors.length === 0, errors };
}

function validateFinalReportInput(data) {
  const errors = [];
  const validTypes = ['CHARGESHEET', 'CLOSURE'];

  if (!data.reportType || !validTypes.includes(data.reportType.toUpperCase())) {
    errors.push(`reportType must be either 'CHARGESHEET' or 'CLOSURE'.`);
  }

  if (!data.summary || data.summary.trim().length < 15) {
    errors.push('Report summary must be at least 15 characters long.');
  }

  return { isValid: errors.length === 0, errors };
}

function validateReviewReportInput(data) {
  const errors = [];
  const validDecisions = ['APPROVE', 'SEND_BACK'];

  if (!data.decision || !validDecisions.includes(data.decision.toUpperCase())) {
    errors.push(`decision must be either 'APPROVE' or 'SEND_BACK'.`);
  }

  return { isValid: errors.length === 0, errors };
}

function validateReopenInput(data) {
  const errors = [];
  if (!data.reason || data.reason.trim().length < 10) {
    errors.push('Reopen reason must be at least 10 characters long.');
  }
  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateAssignInput,
  validateUpdateInput,
  validateFinalReportInput,
  validateReviewReportInput,
  validateReopenInput
};
