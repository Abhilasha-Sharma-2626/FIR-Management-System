/**
 * Validation rules for Evidence Management & Chain of Custody
 * Aligns with PROJECT_CONTEXT.md §5.5 (FR-E1 - FR-E6)
 */

const VALID_EVIDENCE_TYPES = [
  'PHYSICAL',
  'DIGITAL',
  'DOCUMENT',
  'BIOLOGICAL',
  'WEAPON',
  'OTHER'
];

const VALID_CUSTODY_STATUSES = [
  'COLLECTED',
  'IN_STORAGE',
  'IN_LAB',
  'PRODUCED_IN_COURT',
  'RETURNED',
  'DESTROYED'
];

function validateAddEvidenceInput(data = {}) {
  const errors = [];

  const evidenceType = (data.evidenceType || '').toUpperCase().trim();
  if (!evidenceType || !VALID_EVIDENCE_TYPES.includes(evidenceType)) {
    errors.push(`evidenceType must be one of: ${VALID_EVIDENCE_TYPES.join(', ')}.`);
  }

  if (!data.description || data.description.trim().length < 5) {
    errors.push('Description must be at least 5 characters long.');
  }

  if (data.collectedAt) {
    const dt = new Date(data.collectedAt);
    if (isNaN(dt.getTime())) {
      errors.push('collectedAt must be a valid timestamp.');
    } else if (dt > new Date()) {
      errors.push('collectedAt cannot be in the future.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateTransferCustodyInput(data = {}) {
  const errors = [];

  const toHolderId = parseInt(data.toHolderId, 10);
  if (!toHolderId || isNaN(toHolderId)) {
    errors.push('A valid destination officer ID (toHolderId) is required.');
  }

  if (!data.purpose || data.purpose.trim().length < 3) {
    errors.push('Transfer purpose is required (at least 3 characters).');
  }

  const newStatus = (data.newStatus || '').toUpperCase().trim();
  if (!newStatus || !VALID_CUSTODY_STATUSES.includes(newStatus)) {
    errors.push(`newStatus must be one of: ${VALID_CUSTODY_STATUSES.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  VALID_EVIDENCE_TYPES,
  VALID_CUSTODY_STATUSES,
  validateAddEvidenceInput,
  validateTransferCustodyInput
};
