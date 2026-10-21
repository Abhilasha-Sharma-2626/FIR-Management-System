require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');
const { verifyAuditChain } = require('../src/services/audit.service');

const TEST_PORT = 5008;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('=================================================================');
  console.log('   Feature 7: System Administration & Master Data Test Suite     ');
  console.log('=================================================================\n');

  const server = app.listen(TEST_PORT);
  let passedCount = 0;
  let failedCount = 0;

  try {
    // 1. Authenticate Admin
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@casesync.gov.in', password: 'Admin@12345' })
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.data?.token;
    const adminUser = adminData.data?.user;

    if (adminToken) {
      console.log('✅ [PASS] 1. Admin Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 1. Admin Authentication');
      failedCount++;
    }

    // 2. Authenticate Citizen (for RBAC negative tests)
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen.priya@casesync.gov.in', password: 'Citizen@12345' })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;

    if (citizenToken) {
      console.log('✅ [PASS] 2. Citizen Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 2. Citizen Authentication');
      failedCount++;
    }

    // 3. Authenticate Supervisor
    const spLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sp.district@casesync.gov.in', password: 'Officer@12345' })
    });
    const spData = await spLogin.json();
    const spToken = spData.data?.token;

    if (spToken) {
      console.log('✅ [PASS] 3. Supervisor Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 3. Supervisor Authentication');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 4: RBAC Guard - Citizen blocked from Admin routes
    // -----------------------------------------------------------------
    const rbacRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    if (rbacRes.status === 403) {
      console.log('✅ [PASS] Test 4: RBAC Guard (Citizen blocked from /api/admin/users with 403 Forbidden)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 4: RBAC Guard returned ${rbacRes.status}`);
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 5: Stations Administration - Create Police Station
    // -----------------------------------------------------------------
    const testCode = `EPS-${Date.now().toString().slice(-4)}`;
    const createStationRes = await fetch(`${BASE_URL}/api/admin/stations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: testCode,
        name: 'East District Police Station',
        district: 'East District',
        address: 'Sector 44, Metro Highway',
        contact_phone: '011-23456789',
        email: 'east.ps@casesync.gov.in'
      })
    });
    const createStationData = await createStationRes.json();
    let createdStationId = createStationData.data?.station_id;

    if (createStationRes.status === 201 && createdStationId) {
      console.log(`✅ [PASS] Test 5: POST /api/admin/stations (Created station '${testCode}', ID: ${createdStationId})`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 5: Create station failed:`, createStationData);
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 6: Stations Administration - List & Get Details
    // -----------------------------------------------------------------
    const listStationsRes = await fetch(`${BASE_URL}/api/admin/stations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listStationsData = await listStationsRes.json();

    const getStationRes = await fetch(`${BASE_URL}/api/admin/stations/${createdStationId}`, {
      headers: { Authorization: `Bearer ${spToken}` } // Supervisor has read access
    });
    const getStationData = await getStationRes.json();

    if (
      listStationsRes.status === 200 &&
      Array.isArray(listStationsData.data) &&
      listStationsData.data.length >= 1 &&
      getStationRes.status === 200 &&
      getStationData.data?.code === testCode
    ) {
      console.log(`✅ [PASS] Test 6: GET /api/admin/stations & /:id (Listed ${listStationsData.count} stations, verified station details)`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 6: Get stations failed`);
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 7: Stations Administration - Update & Toggle Status
    // -----------------------------------------------------------------
    const updateStationRes = await fetch(`${BASE_URL}/api/admin/stations/${createdStationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        address: 'Sector 44, Metro Highway (Renovated Block B)',
        contact_phone: '011-99887766'
      })
    });
    const updateStationData = await updateStationRes.json();

    const toggleStationRes = await fetch(`${BASE_URL}/api/admin/stations/${createdStationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false })
    });
    const toggleStationData = await toggleStationRes.json();

    if (
      updateStationRes.status === 200 &&
      updateStationData.data?.contact_phone === '011-99887766' &&
      toggleStationRes.status === 200 &&
      toggleStationData.data?.is_active === false
    ) {
      console.log('✅ [PASS] Test 7: PUT & PATCH /api/admin/stations/:id (Updated station details and toggled status)');
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 7: Update/Toggle station failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 8: Ranks Master Data - CRUD
    // -----------------------------------------------------------------
    const testRankCode = `TEST_RANK_${Date.now().toString().slice(-4)}`;
    const createRankRes = await fetch(`${BASE_URL}/api/admin/ranks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: testRankCode,
        title: 'Special Investigating Officer',
        hierarchy_level: 4,
        description: 'Designated senior cyber & homicide investigator'
      })
    });
    const createRankData = await createRankRes.json();
    const rankId = createRankData.data?.rank_id;

    const listRanksRes = await fetch(`${BASE_URL}/api/admin/ranks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listRanksData = await listRanksRes.json();

    if (createRankRes.status === 201 && listRanksRes.status === 200 && rankId) {
      console.log(`✅ [PASS] Test 8: POST & GET /api/admin/ranks (Created rank '${testRankCode}', total ranks: ${listRanksData.count})`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 8: Ranks CRUD failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 9: Crime Categories Master Data - CRUD
    // -----------------------------------------------------------------
    const testCatName = `Narcotics & Contraband ${Date.now().toString().slice(-4)}`;
    const createCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: testCatName,
        description: 'Illicit drug trafficking, possession and consumption'
      })
    });
    const createCatData = await createCatRes.json();
    const catId = createCatData.data?.category_id;

    const listCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listCatData = await listCatRes.json();

    if (createCatRes.status === 201 && listCatRes.status === 200 && catId) {
      console.log(`✅ [PASS] Test 9: POST & GET /api/admin/categories (Created category '${testCatName}', total: ${listCatData.count})`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 9: Category CRUD failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 10: Legal Sections Master Data - CRUD
    // -----------------------------------------------------------------
    const testSectionNo = `${Date.now().toString().slice(-4)}`;
    const createSectionRes = await fetch(`${BASE_URL}/api/admin/legal-sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        act: 'BNS',
        section_no: testSectionNo,
        title: 'Cyber Security Breach and Electronic Tampering',
        is_cognizable: true,
        is_bailable: false,
        description: 'Unauthorized access to critical police records',
        punishment_years: 7
      })
    });
    const createSectionData = await createSectionRes.json();
    const sectionId = createSectionData.data?.section_id;

    const listSectionsRes = await fetch(`${BASE_URL}/api/admin/legal-sections?act=BNS`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listSectionsData = await listSectionsRes.json();

    if (createSectionRes.status === 201 && listSectionsRes.status === 200 && sectionId) {
      console.log(`✅ [PASS] Test 10: POST & GET /api/admin/legal-sections (Created BNS ${testSectionNo}, total: ${listSectionsData.count})`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 10: Legal sections CRUD failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 11: Users & Officers Administration - Listing & Profile
    // -----------------------------------------------------------------
    const listUsersRes = await fetch(`${BASE_URL}/api/admin/users?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listUsersData = await listUsersRes.json();

    const targetUser = listUsersData.data?.find(u => u.officer_id && u.role_code === 'IO') || listUsersData.data?.[1];
    const targetUserId = targetUser?.user_id;

    const getUserRes = await fetch(`${BASE_URL}/api/admin/users/${targetUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getUserData = await getUserRes.json();

    if (
      listUsersRes.status === 200 &&
      listUsersData.count > 0 &&
      getUserRes.status === 200 &&
      getUserData.data?.user_id === targetUserId
    ) {
      console.log(`✅ [PASS] Test 11: GET /api/admin/users & /:id (Retrieved ${listUsersData.count} users, inspected user ID: ${targetUserId})`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 11: User listing failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 12: User Management - Soft Deactivation & Reactivation
    // -----------------------------------------------------------------
    const deactivateRes = await fetch(`${BASE_URL}/api/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false })
    });
    const deactivateData = await deactivateRes.json();

    const reactivateRes = await fetch(`${BASE_URL}/api/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: true })
    });
    const reactivateData = await reactivateRes.json();

    if (
      deactivateRes.status === 200 &&
      deactivateData.data?.is_active === false &&
      reactivateRes.status === 200 &&
      reactivateData.data?.is_active === true
    ) {
      console.log(`✅ [PASS] Test 12: PATCH /api/admin/users/:id/status (Soft-deactivated and reactivated user ID: ${targetUserId})`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 12: Soft deactivation failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 13: Safety Guard - Admin cannot deactivate their own account
    // -----------------------------------------------------------------
    const selfDeactivateRes = await fetch(`${BASE_URL}/api/admin/users/${adminUser.userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false })
    });
    const selfDeactivateData = await selfDeactivateRes.json();

    if (selfDeactivateRes.status === 400 && selfDeactivateData.message.includes('Security Guard')) {
      console.log('✅ [PASS] Test 13: Safety Guard (Admin self-deactivation blocked with 400 Bad Request)');
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 13: Admin self-deactivation was not blocked properly');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 14: Officer Management - Station Transfer
    // -----------------------------------------------------------------
    const officerUser = listUsersData.data?.find(u => u.officer_id);
    if (officerUser) {
      const transferRes = await fetch(`${BASE_URL}/api/admin/users/${officerUser.officer_id}/station`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ stationId: 1 }) // Station 1 (Central Police Station)
      });
      const transferData = await transferRes.json();

      if (transferRes.status === 200 && transferData.data?.station_id === 1) {
        console.log(`✅ [PASS] Test 14: PATCH /api/admin/users/:id/station (Transferred Officer ID ${officerUser.officer_id} to Station 1)`);
        passedCount++;
      } else {
        console.log('❌ [FAIL] Test 14: Station transfer failed:', transferData);
        failedCount++;
      }
    } else {
      console.log('⚠️ [SKIP] Test 14: No officer found to transfer');
    }

    // -----------------------------------------------------------------
    // TEST 15: SLA Configuration & Breach Monitoring (FR-AD3)
    // -----------------------------------------------------------------
    const listSlaRes = await fetch(`${BASE_URL}/api/admin/sla`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listSlaData = await listSlaRes.json();

    const updateSlaRes = await fetch(`${BASE_URL}/api/admin/sla/COMPLAINT_REVIEW`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        thresholdHours: 36,
        escalationRole: 'SHO',
        title: 'Citizen Complaint Initial Review SLA (Updated)'
      })
    });
    const updateSlaData = await updateSlaRes.json();

    const getBreachesRes = await fetch(`${BASE_URL}/api/admin/sla/breaches`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getBreachesData = await getBreachesRes.json();

    if (
      listSlaRes.status === 200 &&
      listSlaData.count >= 4 &&
      updateSlaRes.status === 200 &&
      updateSlaData.data?.threshold_hours === 36 &&
      getBreachesRes.status === 200 &&
      getBreachesData.data?.summary
    ) {
      console.log(`✅ [PASS] Test 15: GET & PUT /api/admin/sla (Configured ${listSlaData.count} SLAs, verified breach monitoring engine)`);
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 15: SLA configuration failed');
      failedCount++;
    }

    // -----------------------------------------------------------------
    // TEST 16: Cryptographic Hash-Chain Verification on Admin Audit Events
    // -----------------------------------------------------------------
    const auditChainVerification = await verifyAuditChain();
    if (auditChainVerification.isValid) {
      console.log(
        `✅ [PASS] Test 16: Cryptographic Audit Chain Verified (${auditChainVerification.totalRecords} records, all SHA-256 hashes matched, 0 broken links)`
      );
      passedCount++;
    } else {
      console.log(
        `❌ [FAIL] Test 16: Audit chain broken:`,
        auditChainVerification.reason
      );
      failedCount++;
    }

  } catch (error) {
    console.error('Unhandled test suite error:', error);
    failedCount++;
  } finally {
    server.close();
    await pool.end();

    console.log('\n=================================================================');
    console.log(`   Feature 7 Tests Finished: ${passedCount} Passed, ${failedCount} Failed`);
    console.log('=================================================================\n');

    process.exit(failedCount > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
