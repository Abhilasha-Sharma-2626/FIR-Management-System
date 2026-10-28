function validateRejectInput(data = {}) {
  const reason = data.rejectionReason || data.rejection_reason;
  const errors = [];
  if (!reason || reason.trim().length < 10) {
    errors.push('Rejection reason must be at least 10 characters long.');
  }
  return { isValid: errors.length === 0, errors };
}

function validateInfoRequestInput(data = {}) {
  const text = data.questionText || data.clarification_notes || data.question_text;
  const errors = [];
  if (!text || text.trim().length < 5) {
    errors.push('Question or clarification text must be at least 5 characters long.');
  }
  return { isValid: errors.length === 0, errors };
}

function validateSectionsInput(data = {}) {
  const sections = data.sectionIds || data.section_ids;
  const errors = [];
  if (!Array.isArray(sections) || sections.length === 0) {
    errors.push('At least one section ID must be provided in sectionIds array.');
  }
  return { isValid: errors.length === 0, errors };
}

module.exports = { validateRejectInput, validateInfoRequestInput, validateSectionsInput };