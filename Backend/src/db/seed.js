require('dotenv').config();
const pool = require('../config/db');
const { hashPassword } = require('../utils/auth.util');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Seed Process ---');
    await client.query('BEGIN');

    // 1. Ensure Police Stations
    console.log('Ensuring Police Stations...');
    const stations = [
      {
        id: 1,
        code: 'CPS-01',
        name: 'Central Police Station',
        district: 'Central District',
        address: 'Sector 17, City Centre'
      },
      {
        id: 2,
        code: 'NPS-02',
        name: 'North Police Station',
        district: 'North District',
        address: 'Civil Lines, North Zone'
      }
    ];

    for (const st of stations) {
      await client.query(
        `INSERT INTO police_stations (station_id, code, name, district, address)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (station_id) DO UPDATE
         SET code = EXCLUDED.code, name = EXCLUDED.name, district = EXCLUDED.district, address = EXCLUDED.address`,
        [st.id, st.code, st.name, st.district, st.address]
      );
    }

    // Reset station sequence
    await client.query(
      `SELECT setval(pg_get_serial_sequence('police_stations', 'station_id'), (SELECT MAX(station_id) FROM police_stations))`
    );

    // 2. Fetch Role IDs map
    const rolesRes = await client.query('SELECT role_id, code FROM roles');
    const roleMap = {};
    rolesRes.rows.forEach(r => {
      roleMap[r.code] = r.role_id;
    });

    // 3. Seed Users & Profiles
    const demoUsers = [
      {
        email: 'admin@casesync.gov.in',
        password: 'Admin@12345',
        role: 'ADMIN',
        phone: '9800000001'
      },
      {
        email: 'auditor@casesync.gov.in',
        password: 'Auditor@12345',
        role: 'AUDITOR',
        phone: '9800000002'
      },
      {
        email: 'sho.central@casesync.gov.in',
        password: 'Officer@12345',
        role: 'SHO',
        phone: '9800000003',
        officer: {
          badgeNo: 'SHO-CPS-001',
          fullName: 'Inspector Rajesh Sharma',
          rank: 'Inspector / SHO',
          stationId: 1
        }
      },
      {
        email: 'io.central@casesync.gov.in',
        password: 'Officer@12345',
        role: 'IO',
        phone: '9800000004',
        officer: {
          badgeNo: 'IO-CPS-101',
          fullName: 'Sub-Inspector Vikram Singh',
          rank: 'Sub-Inspector',
          stationId: 1
        }
      },
      {
        email: 'desk.central@casesync.gov.in',
        password: 'Officer@12345',
        role: 'DESK_OFFICER',
        phone: '9800000005',
        officer: {
          badgeNo: 'DO-CPS-201',
          fullName: 'Assistant Sub-Inspector Sunita Devi',
          rank: 'Assistant Sub-Inspector',
          stationId: 1
        }
      },
      {
        email: 'sp.district@casesync.gov.in',
        password: 'Officer@12345',
        role: 'SUPERVISOR',
        phone: '9800000006',
        officer: {
          badgeNo: 'SP-DIST-001',
          fullName: 'Superintendent Anil Mehra',
          rank: 'Superintendent of Police',
          stationId: 1
        }
      },
      {
        email: 'citizen.priya@casesync.gov.in',
        password: 'Citizen@12345',
        role: 'CITIZEN',
        phone: '9800000007',
        citizen: {
          fullName: 'Priya Sharma',
          address: 'Flat 402, Green Avenue, City Centre',
          dob: '1995-05-15',
          idProofType: 'AADHAAR',
          idProofLast4: '4321'
        }
      }
    ];

    console.log('Seeding demo accounts for all roles...');
    for (const u of demoUsers) {
      const roleId = roleMap[u.role];
      if (!roleId) {
        console.warn(`Role ${u.role} not found in database, skipping.`);
        continue;
      }

      const existingUser = await client.query(
        'SELECT user_id FROM users WHERE LOWER(email) = $1',
        [u.email.toLowerCase()]
      );

      let userId;
      const hashedPassword = await hashPassword(u.password);

      if (existingUser.rows.length === 0) {
        const insertUserRes = await client.query(
          `INSERT INTO users (email, phone, password_hash, role_id, is_active)
           VALUES ($1, $2, $3, $4, TRUE)
           RETURNING user_id`,
          [u.email.toLowerCase(), u.phone, hashedPassword, roleId]
        );
        userId = insertUserRes.rows[0].user_id;
        console.log(`Created user: ${u.email} (${u.role})`);
      } else {
        userId = existingUser.rows[0].user_id;
        // Update password hash to ensure credentials match
        await client.query(
          `UPDATE users SET password_hash = $1, failed_logins = 0, locked_until = NULL WHERE user_id = $2`,
          [hashedPassword, userId]
        );
        console.log(`Updated user password: ${u.email} (${u.role})`);
      }

      // Handle officer profile
      if (u.officer) {
        const existingOfficer = await client.query(
          'SELECT officer_id FROM officers WHERE user_id = $1',
          [userId]
        );
        if (existingOfficer.rows.length === 0) {
          await client.query(
            `INSERT INTO officers (user_id, badge_no, full_name, rank, station_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              userId,
              u.officer.badgeNo,
              u.officer.fullName,
              u.officer.rank,
              u.officer.stationId
            ]
          );
          console.log(`  -> Attached officer profile: ${u.officer.badgeNo}`);
        }
      }

      // Handle citizen profile
      if (u.citizen) {
        const existingCitizen = await client.query(
          'SELECT citizen_id FROM citizens WHERE user_id = $1',
          [userId]
        );
        if (existingCitizen.rows.length === 0) {
          await client.query(
            `INSERT INTO citizens (user_id, full_name, address, dob, id_proof_type, id_proof_last4)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              userId,
              u.citizen.fullName,
              u.citizen.address,
              u.citizen.dob,
              u.citizen.idProofType,
              u.citizen.idProofLast4
            ]
          );
          console.log(`  -> Attached citizen profile: ${u.citizen.fullName}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('--- Seed Completed Successfully! ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
