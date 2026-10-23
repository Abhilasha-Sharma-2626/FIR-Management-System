const ALLOWED_ROLES = ['CITIZEN', 'DESK_OFFICER', 'IO', 'SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'];

function validateStation(req, res, next) {
  const { code, name, district } = req.body;
  const errors = [];

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Station code is required (e.g. CPS-01)');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Station name is required');
  }
  if (!district || typeof district !== 'string' || !district.trim()) {
    errors.push('District is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(', ') });
  }
  next();
}

function validateStationUpdate(req, res, next) {
  const { code, name, district, address, contact_phone, email, is_active } = req.body;
  if (
    code === undefined &&
    name === undefined &&
    district === undefined &&
    address === undefined &&
    contact_phone === undefined &&
    email === undefined &&
    is_active === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for station update'
    });
  }
  next();
}

function validateRank(req, res, next) {
  const { code, title, hierarchy_level } = req.body;
  const errors = [];

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Rank code is required (e.g. SI, INSP, DSP)');
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Rank title is required');
  }
  if (hierarchy_level === undefined || isNaN(parseInt(hierarchy_level, 10)) || parseInt(hierarchy_level, 10) < 1) {
    errors.push('hierarchy_level must be an integer >= 1');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(', ') });
  }
  next();
}

function validateCategory(req, res, next) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Crime category name is required'
    });
  }
  next();
}

function validateLegalSection(req, res, next) {
  const { act, section_no, title } = req.body;
  const errors = [];

  if (!act || typeof act !== 'string' || !act.trim()) {
    errors.push('Act is required (e.g. IPC, BNS, NDPS, POCSO)');
  }
  if (!section_no || typeof section_no !== 'string' || !section_no.trim()) {
    errors.push('Section number is required (e.g. 302, 379, 420)');
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title/offence description is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors.join(', ') });
  }
  next();
}

function validateRoleUpdate(req, res, next) {
  const { roleCode } = req.body;
  if (!roleCode || !ALLOWED_ROLES.includes(roleCode)) {
    return res.status(400).json({
      success: false,
      message: `Invalid roleCode: '${roleCode}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
    });
  }
  next();
}

function validateStationTransfer(req, res, next) {
  const { stationId } = req.body;
  const parsedId = parseInt(stationId, 10);
  if (isNaN(parsedId) || parsedId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Valid stationId integer is required'
    });
  }
  next();
}

function validateUserStatus(req, res, next) {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive boolean flag is required'
    });
  }
  next();
}

function validateSlaConfigUpdate(req, res, next) {
  const { thresholdHours, escalationRole, description, title } = req.body;
  if (thresholdHours !== undefined) {
    const hours = parseInt(thresholdHours, 10);
    if (isNaN(hours) || hours < 1) {
      return res.status(400).json({
        success: false,
        message: 'thresholdHours must be an integer >= 1'
      });
    }
  }
  if (escalationRole !== undefined && !ALLOWED_ROLES.includes(escalationRole)) {
    return res.status(400).json({
      success: false,
      message: `Invalid escalationRole: '${escalationRole}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
    });
  }
  if (
    thresholdHours === undefined &&
    escalationRole === undefined &&
    description === undefined &&
    title === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'At least one SLA configuration field must be provided'
    });
  }
  next();
}

module.exports = {
  validateStation,
  validateStationUpdate,
  validateRank,
  validateCategory,
  validateLegalSection,
  validateRoleUpdate,
  validateStationTransfer,
  validateUserStatus,
  validateSlaConfigUpdate,
  ALLOWED_ROLES
};
