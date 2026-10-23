/**
 * Validators for Rejection Appeal submission and supervisory review
 */

function validateAppealSubmission(data = {}) {
  const errors = [];
  const { reason } = data;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
    errors.push('Appeal reason is required and must be at least 10 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateAppealReview(data = {}) {
  const errors = [];
  const { appealId, decision, reviewNotes } = data;

  if (!appealId || isNaN(parseInt(appealId, 10)) || parseInt(appealId, 10) <= 0) {
    errors.push('Valid appealId (positive integer) is required.');
  }

  const validDecisions = ['ACCEPT', 'REJECT'];
  if (!decision || typeof decision !== 'string' || !validDecisions.includes(decision.toUpperCase())) {
    errors.push("Decision is required and must be either 'ACCEPT' or 'REJECT'.");
  }

  if (!reviewNotes || typeof reviewNotes !== 'string' || reviewNotes.trim().length < 5) {
    errors.push('Review notes are required and must be at least 5 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateAppealSubmission,
  validateAppealReview
};
