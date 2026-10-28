const pool = require('../config/db');
const firService = require('../services/fir.service');
const complaintService = require('../services/complaint.service');
const {
  validateRejectInput,
  validateInfoRequestInput,
  validateSectionsInput
} = require('../validators/fir.validator');

/**
 * GET /api/station/inbox
 * View complaints pending for the officer's police station with filters, search and KPI counts
 */
async function getStationInbox(req, res, next) {
  try {
    const stationId = req.user.stationId;
    const { status, priority, category, search, sort } = req.query;

    let query = `
      SELECT f.fir_id, f.tracking_id, f.fir_number, f.status, f.priority,
             f.incident_dt, f.submitted_at, f.location_text, f.description,
             f.rejection_reason,
             cc.category_id, cc.name AS category_name, c.full_name AS complainant_name,
             u.phone AS complainant_phone,
             (SELECT COUNT(*) FROM attachments a WHERE a.fir_id = f.fir_id) AS attachment_count
      FROM fir f
      LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
      LEFT JOIN citizens c ON f.complainant_id = c.citizen_id
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE (f.station_id = $1 OR f.station_id IS NULL)
    `;
    const params = [stationId];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND f.status = $${params.length}`;
    } else if (!status) {
      if (req.user?.role === 'SHO') {
        query += ` AND f.status IN ('SUBMITTED', 'UNDER_REVIEW', 'REGISTERED', 'PENDING_APPROVAL', 'INFO_REQUESTED')`;
      } else {
        query += ` AND f.status IN ('SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED')`;
      }
    }

    if (priority && priority !== 'ALL') {
      params.push(parseInt(priority, 10));
      query += ` AND f.priority = $${params.length}`;
    }

    if (category && category !== 'ALL') {
      params.push(category);
      query += ` AND (cc.name = $${params.length} OR f.category_id::text = $${params.length})`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(f.tracking_id) LIKE $${params.length} OR
        LOWER(COALESCE(f.fir_number, '')) LIKE $${params.length} OR
        LOWER(COALESCE(c.full_name, '')) LIKE $${params.length} OR
        LOWER(COALESCE(f.description, '')) LIKE $${params.length} OR
        LOWER(COALESCE(f.location_text, '')) LIKE $${params.length}
      )`;
    }

    if (sort === 'oldest') {
      query += ` ORDER BY f.submitted_at ASC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY f.submitted_at DESC`;
    } else if (sort === 'priority_desc') {
      query += ` ORDER BY f.priority DESC, f.submitted_at ASC`;
    } else {
      query += ` ORDER BY f.priority ASC, f.submitted_at ASC`;
    }

    const result = await pool.query(query, params);

    // Calculate real authorized station metrics for Desk Officer & SHO dashboard overviews
    const countsRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
         COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
         COUNT(*) FILTER (WHERE status = 'INFO_REQUESTED') AS info_requested,
         COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
         COUNT(*) FILTER (WHERE status = 'REGISTERED') AS registered,
         COUNT(*) FILTER (WHERE status = 'ASSIGNED') AS assigned,
         COUNT(*) FILTER (WHERE status = 'UNDER_INVESTIGATION') AS under_investigation,
         COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') AS pending_approval,
         COUNT(*) FILTER (WHERE status = 'CHARGESHEET_FILED') AS chargesheet_filed,
         COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed,
         COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED')) AS pending_action,
         COUNT(*) AS total
       FROM fir
       WHERE (station_id = $1 OR station_id IS NULL)`,
      [stationId]
    );

    const appealsRes = await pool.query(
      `SELECT COUNT(*) AS pending_appeals
       FROM fir_appeals fa
       JOIN fir f ON fa.fir_id = f.fir_id
       WHERE fa.status = 'PENDING' AND (f.station_id = $1 OR f.station_id IS NULL)`,
      [stationId]
    );

    const transfersRes = await pool.query(
      `SELECT COUNT(*) AS pending_transfers
       FROM case_transfers
       WHERE to_station_id = $1 AND status = 'PENDING'`,
      [stationId]
    );

    const cRow = countsRes.rows[0] || {};

    res.status(200).json({
      success: true,
      count: result.rows.length,
      counts: {
        submitted: parseInt(cRow.submitted || 0, 10),
        underReview: parseInt(cRow.under_review || 0, 10),
        infoRequested: parseInt(cRow.info_requested || 0, 10),
        rejected: parseInt(cRow.rejected || 0, 10),
        registered: parseInt(cRow.registered || 0, 10),
        assigned: parseInt(cRow.assigned || 0, 10),
        underInvestigation: parseInt(cRow.under_investigation || 0, 10),
        pendingApproval: parseInt(cRow.pending_approval || 0, 10),
        chargesheetFiled: parseInt(cRow.chargesheet_filed || 0, 10),
        closed: parseInt(cRow.closed || 0, 10),
        pendingAction: parseInt(cRow.pending_action || 0, 10),
        pendingAppeals: parseInt(appealsRes.rows[0]?.pending_appeals || 0, 10),
        pendingTransfers: parseInt(transfersRes.rows[0]?.pending_transfers || 0, 10),
        total: parseInt(cRow.total || 0, 10),
      },
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/firs/:id
 * Retrieve comprehensive docket particulars for reviewing officers
 */
async function getFirDetails(req, res, next) {
  try {
    const slip = await complaintService.generateAcknowledgementSlip(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: slip
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/review
 * Start review (SUBMITTED -> UNDER_REVIEW)
 */
async function startReview(req, res, next) {
  try {
    const firId = req.params.id;
    const result = await firService.startReview({
      firId,
      officerId: req.user.officerId,
      userId: req.user.userId,
      stationId: req.user.stationId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Complaint review started.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/request-info
 * Request clarification from citizen (UNDER_REVIEW -> INFO_REQUESTED)
 */
async function requestInfo(req, res, next) {
  try {
    const { isValid, errors } = validateInfoRequestInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const questionText = req.body.questionText || req.body.clarification_notes || req.body.question_text;
    const result = await firService.requestInfo({
      firId: req.params.id,
      questionText,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Clarification request sent to citizen.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/reject
 * Reject complaint (UNDER_REVIEW -> REJECTED)
 */
async function rejectComplaint(req, res, next) {
  try {
    const { isValid, errors } = validateRejectInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const rejectionReason = req.body.rejectionReason || req.body.rejection_reason;
    const result = await firService.rejectComplaint({
      firId: req.params.id,
      rejectionReason,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Complaint rejected with stated reason.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/sections
 * Tag legal sections to complaint
 */
async function tagSections(req, res, next) {
  try {
    const { isValid, errors } = validateSectionsInput(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const sectionIds = req.body.sectionIds || req.body.section_ids;
    const isCognizable = req.body.isCognizable !== undefined ? req.body.isCognizable : req.body.is_cognizable;
    const result = await firService.tagLegalSections({
      firId: req.params.id,
      sectionIds,
      isCognizable
    });

    res.status(200).json({
      success: true,
      message: 'Legal sections mapped successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/firs/:id/register
 * Formal registration (SHO only)
 */
async function registerFir(req, res, next) {
  try {
    const result = await firService.registerFir({
      firId: req.params.id,
      stationId: req.user.stationId,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'FIR formally registered and case file created.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/firs/master/legal-sections
 * List all available BNS/IPC legal sections
 */
async function listLegalSections(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT section_id, act, section_no, title, is_cognizable, is_bailable FROM legal_sections ORDER BY act, section_no`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStationInbox,
  getFirDetails,
  startReview,
  requestInfo,
  rejectComplaint,
  tagSections,
  registerFir,
  listLegalSections
};