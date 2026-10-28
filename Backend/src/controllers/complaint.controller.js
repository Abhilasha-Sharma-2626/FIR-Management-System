const pool = require('../config/db');
const complaintService = require('../services/complaint.service');
const {
  validateComplaintInput,
  validatePersonInput,
  validateUpdateDraftInput,
  validateDuplicateCheckInput
} = require('../validators/complaint.validator');
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
      `SELECT f.*, cc.name AS category_name, ps.name AS station_name,
              c.case_id, o.full_name AS io_name, o.badge_no AS io_badge, o.rank AS io_rank,
              (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.case_id) AS evidence_count,
              (SELECT COUNT(*) FROM attachments a WHERE a.fir_id = f.fir_id) AS attachment_count
       FROM fir f
       LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       LEFT JOIN cases c ON f.fir_id = c.fir_id
       LEFT JOIN officers o ON c.current_io_id = o.officer_id
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
    const responseText = req.body.responseText || req.body.response_text;

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

/**
 * PUT /api/complaints/:id
 * Citizen edits an existing draft complaint (FR-C3)
 */
async function updateDraft(req, res, next) {
  try {
    const { isValid, errors } = validateUpdateDraftInput(req.body);
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

    const updated = await complaintService.updateDraftComplaint({
      firId: req.params.id,
      citizenId,
      userId: req.user.userId,
      data: req.body,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Draft complaint updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/complaints/check-duplicate
 * Citizen checks for potential duplicate complaints before submission (FR-C4)
 */
async function checkDuplicate(req, res, next) {
  try {
    const { isValid, errors } = validateDuplicateCheckInput(req.body);
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

    const result = await complaintService.checkDuplicateHint({
      citizenId,
      categoryId: req.body.categoryId,
      incidentDt: req.body.incidentDt,
      locationText: req.body.locationText,
      excludeFirId: req.body.excludeFirId || null
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/complaints/:id/acknowledgement
 * Citizen or Officer retrieves official acknowledgement slip / FIR slip (FR-C6)
 */
async function getAcknowledgementSlip(req, res, next) {
  try {
    const slip = await complaintService.generateAcknowledgementSlip(req.params.id, req.user);

    if (req.query.format === 'html' || req.headers.accept?.includes('text/html')) {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${slip.documentTitle} - ${slip.firNumber || slip.trackingId}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #111827; background: #f9fafb; }
    .slip-container { max-width: 800px; margin: 0 auto; background: #fff; padding: 32px; border: 2px solid #1e3a8a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; text-transform: uppercase; margin: 0; color: #1e3a8a; letter-spacing: 1px; }
    .header h2 { font-size: 14px; margin: 6px 0 0; color: #4b5563; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .field { font-size: 13px; line-height: 1.5; }
    .field-label { font-weight: bold; color: #374151; }
    .section-title { font-size: 14px; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 20px 0 10px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; color: #1f2937; }
    .disclaimer { font-size: 11px; color: #6b7280; font-style: italic; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px; }
    .seal { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 11px; color: #4b5563; }
    @media print { body { background: #fff; margin: 0; } .slip-container { border: 1px solid #000; box-shadow: none; padding: 20px; } }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <h1>State Police Department</h1>
      <h2>Online FIR & Police Case Management System</h2>
      <h3 style="font-size:16px; margin:10px 0 0; color:#111;">${slip.documentTitle}</h3>
    </div>

    <div class="grid">
      <div class="field"><span class="field-label">Reference / Tracking ID:</span> ${slip.trackingId || 'N/A'}</div>
      <div class="field"><span class="field-label">Permanent FIR Number:</span> ${slip.firNumber || 'Pending SHO Registration'}</div>
      <div class="field"><span class="field-label">Status:</span> <strong>${slip.status}</strong></div>
      <div class="field"><span class="field-label">Police Station:</span> ${slip.policeStation.name} (${slip.policeStation.code})</div>
      <div class="field"><span class="field-label">Submission Date:</span> ${slip.submittedAt ? new Date(slip.submittedAt).toLocaleString() : 'Draft'}</div>
      <div class="field"><span class="field-label">District:</span> ${slip.policeStation.district || 'General Division'}</div>
    </div>

    <div class="section-title">Complainant / Informant Details</div>
    <div class="grid">
      <div class="field"><span class="field-label">Full Name:</span> ${slip.complainant.fullName}</div>
      <div class="field"><span class="field-label">Contact Phone:</span> ${slip.complainant.phone || 'N/A'}</div>
      <div class="field"><span class="field-label">ID Proof:</span> ${slip.complainant.idType || 'N/A'} (${slip.complainant.maskedIdNumber || 'Verified'})</div>
      <div class="field"><span class="field-label">Address:</span> ${slip.complainant.address || 'N/A'}</div>
    </div>

    <div class="section-title">Incident Particulars</div>
    <div class="field" style="margin-bottom:8px;"><span class="field-label">Date & Time of Incident:</span> ${new Date(slip.incident.incidentDt).toLocaleString()}</div>
    <div class="field" style="margin-bottom:8px;"><span class="field-label">Location:</span> ${slip.incident.locationText}</div>
    <div class="field" style="margin-bottom:8px;"><span class="field-label">Crime Category:</span> ${slip.incident.categoryName || 'General'}</div>
    <div class="field"><span class="field-label">Gist of Incident:</span><br/>${slip.incident.description}</div>

    ${slip.legalSections && slip.legalSections.length > 0 ? `
    <div class="section-title">Tagged Legal Sections</div>
    <table>
      <thead>
        <tr><th>Act</th><th>Section</th><th>Offence Title</th><th>Cognizable</th><th>Bailable</th></tr>
      </thead>
      <tbody>
        ${slip.legalSections.map(s => `<tr><td>${s.act}</td><td>${s.section_no}</td><td>${s.title}</td><td>${s.is_cognizable ? 'Yes' : 'No'}</td><td>${s.is_bailable ? 'Bailable' : 'Non-Bailable'}</td></tr>`).join('')}
      </tbody>
    </table>
    ` : ''}

    ${slip.investigation ? `
    <div class="section-title">Investigation Assignment</div>
    <div class="grid">
      <div class="field"><span class="field-label">Designated IO:</span> ${slip.investigation.assignedIoName}</div>
      <div class="field"><span class="field-label">Badge Number:</span> ${slip.investigation.badgeNo || 'N/A'}</div>
      <div class="field"><span class="field-label">Rank:</span> ${slip.investigation.rank || 'N/A'}</div>
      <div class="field"><span class="field-label">Contact:</span> ${slip.investigation.contactEmail || 'N/A'}</div>
    </div>
    ` : ''}

    <div class="disclaimer">
      ${slip.disclaimer}
    </div>

    <div class="seal">
      <div><strong>Digital Verification Seal:</strong> ${slip.digitalSeal.verificationDigest.substring(0, 32)}...</div>
      <div><strong>Generated:</strong> ${new Date(slip.digitalSeal.issuedAt).toLocaleString()}</div>
    </div>
  </div>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    res.status(200).json({
      success: true,
      data: slip
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
  respondToInfo,
  updateDraft,
  checkDuplicate,
  getAcknowledgementSlip
};