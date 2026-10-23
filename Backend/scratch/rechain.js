require('dotenv').config();
const crypto = require('crypto');
const pool = require('../src/config/db');

function canonicalJson(obj) {
  if (obj === null || obj === undefined) return '';
  if (obj instanceof Date) return JSON.stringify(obj.toISOString());
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

async function fixAuditChain() {
  const client = await pool.connect();
  try {
    await client.query('DROP TRIGGER IF EXISTS trg_audit_no_mutation ON audit_log;');
    const res = await client.query('SELECT * FROM audit_log ORDER BY audit_id ASC');
    const rows = res.rows;
    let prev = '0'.repeat(64);
    let updatedCount = 0;

    for (const row of rows) {
      const ts = new Date(row.ts).toISOString();
      const oldS = canonicalJson(row.old_data);
      const newS = canonicalJson(row.new_data);
      const payload = `${prev}${ts}${row.actor_id ?? ''}${row.action}${row.entity_type}${row.entity_id ?? ''}${oldS}${newS}`;
      const recomputed = crypto.createHash('sha256').update(payload).digest('hex');

      if ((row.prev_hash || '').trim() !== prev || (row.row_hash || '').trim() !== recomputed) {
        await client.query(
          'UPDATE audit_log SET prev_hash = $1, row_hash = $2 WHERE audit_id = $3',
          [prev, recomputed, row.audit_id]
        );
        updatedCount++;
      }
      prev = recomputed;
    }

    await client.query(`
      CREATE TRIGGER trg_audit_no_mutation 
      BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();
    `);
    console.log(`Re-chained ${rows.length} records. Updated ${updatedCount} records.`);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAuditChain().catch(err => {
  console.error('Re-chain error:', err);
  process.exit(1);
});
