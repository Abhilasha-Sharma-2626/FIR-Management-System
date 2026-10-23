function validateComplaintInput(data, isDraft = false) {
  const errors = [];
  if (!isDraft) {
    if (!data.incidentDt) {
      errors.push('Incident date and time (incidentDt) is required.');
    } else {
      const dt = new Date(data.incidentDt);
      if (isNaN(dt.getTime())) {
        errors.push('Invalid incident date/time format.');
      } else if (dt > new Date()) {
        errors.push('Incident date cannot be in the future.');
      }
    }

    if (!data.locationText || data.locationText.trim().length < 5) {
      errors.push('Incident location must be at least 5 characters long.');
    }

    if (!data.descriptionText || data.descriptionText.trim().length < 15) {
      errors.push('Incident description must be at least 15 characters long.');
    }

    if (!data.categoryId) {
      errors.push('Crime category (categoryId) is required.');
    }
  } else {
    if (!data.descriptionText && !data.locationText) {
      errors.push('Draft must have either a description or location text.');
    }
  }

  if (data.priority !== undefined && ![1, 2, 3].includes(Number(data.priority))) {
    errors.push('Priority must be 1 (High), 2 (Medium), or 3 (Low).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validatePersonInput(person) {
  const errors = [];
  const allowedRoles = ['ACCUSED', 'WITNESS', 'VICTIM'];

  if (!person.fullName || person.fullName.trim().length === 0) {
    errors.push('Full name is required.');
  }

  if (!person.personRole || !allowedRoles.includes(person.personRole.toUpperCase())) {
    errors.push(`Person role must be one of: ${allowedRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUpdateDraftInput(data) {
  const errors = [];

  if (data.incidentDt) {
    const dt = new Date(data.incidentDt);
    if (isNaN(dt.getTime())) {
      errors.push('Invalid incident date/time format.');
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dt > today) {
        errors.push('Incident date cannot be in the future.');
      }
    }
  }

  if (data.locationText !== undefined && typeof data.locationText === 'string' && data.locationText.trim().length > 0 && data.locationText.trim().length < 5) {
    errors.push('Incident location must be at least 5 characters long.');
  }

  if (data.descriptionText !== undefined && typeof data.descriptionText === 'string' && data.descriptionText.trim().length > 0 && data.descriptionText.trim().length < 15) {
    errors.push('Incident description must be at least 15 characters long.');
  }

  if (data.priority !== undefined && ![1, 2, 3].includes(Number(data.priority))) {
    errors.push('Priority must be 1 (High), 2 (Medium), or 3 (Low).');
  }

  if (Array.isArray(data.persons)) {
    data.persons.forEach((p, idx) => {
      const pValidation = validatePersonInput(p);
      if (!pValidation.isValid) {
        errors.push(`Person at index ${idx}: ${pValidation.errors.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDuplicateCheckInput(data) {
  const errors = [];

  if (!data.categoryId) {
    errors.push('Crime category (categoryId) is required.');
  }

  if (!data.locationText || typeof data.locationText !== 'string' || data.locationText.trim().length < 3) {
    errors.push('Location text is required and must be at least 3 characters.');
  }

  if (!data.incidentDt) {
    errors.push('Incident date (incidentDt) is required.');
  } else {
    const dt = new Date(data.incidentDt);
    if (isNaN(dt.getTime())) {
      errors.push('Invalid incident date format.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateComplaintInput,
  validatePersonInput,
  validateUpdateDraftInput,
  validateDuplicateCheckInput
};