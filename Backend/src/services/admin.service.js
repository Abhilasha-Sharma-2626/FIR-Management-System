const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

// ===================================================================
// 1. Police Stations Administration (FR-AD1)
// ===================================================================

async function getAllStations({ district, isActive, search } = {}) {
  let query = `
    SELECT 
      ps.station_id,
      ps.code,
      ps.name,
      ps.district,
      ps.address,
      ps.contact_phone,
      ps.email,
      ps.is_active,
      ps.created_at,
      COUNT(DISTINCT o.officer_id)::int AS officer_count,
      COUNT(DISTINCT f.fir_id) FILTER (WHERE f.status NOT IN ('CLOSED', 'REJECTED'))::int AS active_cases_count
    FROM police_stations ps
    LEFT JOIN officers o ON ps.station_id = o.station_id
    LEFT JOIN fir f ON ps.station_id = f.station_id
    WHERE 1=1
  `;
  const params = [];

  if (district) {
    params.push(district);
    query += ` AND ps.district ILIKE $${params.length}`;
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.push(isActive === 'true' || isActive === true);
    query += ` AND ps.is_active = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (ps.name ILIKE $${params.length} OR ps.code ILIKE $${params.length} OR ps.district ILIKE $${params.length})`;
  }

  query += ` GROUP BY ps.station_id ORDER BY ps.station_id ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function getStationById(stationId) {
  const stationRes = await pool.query(
    `SELECT ps.*,
       COUNT(DISTINCT o.officer_id)::int AS officer_count,
       COUNT(DISTINCT f.fir_id) FILTER (WHERE f.status NOT IN ('CLOSED', 'REJECTED'))::int AS active_cases_count
     FROM police_stations ps
     LEFT JOIN officers o ON ps.station_id = o.station_id
     LEFT JOIN fir f ON ps.station_id = f.station_id
     WHERE ps.station_id = $1
     GROUP BY ps.station_id`,
    [stationId]
  );

  if (stationRes.rows.length === 0) {
    const error = new Error(`Police station with ID ${stationId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const officersRes = await pool.query(
    `SELECT o.officer_id, o.badge_no, o.full_name, o.rank, u.email, u.phone, r.code AS role_code, u.is_active
     FROM officers o
     JOIN users u ON o.user_id = u.user_id
     JOIN roles r ON u.role_id = r.role_id
     WHERE o.station_id = $1
     ORDER BY o.officer_id ASC`,
    [stationId]
  );

  return {
    ...stationRes.rows[0],
    officers: officersRes.rows
  };
}

async function createStation(stationData, actorId, ipAddress = null) {
  const { code, name, district, address, contact_phone, email } = stationData;

  const existing = await pool.query('SELECT station_id FROM police_stations WHERE code = $1', [code.trim()]);
  if (existing.rows.length > 0) {
    const error = new Error(`Police station with code '${code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const insertRes = await pool.query(
    `INSERT INTO police_stations (code, name, district, address, contact_phone, email, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [code.trim().toUpperCase(), name.trim(), district.trim(), address || null, contact_phone || null, email || null]
  );
  const newStation = insertRes.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'CREATE',
    entityType: 'POLICE_STATION',
    entityId: newStation.station_id,
    oldData: null,
    newData: newStation,
    ipAddress
  });

  return newStation;
}

async function updateStation(stationId, updateData, actorId, ipAddress = null) {
  const existingRes = await pool.query('SELECT * FROM police_stations WHERE station_id = $1', [stationId]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Police station with ID ${stationId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = existingRes.rows[0];

  if (updateData.code && updateData.code.trim().toUpperCase() !== oldData.code) {
    const conflict = await pool.query('SELECT station_id FROM police_stations WHERE code = $1 AND station_id != $2', [
      updateData.code.trim().toUpperCase(),
      stationId
    ]);
    if (conflict.rows.length > 0) {
      const error = new Error(`Station code '${updateData.code}' is already assigned to another station`);
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedCode = updateData.code ? updateData.code.trim().toUpperCase() : oldData.code;
  const updatedName = updateData.name !== undefined ? updateData.name.trim() : oldData.name;
  const updatedDistrict = updateData.district !== undefined ? updateData.district.trim() : oldData.district;
  const updatedAddress = updateData.address !== undefined ? updateData.address : oldData.address;
  const updatedPhone = updateData.contact_phone !== undefined ? updateData.contact_phone : oldData.contact_phone;
  const updatedEmail = updateData.email !== undefined ? updateData.email : oldData.email;
  const updatedIsActive = updateData.is_active !== undefined ? updateData.is_active : oldData.is_active;

  const updateRes = await pool.query(
    `UPDATE police_stations
     SET code = $1, name = $2, district = $3, address = $4, contact_phone = $5, email = $6, is_active = $7
     WHERE station_id = $8
     RETURNING *`,
    [updatedCode, updatedName, updatedDistrict, updatedAddress, updatedPhone, updatedEmail, updatedIsActive, stationId]
  );
  const newData = updateRes.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'UPDATE',
    entityType: 'POLICE_STATION',
    entityId: stationId,
    oldData,
    newData,
    ipAddress
  });

  return newData;
}

async function toggleStationStatus(stationId, isActive, actorId, ipAddress = null) {
  return await updateStation(stationId, { is_active: isActive }, actorId, ipAddress);
}

// ===================================================================
// 2. Master Police Ranks Administration (FR-AD1)
// ===================================================================

async function getAllRanks({ isActive } = {}) {
  let query = 'SELECT * FROM ranks WHERE 1=1';
  const params = [];

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.push(isActive === 'true' || isActive === true);
    query += ` AND is_active = $${params.length}`;
  }

  query += ' ORDER BY hierarchy_level ASC, rank_id ASC';
  const res = await pool.query(query, params);
  return res.rows;
}

async function createRank(rankData, actorId, ipAddress = null) {
  const { code, title, hierarchy_level, description } = rankData;

  const existing = await pool.query('SELECT rank_id FROM ranks WHERE code = $1', [code.trim().toUpperCase()]);
  if (existing.rows.length > 0) {
    const error = new Error(`Rank with code '${code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const res = await pool.query(
    `INSERT INTO ranks (code, title, hierarchy_level, description, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [code.trim().toUpperCase(), title.trim(), parseInt(hierarchy_level, 10), description || null]
  );
  const newRank = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'CREATE',
    entityType: 'RANK',
    entityId: newRank.rank_id,
    oldData: null,
    newData: newRank,
    ipAddress
  });

  return newRank;
}

async function updateRank(rankId, rankData, actorId, ipAddress = null) {
  const existingRes = await pool.query('SELECT * FROM ranks WHERE rank_id = $1', [rankId]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Rank with ID ${rankId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = existingRes.rows[0];

  const updatedCode = rankData.code ? rankData.code.trim().toUpperCase() : oldData.code;
  const updatedTitle = rankData.title !== undefined ? rankData.title.trim() : oldData.title;
  const updatedLevel = rankData.hierarchy_level !== undefined ? parseInt(rankData.hierarchy_level, 10) : oldData.hierarchy_level;
  const updatedDesc = rankData.description !== undefined ? rankData.description : oldData.description;
  const updatedActive = rankData.is_active !== undefined ? rankData.is_active : oldData.is_active;

  const res = await pool.query(
    `UPDATE ranks
     SET code = $1, title = $2, hierarchy_level = $3, description = $4, is_active = $5
     WHERE rank_id = $6
     RETURNING *`,
    [updatedCode, updatedTitle, updatedLevel, updatedDesc, updatedActive, rankId]
  );
  const newData = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'UPDATE',
    entityType: 'RANK',
    entityId: rankId,
    oldData,
    newData,
    ipAddress
  });

  return newData;
}

// ===================================================================
// 3. Crime Categories Administration (FR-AD1)
// ===================================================================

async function getAllCategories({ isActive } = {}) {
  let query = `
    SELECT 
      c.category_id,
      c.name,
      c.parent_id,
      p.name AS parent_name,
      c.description,
      c.is_active,
      c.created_at,
      COUNT(f.fir_id)::int AS fir_count
    FROM crime_categories c
    LEFT JOIN crime_categories p ON c.parent_id = p.category_id
    LEFT JOIN fir f ON c.category_id = f.category_id
    WHERE 1=1
  `;
  const params = [];

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.push(isActive === 'true' || isActive === true);
    query += ` AND c.is_active = $${params.length}`;
  }

  query += ` GROUP BY c.category_id, p.name ORDER BY c.category_id ASC`;
  const res = await pool.query(query, params);
  return res.rows;
}

async function createCategory(categoryData, actorId, ipAddress = null) {
  const { name, parent_id, description } = categoryData;

  const existing = await pool.query('SELECT category_id FROM crime_categories WHERE name ILIKE $1', [name.trim()]);
  if (existing.rows.length > 0) {
    const error = new Error(`Crime category '${name}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const res = await pool.query(
    `INSERT INTO crime_categories (name, parent_id, description, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [name.trim(), parent_id || null, description || null]
  );
  const newCat = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'CREATE',
    entityType: 'CRIME_CATEGORY',
    entityId: newCat.category_id,
    oldData: null,
    newData: newCat,
    ipAddress
  });

  return newCat;
}

async function updateCategory(categoryId, categoryData, actorId, ipAddress = null) {
  const existingRes = await pool.query('SELECT * FROM crime_categories WHERE category_id = $1', [categoryId]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Crime category with ID ${categoryId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = existingRes.rows[0];

  const updatedName = categoryData.name !== undefined ? categoryData.name.trim() : oldData.name;
  const updatedParent = categoryData.parent_id !== undefined ? categoryData.parent_id : oldData.parent_id;
  const updatedDesc = categoryData.description !== undefined ? categoryData.description : oldData.description;
  const updatedActive = categoryData.is_active !== undefined ? categoryData.is_active : oldData.is_active;

  const res = await pool.query(
    `UPDATE crime_categories
     SET name = $1, parent_id = $2, description = $3, is_active = $4
     WHERE category_id = $5
     RETURNING *`,
    [updatedName, updatedParent, updatedDesc, updatedActive, categoryId]
  );
  const newData = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'UPDATE',
    entityType: 'CRIME_CATEGORY',
    entityId: categoryId,
    oldData,
    newData,
    ipAddress
  });

  return newData;
}

// ===================================================================
// 4. Legal Sections Administration (FR-AD1)
// ===================================================================

async function getAllLegalSections({ act, isCognizable, search } = {}) {
  let query = 'SELECT * FROM legal_sections WHERE 1=1';
  const params = [];

  if (act) {
    params.push(act.toUpperCase());
    query += ` AND act = $${params.length}`;
  }

  if (isCognizable !== undefined && isCognizable !== null && isCognizable !== '') {
    params.push(isCognizable === 'true' || isCognizable === true);
    query += ` AND is_cognizable = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR section_no ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  query += ' ORDER BY act ASC, section_no ASC';
  const res = await pool.query(query, params);
  return res.rows;
}

async function createLegalSection(sectionData, actorId, ipAddress = null) {
  const { act, section_no, title, is_cognizable, is_bailable, description, punishment_years } = sectionData;

  const existing = await pool.query(
    'SELECT section_id FROM legal_sections WHERE act = $1 AND section_no = $2',
    [act.trim().toUpperCase(), section_no.trim()]
  );
  if (existing.rows.length > 0) {
    const error = new Error(`Legal section '${act} ${section_no}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const res = await pool.query(
    `INSERT INTO legal_sections (act, section_no, title, is_cognizable, is_bailable, description, punishment_years, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
    [
      act.trim().toUpperCase(),
      section_no.trim(),
      title.trim(),
      is_cognizable !== undefined ? is_cognizable : true,
      is_bailable !== undefined ? is_bailable : false,
      description || null,
      punishment_years !== undefined ? punishment_years : null
    ]
  );
  const newSection = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'CREATE',
    entityType: 'LEGAL_SECTION',
    entityId: newSection.section_id,
    oldData: null,
    newData: newSection,
    ipAddress
  });

  return newSection;
}

async function updateLegalSection(sectionId, updateData, actorId, ipAddress = null) {
  const existingRes = await pool.query('SELECT * FROM legal_sections WHERE section_id = $1', [sectionId]);
  if (existingRes.rows.length === 0) {
    const error = new Error(`Legal section with ID ${sectionId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = existingRes.rows[0];

  const updatedAct = updateData.act ? updateData.act.trim().toUpperCase() : oldData.act;
  const updatedSectionNo = updateData.section_no ? updateData.section_no.trim() : oldData.section_no;
  const updatedTitle = updateData.title !== undefined ? updateData.title.trim() : oldData.title;
  const updatedCognizable = updateData.is_cognizable !== undefined ? updateData.is_cognizable : oldData.is_cognizable;
  const updatedBailable = updateData.is_bailable !== undefined ? updateData.is_bailable : oldData.is_bailable;
  const updatedDesc = updateData.description !== undefined ? updateData.description : oldData.description;
  const updatedPunishment = updateData.punishment_years !== undefined ? updateData.punishment_years : oldData.punishment_years;
  const updatedActive = updateData.is_active !== undefined ? updateData.is_active : oldData.is_active;

  const res = await pool.query(
    `UPDATE legal_sections
     SET act = $1, section_no = $2, title = $3, is_cognizable = $4, is_bailable = $5,
         description = $6, punishment_years = $7, is_active = $8
     WHERE section_id = $9
     RETURNING *`,
    [
      updatedAct,
      updatedSectionNo,
      updatedTitle,
      updatedCognizable,
      updatedBailable,
      updatedDesc,
      updatedPunishment,
      updatedActive,
      sectionId
    ]
  );
  const newData = res.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'UPDATE',
    entityType: 'LEGAL_SECTION',
    entityId: sectionId,
    oldData,
    newData,
    ipAddress
  });

  return newData;
}

// ===================================================================
// 5. User & Officer Management / Soft Deactivation (FR-AD2)
// ===================================================================

async function getAllUsers({ role, stationId, isActive, search, page = 1, limit = 50 } = {}) {
  let query = `
    SELECT 
      u.user_id,
      u.email,
      u.phone,
      u.is_active,
      u.failed_logins,
      u.locked_until,
      u.created_at,
      r.code AS role_code,
      r.description AS role_description,
      o.officer_id,
      o.badge_no,
      o.full_name AS officer_name,
      o.rank AS officer_rank,
      ps.station_id,
      ps.code AS station_code,
      ps.name AS station_name,
      c.citizen_id,
      c.full_name AS citizen_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN officers o ON u.user_id = o.user_id
    LEFT JOIN police_stations ps ON o.station_id = ps.station_id
    LEFT JOIN citizens c ON u.user_id = c.user_id
    WHERE 1=1
  `;
  const params = [];

  if (role) {
    params.push(role.toUpperCase());
    query += ` AND r.code = $${params.length}`;
  }

  if (stationId) {
    params.push(parseInt(stationId, 10));
    query += ` AND o.station_id = $${params.length}`;
  }

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.push(isActive === 'true' || isActive === true);
    query += ` AND u.is_active = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (u.email ILIKE $${params.length} OR o.full_name ILIKE $${params.length} OR o.badge_no ILIKE $${params.length} OR c.full_name ILIKE $${params.length})`;
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  params.push(parseInt(limit, 10));
  query += ` ORDER BY u.user_id ASC LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const res = await pool.query(query, params);
  return res.rows;
}

async function getUserById(userId) {
  const res = await pool.query(
    `SELECT 
      u.user_id,
      u.email,
      u.phone,
      u.is_active,
      u.failed_logins,
      u.locked_until,
      u.created_at,
      r.code AS role_code,
      r.description AS role_description,
      o.officer_id,
      o.badge_no,
      o.full_name AS officer_name,
      o.rank AS officer_rank,
      ps.station_id,
      ps.code AS station_code,
      ps.name AS station_name,
      c.citizen_id,
      c.full_name AS citizen_name,
      c.address AS citizen_address,
      c.id_proof_type,
      c.id_proof_last4
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN officers o ON u.user_id = o.user_id
    LEFT JOIN police_stations ps ON o.station_id = ps.station_id
    LEFT JOIN citizens c ON u.user_id = c.user_id
    WHERE u.user_id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return res.rows[0];
}

async function updateUserRole(userId, newRoleCode, actorId, ipAddress = null) {
  const userRes = await pool.query(
    `SELECT u.user_id, u.email, r.code AS current_role
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     WHERE u.user_id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const targetUser = userRes.rows[0];

  const roleRes = await pool.query('SELECT role_id, code FROM roles WHERE code = $1', [newRoleCode.toUpperCase()]);
  if (roleRes.rows.length === 0) {
    const error = new Error(`Role '${newRoleCode}' does not exist`);
    error.statusCode = 400;
    throw error;
  }
  const newRole = roleRes.rows[0];

  const updateRes = await pool.query(
    `UPDATE users
     SET role_id = $1
     WHERE user_id = $2
     RETURNING user_id, email, role_id`,
    [newRole.role_id, userId]
  );

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'ROLE_CHANGE',
    entityType: 'USER',
    entityId: userId,
    oldData: { role: targetUser.current_role },
    newData: { role: newRole.code },
    ipAddress
  });

  return {
    userId: updateRes.rows[0].user_id,
    email: updateRes.rows[0].email,
    newRole: newRole.code
  };
}

async function updateOfficerStation(officerId, newStationId, actorId, ipAddress = null) {
  const officerRes = await pool.query(
    `SELECT o.officer_id, o.full_name, o.station_id AS current_station_id, ps.code AS current_station_code
     FROM officers o
     LEFT JOIN police_stations ps ON o.station_id = ps.station_id
     WHERE o.officer_id = $1`,
    [officerId]
  );

  if (officerRes.rows.length === 0) {
    const error = new Error(`Officer with ID ${officerId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const officer = officerRes.rows[0];

  const stationRes = await pool.query(
    'SELECT station_id, code, name, is_active FROM police_stations WHERE station_id = $1',
    [newStationId]
  );
  if (stationRes.rows.length === 0) {
    const error = new Error(`Police station with ID ${newStationId} not found`);
    error.statusCode = 404;
    throw error;
  }
  if (!stationRes.rows[0].is_active) {
    const error = new Error(`Cannot transfer officer to an inactive police station`);
    error.statusCode = 400;
    throw error;
  }

  const updateRes = await pool.query(
    `UPDATE officers
     SET station_id = $1
     WHERE officer_id = $2
     RETURNING officer_id, full_name, badge_no, station_id`,
    [newStationId, officerId]
  );

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'STATION_TRANSFER',
    entityType: 'OFFICER',
    entityId: officerId,
    oldData: { station_id: officer.current_station_id, station_code: officer.current_station_code },
    newData: { station_id: newStationId, station_code: stationRes.rows[0].code },
    ipAddress
  });

  return updateRes.rows[0];
}

async function toggleUserStatus(userId, isActive, actorId, ipAddress = null) {
  if (parseInt(userId, 10) === parseInt(actorId, 10) && !isActive) {
    const error = new Error('Security Guard: Administrators cannot deactivate their own account');
    error.statusCode = 400;
    throw error;
  }

  const userRes = await pool.query('SELECT user_id, email, is_active FROM users WHERE user_id = $1', [userId]);
  if (userRes.rows.length === 0) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = userRes.rows[0];

  const updateRes = await pool.query(
    `UPDATE users
     SET is_active = $1
     WHERE user_id = $2
     RETURNING user_id, email, is_active`,
    [isActive, userId]
  );
  const newData = updateRes.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'USER',
    entityId: userId,
    oldData: { is_active: oldData.is_active },
    newData: { is_active: newData.is_active },
    ipAddress
  });

  return newData;
}

