const adminService = require('../services/admin.service');

// ===================================================================
// Police Stations
// ===================================================================

async function getStations(req, res, next) {
  try {
    const stations = await adminService.getAllStations(req.query);
    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    next(error);
  }
}

async function getStationById(req, res, next) {
  try {
    const station = await adminService.getStationById(req.params.id);
    res.status(200).json({
      success: true,
      data: station
    });
  } catch (error) {
    next(error);
  }
}

async function createStation(req, res, next) {
  try {
    const station = await adminService.createStation(req.body, req.user.userId, req.ip);
    res.status(201).json({
      success: true,
      message: `Police station '${station.name}' created successfully`,
      data: station
    });
  } catch (error) {
    next(error);
  }
}

async function updateStation(req, res, next) {
  try {
    const station = await adminService.updateStation(req.params.id, req.body, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: `Police station updated successfully`,
      data: station
    });
  } catch (error) {
    next(error);
  }
}

async function toggleStationStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const station = await adminService.toggleStationStatus(req.params.id, isActive, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: `Police station status changed to ${isActive ? 'Active' : 'Inactive'}`,
      data: station
    });
  } catch (error) {
    next(error);
  }
}

// ===================================================================
// Ranks
// ===================================================================

async function getRanks(req, res, next) {
  try {
    const ranks = await adminService.getAllRanks(req.query);
    res.status(200).json({
      success: true,
      count: ranks.length,
      data: ranks
    });
  } catch (error) {
    next(error);
  }
}

async function createRank(req, res, next) {
  try {
    const rank = await adminService.createRank(req.body, req.user.userId, req.ip);
    res.status(201).json({
      success: true,
      message: `Rank '${rank.title}' created successfully`,
      data: rank
    });
  } catch (error) {
    next(error);
  }
}

async function updateRank(req, res, next) {
  try {
    const rank = await adminService.updateRank(req.params.id, req.body, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: 'Rank updated successfully',
      data: rank
    });
  } catch (error) {
    next(error);
  }
}

// ===================================================================
// Categories
// ===================================================================

async function getCategories(req, res, next) {
  try {
    const categories = await adminService.getAllCategories(req.query);
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await adminService.createCategory(req.body, req.user.userId, req.ip);
    res.status(201).json({
      success: true,
      message: `Crime category '${category.name}' created successfully`,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: 'Crime category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
}

// ===================================================================
// Legal Sections
// ===================================================================

async function getLegalSections(req, res, next) {
  try {
    const sections = await adminService.getAllLegalSections(req.query);
    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    next(error);
  }
}

async function createLegalSection(req, res, next) {
  try {
    const section = await adminService.createLegalSection(req.body, req.user.userId, req.ip);
    res.status(201).json({
      success: true,
      message: `Legal section '${section.act} ${section.section_no}' created successfully`,
      data: section
    });
  } catch (error) {
    next(error);
  }
}

async function updateLegalSection(req, res, next) {
  try {
    const section = await adminService.updateLegalSection(req.params.id, req.body, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: 'Legal section updated successfully',
      data: section
    });
  } catch (error) {
    next(error);
  }
}

// ===================================================================
// Users & Officers
// ===================================================================

async function getUsers(req, res, next) {
  try {
    const users = await adminService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const result = await adminService.updateUserRole(req.params.id, req.body.roleCode, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: `User role changed to '${result.newRole}'`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function updateOfficerStation(req, res, next) {
  try {
    const officer = await adminService.updateOfficerStation(req.params.id, req.body.stationId, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: 'Officer transferred to new police station successfully',
      data: officer
    });
  } catch (error) {
    next(error);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const user = await adminService.toggleUserStatus(req.params.id, isActive, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'reactivated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function unlockUserAccount(req, res, next) {
  try {
    const user = await adminService.unlockUserAccount(req.params.id, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: 'User account unlocked successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

// ===================================================================
// SLA Configuration & Monitoring
// ===================================================================

async function getSlaConfigs(req, res, next) {
  try {
    const configs = await adminService.getAllSlaConfigs();
    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs
    });
  } catch (error) {
    next(error);
  }
}

async function updateSlaConfig(req, res, next) {
  try {
    const config = await adminService.updateSlaConfig(req.params.key, req.body, req.user.userId, req.ip);
    res.status(200).json({
      success: true,
      message: `SLA configuration for '${config.config_key}' updated successfully`,
      data: config
    });
  } catch (error) {
    next(error);
  }
}

async function getSlaBreaches(req, res, next) {
  try {
    const breaches = await adminService.getSlaBreaches();
    res.status(200).json({
      success: true,
      data: breaches
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Stations
  getStations,
  getStationById,
  createStation,
  updateStation,
  toggleStationStatus,

  // Ranks
  getRanks,
  createRank,
  updateRank,

  // Categories
  getCategories,
  createCategory,
  updateCategory,

  // Legal Sections
  getLegalSections,
  createLegalSection,
  updateLegalSection,

  // Users & Officers
  getUsers,
  getUserById,
  updateUserRole,
  updateOfficerStation,
  toggleUserStatus,
  unlockUserAccount,

  // SLA
  getSlaConfigs,
  updateSlaConfig,
  getSlaBreaches
};
