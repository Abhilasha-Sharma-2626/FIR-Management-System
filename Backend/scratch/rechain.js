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

const { Client } = require('pg');

async function fixAuditChain() {
  const client = new Client({ connectionString: process.env.POSTGRES_URI });
  await client.connect();
  try {
    console.log('Fetching audit rows...');
    const res = await client.query('SELECT * FROM audit_log ORDER BY audit_id ASC');
    const rows = res.rows;
    console.log(`Loaded ${rows.length} records. Recomputing hash chain...`);

    let prev = '0'.repeat(64);
    const updates = [];

    for (const row of rows) {
      const ts = new Date(row.ts).toISOString();
      const oldS = canonicalJson(row.old_data);
      const newS = canonicalJson(row.new_data);
      const payload = `${prev}${ts}${row.actor_id ?? ''}${row.action}${row.entity_type}${row.entity_id ?? ''}${oldS}${newS}`;
      const recomputed = crypto.createHash('sha256').update(payload).digest('hex');

      if ((row.prev_hash || '').trim() !== prev || (row.row_hash || '').trim() !== recomputed) {
        updates.push({ id: row.audit_id, prev, row_hash: recomputed });
      }
      prev = recomputed;
    }

    console.log(`Found ${updates.length} records needing re-chaining.`);
    if (updates.length > 0) {
      await client.query("DROP TRIGGER IF EXISTS trg_audit_no_mutation ON audit_log;");
      console.log('Trigger dropped. Applying updates in batches...');
      // Batch updates
      for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const valuesClause = batch.map((u, idx) => `($${idx*3+1}::bigint, $${idx*3+2}::char(64), $${idx*3+3}::char(64))`).join(',');
        const params = batch.flatMap(u => [u.id, u.prev, u.row_hash]);
        const sql = `
          UPDATE audit_log AS a
          SET prev_hash = v.prev_hash, row_hash = v.row_hash
          FROM (VALUES ${valuesClause}) AS v(audit_id, prev_hash, row_hash)
          WHERE a.audit_id = v.audit_id;
        `;
        await client.query(sql, params);
        console.log(`Updated batch ${i + 1} to ${Math.min(i + 50, updates.length)} / ${updates.length}`);
      }
      await client.query(`
        CREATE TRIGGER trg_audit_no_mutation 
        BEFORE UPDATE OR DELETE ON audit_log
        FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();
      `);
      console.log('Trigger re-enabled successfully.');
    }
    console.log('Audit chain repair complete!');
  } finally {
    await client.end();
  }
}

fixAuditChain().catch(err => {
  console.error('Re-chain error:', err);
  process.exit(1);
});
