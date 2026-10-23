const VALID_VERDICTS = ['CONVICTED', 'ACQUITTED', 'COMPOUNDED', 'QUASHED', 'DISCHARGED'];

function validateCourtOutcome(data) {
  const errors = [];

  if (!data.courtName || typeof data.courtName !== 'string' || data.courtName.trim().length < 3) {
    errors.push('Court name is required and must be at least 3 characters.');
  } else if (data.courtName.trim().length > 120) {
    errors.push('Court name must not exceed 120 characters.');
  }

  if (data.caseCourtNumber && typeof data.caseCourtNumber === 'string' && data.caseCourtNumber.trim().length > 60) {
    errors.push('Case court number must not exceed 60 characters.');
  }

  if (!data.verdict || typeof data.verdict !== 'string' || !VALID_VERDICTS.includes(data.verdict.toUpperCase().trim())) {
    errors.push(`Verdict must be one of: ${VALID_VERDICTS.join(', ')}`);
  }

  if (!data.judgmentDate) {
    errors.push('Judgment date is required.');
  } else {
    const parsedDate = new Date(data.judgmentDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Judgment date must be a valid date.');
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsedDate > today) {
        errors.push('Judgment date cannot be in the future.');
      }
    }
  }

  if (data.judgeName && typeof data.judgeName === 'string' && data.judgeName.trim().length > 120) {
    errors.push('Judge name must not exceed 120 characters.');
  }

  const normalizedVerdict = data.verdict ? data.verdict.toUpperCase().trim() : '';
  if (normalizedVerdict === 'CONVICTED') {
    if (!data.sentenceDetails || typeof data.sentenceDetails !== 'string' || data.sentenceDetails.trim().length < 5) {
      errors.push('Sentence details are required for conviction verdicts (at least 5 characters).');
    }
  }

  if (data.fineAmount !== undefined && data.fineAmount !== null && data.fineAmount !== '') {
    const fineNum = Number(data.fineAmount);
    if (isNaN(fineNum) || fineNum < 0) {
      errors.push('Fine amount must be a non-negative number.');
    }
  }

  if (!data.remarks || typeof data.remarks !== 'string' || data.remarks.trim().length < 10) {
    errors.push('Remarks are required and must be at least 10 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateCourtOutcome,
  VALID_VERDICTS
};
