const pool = require('../config/db');
const complaintService = require('../services/complaint.service');
const { validateComplaintInput, validatePersonInput } = require('../validators/complaint.validator');
const { computeFileSha256 } = require('../utils/file.util');

async function createComplaint(req, res, next) {
  try {
    const isDraft = !req.body.submitImmediately;
    const { isValid, errors } = validateComplaintInput(req.body, isDraft);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const citizenId = req.user.citizenId;
    if (!citizenId) {
      return res.status(403).json({
        success: false,
        message: 'User is not linked to a citizen profile.'
      });
    }

    const newComplaint = await complaintService.createComplaint({
      citizenId,
      userId: req.user.userId,
      data: req.body,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: isDraft ? 'Complaint saved as draft.' : 'Complaint submitted successfully.',
      data: newComplaint
    });
  } catch (error) {
    next(error);
  }
}

async function submitDraft(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;
    const result = await complaintService.submitDraftComplaint({
      firId,
      citizenId,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getMyComplaints(req, res, next) {
  try {
    const citizenId = req.user.citizenId;
    const result = await pool.query(
      `SELECT f.*, cc.name AS category_name, ps.name AS station_name
       FROM fir f
       LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       WHERE f.complainant_id = $1
       ORDER BY f.created_at DESC`,
      [citizenId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

async function getComplaintDetails(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;
    const firRes = await pool.query(
      `SELECT f.*, cc.name AS category_name, ps.name AS station_name
       FROM fir f
       LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       WHERE f.fir_id = $1 AND f.complainant_id = $2`,
      [firId, citizenId]
    );

    if (firRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const personsRes = await pool.query(
      `SELECT * FROM fir_persons WHERE fir_id = $1`,
      [firId]
    );
    const attachRes = await pool.query(
      `SELECT attachment_id, file_name, mime_type, size_bytes, sha256, uploaded_at FROM attachments WHERE fir_id = $1`,
      [firId]
    );
    const historyRes = await pool.query(
      `SELECT from_state, to_state, note, created_at FROM case_status_history WHERE fir_id = $1 ORDER BY created_at ASC`,
      [firId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...firRes.rows[0],
        persons: personsRes.rows,
        attachments: attachRes.rows,
        timeline: historyRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
}

async function uploadAttachment(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    const firCheck = await pool.query(
      `SELECT status FROM fir WHERE fir_id = $1 AND complainant_id = $2`,
      [firId, citizenId]
    );

    if (firCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const sha256 = await computeFileSha256(req.file.path);
    const insertRes = await pool.query(
      `INSERT INTO attachments (fir_id, uploaded_by, file_name, mime_type, size_bytes, sha256, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING attachment_id, file_name, mime_type, size_bytes, sha256, uploaded_at`,
      [
        firId,
        req.user.userId,
        req.file.originalname,
        req.file.mimetype || req.file.mime_type,
        req.file.size,
        sha256,
        req.file.path
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded and cryptographically verified.',
      data: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function trackComplaint(req, res, next) {
  try {
    const trackingId = req.params.trackingId;
    const complaint = await complaintService.getComplaintByTrackingId(trackingId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No record found for tracking ID: ${trackingId}`
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
}

async function respondToInfo(req, res, next) {
  try {
    const firId = req.params.id;
    const { responseText } = req.body;

    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required.'
      });
    }

    const updated = await complaintService.respondToInfoRequest({
      firId,
      citizenId: req.user.citizenId,
      userId: req.user.userId,
      responseText,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Clarification submitted to station desk.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  submitDraft,
  getMyComplaints,
  getComplaintDetails,
  uploadAttachment,
  trackComplaint,
  respondToInfo
};