async function unlockUserAccount(userId, actorId, ipAddress = null) {
  const userRes = await pool.query('SELECT user_id, email, failed_logins, locked_until FROM users WHERE user_id = $1', [userId]);
  if (userRes.rows.length === 0) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const updateRes = await pool.query(
    `UPDATE users
     SET failed_logins = 0, locked_until = NULL
     WHERE user_id = $1
     RETURNING user_id, email, failed_logins, locked_until`,
    [userId]
  );

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'USER_UNLOCKED',
    entityType: 'USER',
    entityId: userId,
    oldData: { locked_until: userRes.rows[0].locked_until },
    newData: { locked_until: null },
    ipAddress
  });

  return updateRes.rows[0];
}

// ===================================================================
// 6. SLA Configuration & Breach Monitoring (FR-AD3)
// ===================================================================

async function getAllSlaConfigs() {
  const res = await pool.query(
    `SELECT 
      s.sla_id,
      s.config_key,
      s.title,
      s.threshold_hours,
      s.escalation_role,
      s.description,
      s.updated_at,
      u.email AS updated_by_email
    FROM sla_configs s
    LEFT JOIN users u ON s.updated_by = u.user_id
    ORDER BY s.sla_id ASC`
  );
  return res.rows;
}

async function updateSlaConfig(configKey, updateData, actorId, ipAddress = null) {
  const key = configKey.trim().toUpperCase();
  const existingRes = await pool.query('SELECT * FROM sla_configs WHERE config_key = $1', [key]);

  if (existingRes.rows.length === 0) {
    const error = new Error(`SLA configuration for '${configKey}' not found`);
    error.statusCode = 404;
    throw error;
  }
  const oldData = existingRes.rows[0];

  const updatedHours = updateData.thresholdHours !== undefined ? parseInt(updateData.thresholdHours, 10) : oldData.threshold_hours;
  const updatedEscalation = updateData.escalationRole !== undefined ? updateData.escalationRole : oldData.escalation_role;
  const updatedTitle = updateData.title !== undefined ? updateData.title.trim() : oldData.title;
  const updatedDesc = updateData.description !== undefined ? updateData.description : oldData.description;

  const updateRes = await pool.query(
    `UPDATE sla_configs
     SET threshold_hours = $1, escalation_role = $2, title = $3, description = $4,
         updated_by = $5, updated_at = now()
     WHERE config_key = $6
     RETURNING *`,
    [updatedHours, updatedEscalation, updatedTitle, updatedDesc, actorId, key]
  );
  const newData = updateRes.rows[0];

  await logAuditEvent({
    actorId,
    actorRole: 'ADMIN',
    action: 'SLA_CONFIG_UPDATE',
    entityType: 'SLA_CONFIG',
    entityId: newData.sla_id,
    oldData,
    newData,
    ipAddress
  });

  return newData;
}

