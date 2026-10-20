require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');
const { logAuditEvent } = require('../src/services/audit.service');

const TEST_PORT = 5007;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('=================================================================');
  console.log('   Feature 6: Audit Trail & Statistical Reporting Test Suite    ');
  console.log('=================================================================\n');

  const server = app.listen(TEST_PORT);
  let passedCount = 0;
  let failedCount = 0;

  try {
    // 1. Authenticate Supervisor (SP)
    const spLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sp.district@casesync.gov.in', password: 'Officer@12345' })
    });
    const spData = await spLogin.json();
    const spToken = spData.data?.token;

    if (spToken) {
      console.log('✅ [PASS] 1. Supervisor / SP Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 1. Supervisor / SP Authentication');
      failedCount++;
    }

    // 2. Authenticate Auditor
    const auditorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor@casesync.gov.in', password: 'Auditor@12345' })
    });
    const auditorData = await auditorLogin.json();
    const auditorToken = auditorData.data?.token;

    if (auditorToken) {
      console.log('✅ [PASS] 2. Auditor Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 2. Auditor Authentication');
      failedCount++;
    }

    // 3. Authenticate Citizen (for RBAC negative tests)
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen.priya@casesync.gov.in', password: 'Citizen@12345' })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;

    if (citizenToken) {
      console.log('✅ [PASS] 3. Citizen Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 3. Citizen Authentication');
      failedCount++;
    }

    // 4. Ensure Audit Log Has Test Entries with Hash Chaining
    await logAuditEvent({
      action: 'SYSTEM_HEALTH_CHECK',
      entityType: 'system',
      newData: { status: 'OPTIMAL', testRun: true }
    });
    await logAuditEvent({
      action: 'SECURITY_SCAN',
      entityType: 'security',
      newData: { threatsDetected: 0, complianceScore: 100 }
    });

    // 5. Test Cryptographic Hash-Chain Verification Endpoint
    const verifyRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { 'Authorization': `Bearer ${auditorToken}` }
    });
    const verifyData = await verifyRes.json();

    if (verifyRes.status === 200 && verifyData.isValid === true && verifyData.totalRecords > 0) {
      console.log(`✅ [PASS] Test 5: Cryptographic Hash-Chain Verification (All ${verifyData.totalRecords} records verified, 0 broken links)`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 5: Cryptographic Hash-Chain Verification (${verifyRes.status}: ${verifyData.message || verifyData.reason})`);
      failedCount++;
    }

    // 6. Test Append-Only Trigger: Database Mutation Block
    // Attempting direct SQL UPDATE on audit_log should trigger an exception
    let triggerBlocked = false;
    try {
      await pool.query("UPDATE audit_log SET action = 'TAMPERED' WHERE audit_id = (SELECT MAX(audit_id) FROM audit_log)");
    } catch (err) {
      if (err.message && err.message.includes('strictly append-only')) {
        triggerBlocked = true;
      }
    }

    if (triggerBlocked) {
      console.log('✅ [PASS] Test 6: Database Immutability Trigger (Direct SQL UPDATE blocked by trg_audit_no_mutation)');
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 6: Database Immutability Trigger (Direct SQL UPDATE was not rejected by trigger)');
      failedCount++;
    }

    // 7. Test Audit Explorer Query Filters & Pagination
    const auditQueryRes = await fetch(`${BASE_URL}/api/audit?limit=5`, {
      headers: { 'Authorization': `Bearer ${spToken}` }
    });
    const auditQueryData = await auditQueryRes.json();

    if (
      auditQueryRes.status === 200 &&
      auditQueryData.success === true &&
      Array.isArray(auditQueryData.data) &&
      auditQueryData.data.length > 0 &&
      auditQueryData.data[0].row_hash &&
      auditQueryData.data[0].prev_hash
    ) {
      console.log(`✅ [PASS] Test 7: Audit Explorer Filters (Retrieved ${auditQueryData.data.length} records with SHA-256 hashes)`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 7: Audit Explorer Filters (${auditQueryRes.status})`);
      failedCount++;
    }

    // 8. Test RBAC Guard: Citizen blocked from Audit Logs (403 Forbidden)
    const citizenAuditRes = await fetch(`${BASE_URL}/api/audit`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });

    if (citizenAuditRes.status === 403) {
      console.log('✅ [PASS] Test 8: RBAC Guard (Citizen blocked from /api/audit with 403 Forbidden)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 8: RBAC Guard on Audit (${citizenAuditRes.status})`);
      failedCount++;
    }

    // 9. Test Analytical Reports (FR-U4 & §13)
    const reportsToTest = [
      'cases-by-status',
      'turnaround-time',
      'io-workload',
      'crime-trends',
      'stale-cases',
      'evidence-summary'
    ];

    let allReportsPassed = true;
    for (const reportType of reportsToTest) {
      const repRes = await fetch(`${BASE_URL}/api/reports/${reportType}`, {
        headers: { 'Authorization': `Bearer ${spToken}` }
      });
      const repData = await repRes.json();

      if (repRes.status !== 200 || !repData.success) {
        allReportsPassed = false;
        console.log(`❌ Failed Report: ${reportType} (${repRes.status})`);
      }
    }

    if (allReportsPassed) {
      console.log('✅ [PASS] Test 9: All 6 Analytical Reports (cases-by-status, turnaround-time, io-workload, crime-trends, stale-cases, evidence-summary)');
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 9: One or more analytical reports failed');
      failedCount++;
    }

    // 10. Test Invalid Report Type Guard (400 Bad Request)
    const invalidReportRes = await fetch(`${BASE_URL}/api/reports/non-existent-report`, {
      headers: { 'Authorization': `Bearer ${spToken}` }
    });

    if (invalidReportRes.status === 400) {
      console.log('✅ [PASS] Test 10: Invalid Report Type Guard (Blocked with 400 Bad Request)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 10: Invalid Report Type Guard (${invalidReportRes.status})`);
      failedCount++;
    }

    // 11. Test CSV Export Stream
    const exportRes = await fetch(`${BASE_URL}/api/reports/cases-by-status/export`, {
      headers: { 'Authorization': `Bearer ${auditorToken}` }
    });
    const contentType = exportRes.headers.get('content-type');
    const csvText = await exportRes.text();

    if (exportRes.status === 200 && contentType && contentType.includes('text/csv') && csvText.includes('station_name')) {
      console.log('✅ [PASS] Test 11: RFC-4180 CSV Export Stream (Content-Type: text/csv verified)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 11: CSV Export Stream (${exportRes.status}, Content-Type: ${contentType})`);
      failedCount++;
    }

    // 12. Test RBAC Guard: Citizen blocked from Reports (403 Forbidden)
    const citizenRepRes = await fetch(`${BASE_URL}/api/reports/cases-by-status`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });

    if (citizenRepRes.status === 403) {
      console.log('✅ [PASS] Test 12: RBAC Guard (Citizen blocked from /api/reports with 403 Forbidden)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 12: RBAC Guard on Reports (${citizenRepRes.status})`);
      failedCount++;
    }

  } catch (err) {
    console.error('Unhandled Test Execution Error:', err);
    failedCount++;
  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n=================================================================');
  console.log(`   Feature 6 Tests Finished: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('=================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
