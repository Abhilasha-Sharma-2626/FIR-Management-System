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
      },
      {
        email: 'citizen.new@casesync.gov.in',
        password: 'Citizen@12345',
        role: 'CITIZEN',
        phone: '9800000008',
        citizen: {
          fullName: 'Aarav Patel',
          address: 'House No 12-B, Model Town, Civil Lines',
          dob: '1998-11-20',
          idProofType: 'PAN',
          idProofLast4: '8765'
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

    // 4. Fetch Priya Sharma Citizen ID and User ID
    console.log('Seeding authentic citizen dockets and notifications for Priya Sharma...');
    const priyaRes = await client.query(
      `SELECT c.citizen_id, u.user_id FROM citizens c JOIN users u ON c.user_id = u.user_id WHERE LOWER(u.email) = 'citizen.priya@casesync.gov.in'`
    );
    if (priyaRes.rows.length === 0) {
      throw new Error('Priya Sharma citizen profile not found');
    }
    const priyaCitizenId = priyaRes.rows[0].citizen_id;
    const priyaUserId = priyaRes.rows[0].user_id;

    // Fetch Aarav Patel for additional police station workflow dockets
    const aaravRes = await client.query(
      `SELECT c.citizen_id, u.user_id FROM citizens c JOIN users u ON c.user_id = u.user_id WHERE LOWER(u.email) = 'citizen.new@casesync.gov.in'`
    );
    const aaravCitizenId = aaravRes.rows[0]?.citizen_id || priyaCitizenId;
    const aaravUserId = aaravRes.rows[0]?.user_id || priyaUserId;

    // Fetch key officers for assignments and history actors
    const ioRes = await client.query(`SELECT officer_id, user_id FROM officers WHERE badge_no = 'IO-CPS-101'`);
    const ioOfficerId = ioRes.rows[0]?.officer_id;
    const ioUserId = ioRes.rows[0]?.user_id || priyaUserId;

    const doRes = await client.query(`SELECT officer_id, user_id FROM officers WHERE badge_no = 'DO-CPS-201'`);
    const doOfficerId = doRes.rows[0]?.officer_id;
    const doUserId = doRes.rows[0]?.user_id || priyaUserId;

    const shoRes = await client.query(`SELECT officer_id, user_id FROM officers WHERE badge_no = 'SHO-CPS-001'`);
    const shoOfficerId = shoRes.rows[0]?.officer_id;
    const shoUserId = shoRes.rows[0]?.user_id || priyaUserId;

    // Fetch Category IDs
    const catRes = await client.query(`SELECT category_id, name FROM crime_categories`);
    const catMap = {};
    catRes.rows.forEach(c => { catMap[c.name] = c.category_id; });

    // Fetch Legal Section IDs
    const secRes = await client.query(`SELECT section_id, act, section_no FROM legal_sections`);
    const secMap = {};
    secRes.rows.forEach(s => { secMap[`${s.act}_${s.section_no}`] = s.section_id; });

    // 5. Seed 4 authentic dockets covering the complete BNSS complaint lifecycle
    const seedDockets = [
      {
        trackingId: 'CMP-2026-000053',
        firNumber: 'FIR/CPS-01/2026/00029',
        status: 'UNDER_INVESTIGATION',
        priority: 1,
        categoryId: catMap['Cyber Crime'],
        stationId: 1,
        incidentDt: '2026-02-18T14:30:00Z',
        locationText: 'Sector 17 Commercial Complex, Cyber Banking Hub',
        description: 'Unauthorized electronic wire transfer and phishing compromise of bank savings account. Amount debited: Rs. 1,45,000 via fraudulent payment gateway link.',
        case: {
          currentIoId: ioOfficerId,
          investigationStartedAt: '2026-02-19T10:00:00Z'
        },
        sections: [secMap['IT_ACT_66C'], secMap['BNS_318']].filter(Boolean),
        history: [
          { from: null, to: 'DRAFT', actorId: priyaUserId, note: 'Complaint drafted online by citizen.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: priyaUserId, note: 'Submitted via citizen portal. Tracking ID issued.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Intake review initiated by Desk Officer ASI Sunita Devi.' },
          { from: 'UNDER_REVIEW', to: 'REGISTERED', actorId: shoUserId, note: 'FIR registered under BNS 318 & IT Act 66C approved by SHO Rajesh Sharma.' },
          { from: 'REGISTERED', to: 'ASSIGNED', actorId: shoUserId, note: 'Assigned to Investigating Officer SI Vikram Singh.' },
          { from: 'ASSIGNED', to: 'UNDER_INVESTIGATION', actorId: ioUserId, note: 'Case docket accepted by IO. Preliminary forensic trail initiated.' }
        ],
        evidence: [
          {
            evidenceNo: 'EVD-CPS-01-2026-001',
            type: 'DOCUMENT',
            description: 'Certified bank transaction ledger and statement showing unauthorized IMPS debit of Rs. 1,45,000.',
            status: 'IN_STORAGE',
            currentHolder: doOfficerId,
            fileName: 'bank_statement_certified.pdf',
            sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
            location: 'Central Malkhana - Locker C-14',
            custodyChain: [
              {
                fromHolder: ioOfficerId,
                toHolder: doOfficerId,
                purpose: 'Malkhana safe custody storage',
                remarks: 'Sealed document deposited with Malkhana In-Charge for judicial preservation.'
              }
            ]
          },
          {
            evidenceNo: 'EVD-CPS-01-2026-002',
            type: 'DIGITAL',
            description: 'Forensic extraction of phishing SMS headers and fraudulent APK download link.',
            status: 'IN_LAB',
            currentHolder: ioOfficerId,
            fileName: 'phishing_sms_forensic.png',
            sha256: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
            location: 'Cyber Forensic Cell Lab #2'
          }
        ],
        updates: [
          {
            type: 'STATEMENT',
            body: 'Complainant Priya Sharma attended Central Police Station. Recorded formal statement under BNSS Section 180 detailing timeline of phishing SMS, spoofed banking portal and unauthorized IMPS debit of Rs. 1,45,000.',
            visibleToCitizen: true
          },
          {
            type: 'FORENSIC',
            body: 'Dispatched forensic digital evidence and SMS headers to Cyber Cell Lab #2 for gateway routing tracing.',
            visibleToCitizen: false
          },
          {
            type: 'SITE_VISIT',
            body: 'Inspection conducted at Sector 17 commercial banking branch. Statutory notice under BNSS Section 94 issued to branch operations manager for transaction IP logs.',
            visibleToCitizen: true
          }
        ],
        persons: [
          {
            role: 'VICTIM',
            fullName: 'Priya Sharma',
            contact: '+91 98765 43210',
            address: 'Flat 402, Green Avenue, City Centre',
            notes: 'Complainant and account holder. Furnished verified bank statement.'
          },
          {
            role: 'ACCUSED',
            fullName: 'Unknown Syndicate Operator (Alias: CyberPay Admin)',
            contact: null,
            address: 'Server IP Node: 185.220.101.42 (Navi Mumbai proxy)',
            notes: 'Principal accused operating unauthorized payment gateway terminal.'
          },
          {
            role: 'WITNESS',
            fullName: 'Ramesh Verma',
            contact: '+91 98111 22334',
            address: 'HDFC Bank Sector 17 Branch',
            notes: 'Branch Operations Manager. Certified electronic bank ledger transaction records.'
          }
        ],
        notifications: [
          { message: 'FIR Registered: FIR/CPS-01/2026/00029 registered for CMP-2026-000053 under BNS 318 and IT Act 66C.', isRead: true },
          { message: 'IO Assigned: Sub-Inspector Vikram Singh (Badge: IO-CPS-101) has been assigned to investigate your case.', isRead: false }
        ]
      },
      {
        trackingId: 'CMP-2026-000020',
        firNumber: null,
        status: 'INFO_REQUESTED',
        priority: 2,
        categoryId: catMap['Theft / Burglary'],
        stationId: 1,
        incidentDt: '2026-02-22T20:15:00Z',
        locationText: 'Vehicle Parking Bay, Sector 17 Commercial Market',
        description: 'Theft of Dell XPS 15 laptop and office backpack from parked vehicle between 7:30 PM and 8:15 PM.',
        rejectionReason: 'Please provide the laptop serial number, purchase invoice, or MAC address to verify against the National Stolen Property Index.',
        history: [
          { from: null, to: 'DRAFT', actorId: priyaUserId, note: 'Complaint drafted online by citizen.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: priyaUserId, note: 'Submitted via citizen portal. Tracking ID issued.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk Officer verification in progress.' },
          { from: 'UNDER_REVIEW', to: 'INFO_REQUESTED', actorId: doUserId, note: 'Desk Officer requested device serial number and purchase receipt.' }
        ],
        notifications: [
          { message: 'Clarification Required: Desk Officer ASI Sunita Devi requested device serial number or purchase invoice for CMP-2026-000020.', isRead: false }
        ]
      },
      {
        trackingId: 'CMP-2026-000003',
        firNumber: null,
        status: 'REJECTED',
        priority: 3,
        categoryId: catMap['Cheating / Financial Fraud'],
        stationId: 1,
        incidentDt: '2026-01-10T11:00:00Z',
        locationText: 'Vasant Vihar Commercial Complex',
        description: 'Commercial contractual breach regarding delayed delivery of office fixtures despite payment of 50% advance.',
        rejectionReason: 'Non-cognizable dispute under BNSS Section 173. Civil dispute over commercial service contract. Matter advised to proceed via Civil / Commercial Court.',
        history: [
          { from: null, to: 'DRAFT', actorId: priyaUserId, note: 'Complaint drafted online.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: priyaUserId, note: 'Submitted via citizen portal.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Station legal triage initiated.' },
          { from: 'UNDER_REVIEW', to: 'REJECTED', actorId: shoUserId, note: 'Marked non-cognizable civil contract dispute. Complainant advised on civil remedies.' }
        ],
        notifications: [
          { message: 'Intake Decision: Complaint CMP-2026-000003 marked Non-Cognizable. Section 173(4) statutory supervisory appeal available.', isRead: true }
        ]
      },
      {
        trackingId: 'CMP-2026-000001',
        firNumber: 'FIR/CPS-01/2026/00001',
        status: 'CLOSED',
        priority: 2,
        categoryId: catMap['Theft / Burglary'],
        stationId: 1,
        incidentDt: '2026-01-05T09:00:00Z',
        locationText: 'Residential Parking Bay, Green Avenue, City Centre',
        description: 'Stolen Honda Activa two-wheeler scooter (Reg: DL-01-AB-1234) from residential apartment parking lot.',
        case: {
          currentIoId: ioOfficerId,
          reportType: 'CHARGESHEET',
          outcome: 'Vehicle recovered and released on Superdari bond. Chargesheet filed before Court of Metropolitan Magistrate #03.',
          closedAt: '2026-01-28T16:00:00Z'
        },
        sections: [secMap['BNS_303(2)']].filter(Boolean),
        history: [
          { from: null, to: 'DRAFT', actorId: priyaUserId, note: 'Complaint drafted online.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: priyaUserId, note: 'Submitted via citizen portal.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk verification complete.' },
          { from: 'UNDER_REVIEW', to: 'REGISTERED', actorId: shoUserId, note: 'FIR registered under BNS 303(2).' },
          { from: 'REGISTERED', to: 'ASSIGNED', actorId: shoUserId, note: 'Assigned to SI Vikram Singh.' },
          { from: 'ASSIGNED', to: 'UNDER_INVESTIGATION', actorId: ioUserId, note: 'Stolen vehicle located via ANPR camera network.' },
          { from: 'UNDER_INVESTIGATION', to: 'PENDING_APPROVAL', actorId: ioUserId, note: 'Final investigation report and chargesheet drafted.' },
          { from: 'PENDING_APPROVAL', to: 'CHARGESHEET_FILED', actorId: shoUserId, note: 'Chargesheet approved by SHO Rajesh Sharma and submitted to Court.' },
          { from: 'CHARGESHEET_FILED', to: 'CLOSED', actorId: shoUserId, note: 'Case concluded and judicial outcome recorded.' }
        ],
        notifications: [
          { message: 'Case Finalized: Chargesheet filed and case closed for FIR/CPS-01/2026/00001.', isRead: true }
        ]
      },
      // 5. Awaiting SHO FIR Registration (Desk Officer completed inquiry and recommended registration)
      {
        trackingId: 'CMP-2026-000088',
        firNumber: null,
        status: 'UNDER_REVIEW',
        priority: 1,
        categoryId: catMap['Cyber Crime'],
        stationId: 1,
        complainantId: aaravCitizenId,
        complainantUserId: aaravUserId,
        incidentDt: '2026-02-27T11:20:00Z',
        locationText: 'City Centre Cyber Plaza, Sector 17',
        description: 'Phishing syndicate impersonating police cyber cell extorted funds via spoofed UPI payment gateway. Immediate freeze and FIR requested under BNS 318.',
        sections: [secMap['BNS_318'], secMap['IT_ACT_66C']].filter(Boolean),
        history: [
          { from: null, to: 'DRAFT', actorId: aaravUserId, note: 'Complaint submitted online via citizen portal.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: aaravUserId, note: 'Official tracking receipt issued.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk Officer ASI Sunita Devi completed preliminary scrutiny. Cognizable offence established under BNS 318 & IT Act 66C. Recommended for immediate FIR registration by SHO.' }
        ]
      },
      // 6. Awaiting IO Assignment (FIR registered by SHO, awaiting designation of IO)
      {
        trackingId: 'CMP-2026-000089',
        firNumber: 'FIR/CPS-01/2026/00089',
        status: 'REGISTERED',
        priority: 2,
        categoryId: catMap['Theft / Burglary'],
        stationId: 1,
        complainantId: aaravCitizenId,
        complainantUserId: aaravUserId,
        incidentDt: '2026-02-26T18:45:00Z',
        locationText: 'Metro Station North Gate, Sector 17',
        description: 'Snatching of gold chain and smartphone by two unidentified motorcycle riders near pedestrian crossing.',
        case: {
          currentIoId: null
        },
        sections: [secMap['BNS_303(2)']].filter(Boolean),
        history: [
          { from: null, to: 'DRAFT', actorId: aaravUserId, note: 'Complaint filed.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: aaravUserId, note: 'Intake logged.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk verification verified CCTV availability.' },
          { from: 'UNDER_REVIEW', to: 'REGISTERED', actorId: shoUserId, note: 'FIR registered under BNS 303(2) by SHO Inspector Rajesh Sharma. Awaiting IO assignment.' }
        ]
      },
      // 7. Awaiting SHO Final Report Approval (IO submitted Chargesheet)
      {
        trackingId: 'CMP-2026-000090',
        firNumber: 'FIR/CPS-01/2026/00090',
        status: 'PENDING_APPROVAL',
        priority: 2,
        categoryId: catMap['Assault / Physical Violence'],
        stationId: 1,
        complainantId: aaravCitizenId,
        complainantUserId: aaravUserId,
        incidentDt: '2026-02-20T21:00:00Z',
        locationText: 'Community Hall Outer Road, Sector 17',
        description: 'Assault with blunt object resulting in grievous hurt. Medico-legal certificate (MLC) attached. Suspect identified and chargesheet prepared.',
        case: {
          currentIoId: ioOfficerId,
          reportType: 'CHARGESHEET',
          outcome: null
        },
        sections: [secMap['BNS_115(2)']].filter(Boolean),
        updates: [
          {
            type: 'STATEMENT',
            body: 'Recorded formal statement of eyewitness and injured victim Aarav Patel under BNSS Section 180.',
            visibleToCitizen: true
          },
          {
            type: 'ARREST',
            body: 'Suspect intercepted and apprehended. Memo of arrest executed in accordance with BNSS guidelines.',
            visibleToCitizen: true
          }
        ],
        persons: [
          {
            role: 'VICTIM',
            fullName: 'Aarav Patel',
            contact: '+91 98111 54321',
            address: 'Sector 17, City Centre',
            notes: 'Injured victim. MLC document #MLC-2026-889 attached.'
          },
          {
            role: 'ACCUSED',
            fullName: 'Rakesh alias Rocky',
            contact: '+91 98222 11009',
            address: 'Slum Cluster, Railway Colony Outer',
            notes: 'Arrested accused. Weapon of offence recovered.'
          }
        ],
        history: [
          { from: null, to: 'DRAFT', actorId: aaravUserId, note: 'Complaint submitted.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: aaravUserId, note: 'Intake docket created.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk Officer verified MLC documentation.' },
          { from: 'UNDER_REVIEW', to: 'REGISTERED', actorId: shoUserId, note: 'FIR registered by SHO.' },
          { from: 'REGISTERED', to: 'ASSIGNED', actorId: shoUserId, note: 'Assigned to SI Vikram Singh.' },
          { from: 'ASSIGNED', to: 'UNDER_INVESTIGATION', actorId: ioUserId, note: 'Investigation commenced. Statements recorded under BNSS 180.' },
          { from: 'UNDER_INVESTIGATION', to: 'PENDING_APPROVAL', actorId: ioUserId, note: 'Investigation complete. Final chargesheet under BNS 115(2) submitted to SHO for approval before filing in court.' }
        ]
      },
      // 8. Assigned Case awaiting IO Docket Acceptance
      {
        trackingId: 'CMP-2026-000091',
        firNumber: 'FIR/CPS-01/2026/00091',
        status: 'ASSIGNED',
        priority: 1,
        categoryId: catMap['Theft / Burglary'],
        stationId: 1,
        complainantId: aaravCitizenId,
        complainantUserId: aaravUserId,
        incidentDt: '2026-02-28T03:30:00Z',
        locationText: 'House 42-B, Officers Colony, Sector 17',
        description: 'Night-time residential burglary and breaking into locked house. Stolen gold jewelry, silver coins and emergency cash while occupants were traveling.',
        case: {
          currentIoId: ioOfficerId
        },
        sections: [secMap['BNS_303(2)']].filter(Boolean),
        history: [
          { from: null, to: 'DRAFT', actorId: aaravUserId, note: 'Burglary complaint submitted.' },
          { from: 'DRAFT', to: 'SUBMITTED', actorId: aaravUserId, note: 'Intake logged.' },
          { from: 'SUBMITTED', to: 'UNDER_REVIEW', actorId: doUserId, note: 'Desk verification verified crime scene preservation.' },
          { from: 'UNDER_REVIEW', to: 'REGISTERED', actorId: shoUserId, note: 'FIR registered under BNS 303(2) by SHO Rajesh Sharma.' },
          { from: 'REGISTERED', to: 'ASSIGNED', actorId: shoUserId, note: 'Designated Investigating Officer Sub-Inspector Vikram Singh. Awaiting IO docket acceptance.' }
        ]
      }
    ];

    const activeTrackingIds = seedDockets.map(d => d.trackingId);

    // Keep Priya Sharma's complaint list clean (reassign any legacy test complaints to dummy test citizen if needed)
    await client.query(
      `UPDATE fir SET complainant_id = 13 WHERE complainant_id = $1 AND tracking_id NOT IN (${activeTrackingIds.map((_, i) => `$${i + 2}`).join(', ')})`,
      [priyaCitizenId, ...activeTrackingIds]
    );

    // Temporarily disable fir_status_guard trigger so development seed can synchronize docket statuses idempotently
    await client.query('ALTER TABLE fir DISABLE TRIGGER fir_status_guard');

    for (const d of seedDockets) {
      const complainantId = d.complainantId || priyaCitizenId;
      const complainantUser = d.complainantUserId || priyaUserId;

      let firId;
      const existingFir = await client.query(
        'SELECT fir_id FROM fir WHERE tracking_id = $1',
        [d.trackingId]
      );

      if (existingFir.rows.length === 0) {
        const insertRes = await client.query(
          `INSERT INTO fir (
            tracking_id, fir_number, complainant_id, station_id, category_id,
            incident_dt, location_text, description, status, priority, rejection_reason, submitted_at, registered_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING fir_id`,
          [
            d.trackingId,
            d.firNumber,
            complainantId,
            d.stationId,
            d.categoryId,
            d.incidentDt,
            d.locationText,
            d.description,
            d.status,
            d.priority,
            d.rejectionReason || null,
            d.incidentDt,
            d.firNumber ? d.incidentDt : null
          ]
        );
        firId = insertRes.rows[0].fir_id;
        console.log(`  -> Created docket ${d.trackingId} (ID: ${firId}, Status: ${d.status})`);
      } else {
        firId = existingFir.rows[0].fir_id;
        await client.query(
          `UPDATE fir SET 
            fir_number = $1, complainant_id = $2, station_id = $3, category_id = $4,
            incident_dt = $5, location_text = $6, description = $7, status = $8, priority = $9, rejection_reason = $10
           WHERE fir_id = $11`,
          [
            d.firNumber,
            complainantId,
            d.stationId,
            d.categoryId,
            d.incidentDt,
            d.locationText,
            d.description,
            d.status,
            d.priority,
            d.rejectionReason || null,
            firId
          ]
        );
        console.log(`  -> Synced docket ${d.trackingId} (ID: ${firId}, Status: ${d.status})`);
      }

      // Link case if registered
      if (d.case) {
        const caseExists = await client.query('SELECT case_id FROM cases WHERE fir_id = $1', [firId]);
        let caseId;
        if (caseExists.rows.length === 0) {
          const caseInsert = await client.query(
            `INSERT INTO cases (fir_id, current_io_id, investigation_started_at, report_type, outcome, closed_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING case_id`,
            [
              firId,
              d.case.currentIoId || null,
              d.case.investigationStartedAt || null,
              d.case.reportType || null,
              d.case.outcome || null,
              d.case.closedAt || null
            ]
          );
          caseId = caseInsert.rows[0].case_id;
        } else {
          caseId = caseExists.rows[0].case_id;
          await client.query(
            `UPDATE cases SET current_io_id = $1, report_type = $2, outcome = $3, closed_at = $4 WHERE case_id = $5`,
            [d.case.currentIoId || null, d.case.reportType || null, d.case.outcome || null, d.case.closedAt || null, caseId]
          );
        }

        // Evidence exhibits if provided
        if (d.evidence && d.evidence.length > 0) {
          for (const ev of d.evidence) {
            let evId;
            const evExists = await client.query('SELECT evidence_id FROM evidence WHERE evidence_no = $1', [ev.evidenceNo]);
            if (evExists.rows.length === 0) {
              const evInsert = await client.query(
                `INSERT INTO evidence (
                  case_id, evidence_no, evidence_type, description, collected_by, current_holder_id,
                  location_stored, status, file_name, file_sha256
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING evidence_id`,
                [
                  caseId,
                  ev.evidenceNo,
                  ev.type,
                  ev.description,
                  ioOfficerId,
                  ev.currentHolder || ioOfficerId,
                  ev.location,
                  ev.status,
                  ev.fileName,
                  ev.sha256
                ]
              );
              evId = evInsert.rows[0].evidence_id;

              // Initial collection custody log
              await client.query(
                `INSERT INTO evidence_custody_log (evidence_id, from_holder, to_holder, purpose, remarks)
                 VALUES ($1, NULL, $2, 'INITIAL_COLLECTION', 'Seized and cataloged at scene of incident')`,
                [evId, ioOfficerId]
              );
            } else {
              evId = evExists.rows[0].evidence_id;
            }

            // Custody chain transfer events if defined
            if (ev.custodyChain && ev.custodyChain.length > 0) {
              for (const cLog of ev.custodyChain) {
                const logExists = await client.query(
                  'SELECT log_id FROM evidence_custody_log WHERE evidence_id = $1 AND purpose = $2',
                  [evId, cLog.purpose]
                );
                if (logExists.rows.length === 0) {
                  await client.query(
                    `INSERT INTO evidence_custody_log (evidence_id, from_holder, to_holder, purpose, remarks)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [evId, cLog.fromHolder || ioOfficerId, cLog.toHolder || doOfficerId, cLog.purpose, cLog.remarks]
                  );
                }
              }
            }
          }
        }

        // Investigation Diary Updates if provided
        if (d.updates && d.updates.length > 0) {
          for (const up of d.updates) {
            const upExists = await client.query(
              'SELECT update_id FROM case_updates WHERE case_id = $1 AND body = $2',
              [caseId, up.body]
            );
            if (upExists.rows.length === 0) {
              await client.query(
                `INSERT INTO case_updates (case_id, officer_id, update_type, body, visible_to_citizen)
                 VALUES ($1, $2, $3, $4, $5)`,
                [caseId, ioOfficerId, up.type, up.body, Boolean(up.visibleToCitizen)]
              );
            }
          }
        }
      }

      // Persons Involved if provided
      if (d.persons && d.persons.length > 0) {
        for (const p of d.persons) {
          const pExists = await client.query(
            'SELECT person_id FROM fir_persons WHERE fir_id = $1 AND full_name = $2',
            [firId, p.fullName]
          );
          if (pExists.rows.length === 0) {
            await client.query(
              `INSERT INTO fir_persons (fir_id, person_role, full_name, contact, address, notes)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [firId, p.role, p.fullName, p.contact || null, p.address || null, p.notes || null]
            );
          }
        }
      }

      // Link legal sections if provided
      if (d.sections && d.sections.length > 0) {
        for (const secId of d.sections) {
          await client.query(
            `INSERT INTO fir_sections (fir_id, section_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [firId, secId]
          );
        }
      }

      // Link timeline status history
      if (d.history && d.history.length > 0) {
        for (const h of d.history) {
          const histExists = await client.query(
            'SELECT history_id FROM case_status_history WHERE fir_id = $1 AND to_state = $2',
            [firId, h.to]
          );
          if (histExists.rows.length === 0) {
            await client.query(
              `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
               VALUES ($1, $2, $3, $4, $5)`,
              [firId, h.from, h.to, h.actorId, h.note]
            );
          }
        }
      }

      // Link notifications
      if (d.notifications && d.notifications.length > 0) {
        for (const notif of d.notifications) {
          const notifExists = await client.query(
            'SELECT notification_id FROM notifications WHERE user_id = $1 AND fir_id = $2 AND message = $3',
            [complainantUser, firId, notif.message]
          );
          if (notifExists.rows.length === 0) {
            await client.query(
              `INSERT INTO notifications (user_id, fir_id, message, is_read)
               VALUES ($1, $2, $3, $4)`,
              [complainantUser, firId, notif.message, notif.isRead]
            );
          }
        }
      }
    }

    // Ensure 1 Pending Incoming Transfer to Station 1 for SHO queue demonstration
    const transferCheck = await client.query(
      `SELECT transfer_id FROM case_transfers WHERE to_station_id = 1 AND status = 'PENDING'`
    );
    if (transferCheck.rows.length === 0) {
      const st2Case = await client.query(
        `SELECT f.fir_id, c.case_id, f.status FROM fir f JOIN cases c ON f.fir_id = c.fir_id WHERE f.station_id = 2 AND f.status IN ('REGISTERED', 'UNDER_INVESTIGATION') LIMIT 1`
      );
      if (st2Case.rows.length > 0) {
        const c = st2Case.rows[0];
        await client.query(
          `INSERT INTO case_transfers (
            case_id, fir_id, from_station_id, to_station_id, transferred_by,
            transfer_reason, status, previous_status
          ) VALUES ($1, $2, 2, 1, $3, 'Jurisdiction realignment: Offence committed within Central PS municipal limit near Sector 17.', 'PENDING', $4)`,
          [c.case_id, c.fir_id, shoUserId, c.status]
        );
        console.log(`  -> Seeded incoming transfer for FIR ID ${c.fir_id} to Central PS`);
      }
    }

    // Ensure 1 Pending Appeal for Station 1
    const appealCheck = await client.query(
      `SELECT fa.appeal_id FROM fir_appeals fa JOIN fir f ON fa.fir_id = f.fir_id WHERE f.station_id = 1 AND fa.status = 'PENDING'`
    );
    if (appealCheck.rows.length === 0) {
      const rejectedFir = await client.query(
        `SELECT fir_id, complainant_id FROM fir WHERE tracking_id = 'CMP-2026-000003'`
      );
      if (rejectedFir.rows.length > 0) {
        await client.query(
          `INSERT INTO fir_appeals (fir_id, citizen_id, reason, status)
           VALUES ($1, $2, 'Statutory Supervisory Appeal under BNSS § 173(4): Material records indicate fraudulent diversion of funds constituting criminal breach under BNS 316 rather than purely civil contract dispute.', 'PENDING')`,
          [rejectedFir.rows[0].fir_id, rejectedFir.rows[0].complainant_id]
        );
      }
    }

    // Ensure 1 Stale Case for Supervisory SLA breach demonstration (>15 days = 360h inactive)
    await client.query(`
      UPDATE cases 
      SET created_at = NOW() - INTERVAL '19 days' 
      WHERE case_id = 5;
      UPDATE case_updates 
      SET created_at = NOW() - INTERVAL '19 days' 
      WHERE case_id = 5;
    `);

    // Re-enable trigger
    await client.query('ALTER TABLE fir ENABLE TRIGGER fir_status_guard');

    await client.query('COMMIT');
    console.log('--- Seed Completed Successfully! ---');
  } catch (error) {
    try {
      await client.query('ALTER TABLE fir ENABLE TRIGGER fir_status_guard');
    } catch (_) {}
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
