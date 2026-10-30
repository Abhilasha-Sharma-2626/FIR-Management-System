const pool = require('../config/db');
const crypto = require('crypto');

function canonicalJson(obj) {
  if (obj === null || obj === undefined) return '';
  if (obj instanceof Date) return JSON.stringify(obj.toISOString());
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

async function repair() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE audit_log DISABLE TRIGGER trg_audit_no_mutation');
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM audit_log ORDER BY audit_id ASC');
    console.log(`Auditing ${rows.length} total rows...`);
    let prev = '0'.repeat(64);
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ts = new Date(r.ts).toISOString();
      const hashPayload = `${prev}${ts}${r.actor_id ?? ''}${r.action}${r.entity_type}${r.entity_id ?? ''}${canonicalJson(r.old_data)}${canonicalJson(r.new_data)}`;
      const rowHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

      if (r.prev_hash !== prev || r.row_hash !== rowHash) {
        await client.query(
          'UPDATE audit_log SET prev_hash = $1, row_hash = $2 WHERE audit_id = $3',
          [prev, rowHash, r.audit_id]
        );
        updated++;
      }
      prev = rowHash;
    }

    await client.query('COMMIT');
    console.log(`Audit chain repair complete. Repaired ${updated} rows.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Audit repair failed:', err);
    throw err;
  } finally {
    try {
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_no_mutation');
    } catch (_) {}
    client.release();
  }
}

if (require.main === module) {
  repair().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { repair };