async function getSlaBreaches() {
  // 1. Fetch current configured SLA thresholds
  const configsRes = await pool.query('SELECT config_key, threshold_hours, escalation_role FROM sla_configs');
  const configs = {};
  configsRes.rows.forEach(r => {
    configs[r.config_key] = {
      hours: r.threshold_hours,
      role: r.escalation_role
    };
  });

  const reviewHours = configs['COMPLAINT_REVIEW']?.hours || 24;
  const reviewRole = configs['COMPLAINT_REVIEW']?.role || 'SHO';

  const assignHours = configs['IO_ASSIGNMENT']?.hours || 48;
  const assignRole = configs['IO_ASSIGNMENT']?.role || 'SHO';

  const staleHours = configs['STALE_CASE']?.hours || 360;
  const staleRole = configs['STALE_CASE']?.role || 'SUPERVISOR';

  // 2. Query breaches in SUBMITTED complaints exceeding review SLA
  const pendingComplaintsRes = await pool.query(
    `SELECT 
       f.fir_id,
       f.tracking_id,
       f.status,
       f.submitted_at,
       ps.code AS station_code,
       ps.name AS station_name,
       ROUND(EXTRACT(EPOCH FROM (now() - f.submitted_at)) / 3600, 1) AS hours_elapsed,
       ROUND(EXTRACT(EPOCH FROM (now() - f.submitted_at)) / 3600 - $1, 1) AS hours_overdue
     FROM fir f
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     WHERE f.status = 'SUBMITTED'
       AND f.submitted_at < (now() - ($1 || ' hours')::interval)
     ORDER BY f.submitted_at ASC`,
    [reviewHours]
  );

  // 3. Query REGISTERED FIRs waiting for IO assignment exceeding assignment SLA
  const pendingIoRes = await pool.query(
    `SELECT 
       f.fir_id,
       f.fir_number,
       f.status,
       f.registered_at,
       ps.code AS station_code,
       ps.name AS station_name,
       ROUND(EXTRACT(EPOCH FROM (now() - f.registered_at)) / 3600, 1) AS hours_elapsed,
       ROUND(EXTRACT(EPOCH FROM (now() - f.registered_at)) / 3600 - $1, 1) AS hours_overdue
     FROM fir f
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     WHERE f.status = 'REGISTERED'
       AND f.registered_at < (now() - ($1 || ' hours')::interval)
     ORDER BY f.registered_at ASC`,
    [assignHours]
  );

  // 4. Query Stale Cases (active cases with no diary update in > staleHours)
  const staleCasesRes = await pool.query(
    `SELECT 
       c.case_id,
       f.fir_number,
       f.status,
       c.current_io_id,
       o.full_name AS io_name,
       ps.code AS station_code,
       COALESCE(MAX(cu.created_at), c.created_at) AS last_update_at,
       ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(MAX(cu.created_at), c.created_at))) / 3600, 1) AS hours_inactive,
       ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(MAX(cu.created_at), c.created_at))) / 3600 - $1, 1) AS hours_overdue
     FROM cases c
     JOIN fir f ON c.fir_id = f.fir_id
     LEFT JOIN officers o ON c.current_io_id = o.officer_id
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     LEFT JOIN case_updates cu ON c.case_id = cu.case_id
     WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL', 'REOPENED')
     GROUP BY c.case_id, f.fir_number, f.status, c.current_io_id, o.full_name, ps.code, c.created_at
     HAVING COALESCE(MAX(cu.created_at), c.created_at) < (now() - ($1 || ' hours')::interval)
     ORDER BY last_update_at ASC`,
    [staleHours]
  );

  return {
    summary: {
      totalBreaches: pendingComplaintsRes.rows.length + pendingIoRes.rows.length + staleCasesRes.rows.length,
      complaintReviewBreaches: pendingComplaintsRes.rows.length,
      ioAssignmentBreaches: pendingIoRes.rows.length,
      staleCaseBreaches: staleCasesRes.rows.length
    },
    thresholds: {
      complaintReviewHours: reviewHours,
      complaintEscalation: reviewRole,
      ioAssignmentHours: assignHours,
      ioEscalation: assignRole,
      staleCaseHours: staleHours,
      staleEscalation: staleRole
    },
    breaches: {
      complaintReview: pendingComplaintsRes.rows,
      ioAssignment: pendingIoRes.rows,
      staleCases: staleCasesRes.rows
    }
  };
}

module.exports = {
  // Stations
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  toggleStationStatus,

  // Ranks
  getAllRanks,
  createRank,
  updateRank,

  // Categories
  getAllCategories,
  createCategory,
  updateCategory,

  // Legal Sections
  getAllLegalSections,
  createLegalSection,
  updateLegalSection,

  // Users & Officers
  getAllUsers,
  getUserById,
  updateUserRole,
  updateOfficerStation,
  toggleUserStatus,
  unlockUserAccount,

  // SLA
  getAllSlaConfigs,
  updateSlaConfig,
  getSlaBreaches
};
