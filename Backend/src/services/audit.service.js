const crypto = require('crypto');
const pool = require('../config/db');

const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministic JSON stringifier (canonical JSON)
 * Prevents PostgreSQL JSONB key reordering from altering cryptographic hashes
 */
function canonicalJson(obj) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

/**
 * Log an event to the append-only, tamper-evident hash-chained audit_log table
 */
async function logAuditEvent({
  client = null,
  actorId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  ipAddress = null
}) {
  const db = client || pool;
  try {
    // 1. Fetch latest row_hash to maintain the cryptographic hash chain
    const latestRes = await db.query(
      'SELECT row_hash FROM audit_log ORDER BY audit_id DESC LIMIT 1'
    );
    const prevHash =
      latestRes.rows.length > 0 && latestRes.rows[0].row_hash
        ? latestRes.rows[0].row_hash.trim()
        : GENESIS_HASH;

    const ts = new Date().toISOString();

    // 2. Format JSON strings deterministically (canonical sorting)
    const oldDataStr = canonicalJson(oldData);
    const newDataStr = canonicalJson(newData);

    // Formula per PROJECT_CONTEXT.md §9.3:
    // row_hash = SHA256( prev_hash || ts || actor_id || action || entity_type || entity_id || old_data || new_data )
    const hashPayload = `${prevHash}${ts}${actorId ?? ''}${action}${entityType}${entityId ?? ''}${oldDataStr}${newDataStr}`;
    const rowHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    // 3. Insert audit log row
    const insertQuery = `
      INSERT INTO audit_log (
        ts, actor_id, actor_role, action, entity_type, entity_id,
        old_data, new_data, ip_address, prev_hash, row_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING audit_id, ts, action, entity_type, entity_id, row_hash;
    `;

    const res = await db.query(insertQuery, [
      ts,
      actorId || null,
      actorRole || null,
      action,
      entityType,
      entityId || null,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress || null,
      prevHash,
      rowHash
    ]);

    return res.rows[0];
  } catch (err) {
    console.error('Audit logging error:', err.message);
    return null;
  }
}

/**
 * Verify cryptographic integrity of the audit log hash chain (PROJECT_CONTEXT.md §9.3)
 */
async function verifyAuditChain() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM audit_log ORDER BY audit_id ASC');
    const rows = res.rows;

    if (rows.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        message: 'Audit log is empty.'
      };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const actualPrevHash = (row.prev_hash || '').trim();

      if (actualPrevHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          brokenIndex: i,
          brokenAuditId: row.audit_id,
          reason: `Previous hash mismatch at audit_id ${row.audit_id}. Expected ${expectedPrevHash}, found ${actualPrevHash}.`
        };
      }

      // Recompute row_hash with canonical json serialization
      const ts = new Date(row.ts).toISOString();
      const oldDataStr = canonicalJson(row.old_data);
      const newDataStr = canonicalJson(row.new_data);
      const hashPayload = `${actualPrevHash}${ts}${row.actor_id ?? ''}${row.action}${row.entity_type}${row.entity_id ?? ''}${oldDataStr}${newDataStr}`;
      const recomputedRowHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

      const storedRowHash = (row.row_hash || '').trim();
      if (recomputedRowHash !== storedRowHash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          brokenIndex: i,
          brokenAuditId: row.audit_id,
          reason: `Row hash mismatch at audit_id ${row.audit_id}. Data has been tampered with.`
        };
      }

      expectedPrevHash = storedRowHash;
    }

    return {
      isValid: true,
      totalRecords: rows.length,
      message: 'Audit log integrity verified. All cryptographic hash chains match.'
    };
  } finally {
    client.release();
  }
}

/**
 * Query audit logs with role/scope filtering (PROJECT_CONTEXT.md §9.2 & §12.2)
 */
async function getAuditLogs({ entityType, entityId, actorId, action, fromDate, toDate, limit = 50, offset = 0 }) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (entityType) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(entityId);
  }
  if (actorId) {
    conditions.push(`actor_id = $${paramIndex++}`);
    params.push(actorId);
  }
  if (action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(action);
  }
  if (fromDate) {
    conditions.push(`ts >= $${paramIndex++}`);
    params.push(new Date(fromDate));
  }
  if (toDate) {
    conditions.push(`ts <= $${paramIndex++}`);
    params.push(new Date(toDate));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT audit_id, ts, actor_id, actor_role, action, entity_type, entity_id,
           old_data, new_data, ip_address, prev_hash, row_hash
    FROM audit_log
    ${whereClause}
    ORDER BY audit_id DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  logAuditEvent,
  verifyAuditChain,
  getAuditLogs,
  canonicalJson
};
