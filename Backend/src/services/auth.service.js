const pool = require('../config/db');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateResetToken,
  verifyResetToken
} = require('../utils/auth.util');
const { logAuditEvent } = require('./audit.service');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Registers a citizen in a single ACID transaction across users and citizens tables
 * Logs USER_REGISTERED event to audit_log (PROJECT_CONTEXT.md §7.1, §9.1)
 */
async function registerCitizen({
  email,
  phone,
  password,
  fullName,
  fullname,
  dob,
  address,
  idProofType,
  idProofLast4,
  ipAddress
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check uniqueness of email and phone in users table
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1 OR (phone IS NOT NULL AND phone = $2)',
      [email.toLowerCase().trim(), phone || null]
    );

    if (existingUser.rows.length > 0) {
      const err = new Error('Email or phone already registered');
      err.statusCode = 409;
      throw err;
    }

    // 2. Fetch CITIZEN role ID
    const roleRes = await client.query("SELECT role_id FROM roles WHERE code = 'CITIZEN'");
    if (roleRes.rows.length === 0) {
      const err = new Error('CITIZEN role does not exist in the database');
      err.statusCode = 500;
      throw err;
    }
    const roleId = roleRes.rows[0].role_id;

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Insert into users table
    const userRes = await client.query(
      `INSERT INTO users (email, phone, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, phone, created_at`,
      [email.toLowerCase().trim(), phone || null, hashedPassword, roleId]
    );
    const newUser = userRes.rows[0];

    // 5. Insert into citizens profile table
    const citizenName = (fullName || fullname || '').trim();
    const citizenRes = await client.query(
      `INSERT INTO citizens (user_id, full_name, dob, address, id_proof_type, id_proof_last4)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING citizen_id, full_name, address, id_proof_type, id_proof_last4`,
      [
        newUser.user_id,
        citizenName,
        dob || null,
        address || null,
        idProofType || null,
        idProofLast4 || null
      ]
    );
    const newCitizen = citizenRes.rows[0];

    // 6. Append audit log entry (PROJECT_CONTEXT.md §7.1, §9.1)
    await logAuditEvent({
      client,
      actorId: newUser.user_id,
      actorRole: 'CITIZEN',
      action: 'USER_REGISTERED',
      entityType: 'citizen',
      entityId: newCitizen.citizen_id,
      newData: {
        userId: newUser.user_id,
        email: newUser.email,
        phone: newUser.phone,
        fullName: newCitizen.full_name,
        idProofType: newCitizen.id_proof_type,
        idProofLast4: newCitizen.id_proof_last4
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
      role: 'CITIZEN',
      citizen: newCitizen
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Authenticates user, checks lockouts, records attempts, writes audit log, and generates JWT
 */
async function loginUser({ email, password, ipAddress }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const client = await pool.connect();
  try {
    const userQuery = `
      SELECT u.user_id, u.email, u.phone, u.password_hash, u.is_active,
             u.failed_logins, u.locked_until, r.code AS role_code,
             c.citizen_id, c.full_name AS citizen_name,
             o.officer_id, o.badge_no, o.rank, o.station_id, o.full_name AS officer_name,
             ps.name AS station_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN citizens c ON u.user_id = c.user_id
      LEFT JOIN officers o ON u.user_id = o.user_id
      LEFT JOIN police_stations ps ON o.station_id = ps.station_id
      WHERE LOWER(u.email) = $1;
    `;
    const userRes = await client.query(userQuery, [normalizedEmail]);

    if (userRes.rows.length === 0) {
      await logLoginAttempt(client, normalizedEmail, false, ipAddress);
      await logAuditEvent({
        actorId: null,
        actorRole: null,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        newData: { email: normalizedEmail, reason: 'User not found' },
        ipAddress
      });
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const user = userRes.rows[0];

    // Check if account is active
    if (!user.is_active) {
      await logAuditEvent({
        actorId: user.user_id,
        actorRole: user.role_code,
        action: 'LOGIN_FAILED',
        entityType: 'user',
        entityId: user.user_id,
        newData: { reason: 'Account deactivated' },
        ipAddress
      });
      const err = new Error('Account is deactivated. Please contact support.');
      err.statusCode = 403;
      throw err;
    }

    // Check account lockout (PROJECT_CONTEXT.md §5.1 FR-A3)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (1000 * 60));
      await logAuditEvent({
        actorId: user.user_id,
        actorRole: user.role_code,
        action: 'LOGIN_FAILED',
        entityType: 'user',
        entityId: user.user_id,
        newData: { reason: 'Account locked', remainingMinutes },
        ipAddress
      });
      const err = new Error(
        `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`
      );
      err.statusCode = 423;
      throw err;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const newFailedCount = (user.failed_logins || 0) + 1;
      const isLockingNow = newFailedCount >= MAX_FAILED_ATTEMPTS;

      if (isLockingNow) {
        await client.query(
          `UPDATE users
           SET failed_logins = $1,
               locked_until = NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes'
           WHERE user_id = $2`,
          [newFailedCount, user.user_id]
        );
        // Log account lockout audit event (PROJECT_CONTEXT.md §9.1)
        await logAuditEvent({
          actorId: user.user_id,
          actorRole: user.role_code,
          action: 'ACCOUNT_LOCKED',
          entityType: 'user',
          entityId: user.user_id,
          newData: { failedAttempts: newFailedCount, lockoutMinutes: LOCKOUT_MINUTES },
          ipAddress
        });
      } else {
        await client.query(
          `UPDATE users SET failed_logins = $1 WHERE user_id = $2`,
          [newFailedCount, user.user_id]
        );
      }

      await logLoginAttempt(client, normalizedEmail, false, ipAddress);
      await logAuditEvent({
        actorId: user.user_id,
        actorRole: user.role_code,
        action: 'LOGIN_FAILED',
        entityType: 'user',
        entityId: user.user_id,
        newData: { failedAttempts: newFailedCount, locked: isLockingNow },
        ipAddress
      });

      const err = new Error(
        isLockingNow
          ? `Account locked due to ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`
          : 'Invalid email or password'
      );
      err.statusCode = isLockingNow ? 423 : 401;
      throw err;
    }

    // Successful login: reset failed logins & locked_until
    await client.query(
      `UPDATE users SET failed_logins = 0, locked_until = NULL WHERE user_id = $1`,
      [user.user_id]
    );

    await logLoginAttempt(client, normalizedEmail, true, ipAddress);

    // Audit log: LOGIN_SUCCESS (PROJECT_CONTEXT.md §9.1)
    await logAuditEvent({
      actorId: user.user_id,
      actorRole: user.role_code,
      action: 'LOGIN_SUCCESS',
      entityType: 'user',
      entityId: user.user_id,
      ipAddress
    });

    // Fetch permissions mapped to user's role
    const permsRes = await client.query(
      `SELECT p.code
       FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       JOIN roles r ON rp.role_id = r.role_id
       WHERE r.code = $1`,
      [user.role_code]
    );
    const permissions = permsRes.rows.map(row => row.code);

    // Standardized token payload per team contract
    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role_code,
      citizenId: user.citizen_id || null,
      officerId: user.officer_id || null,
      stationId: user.station_id || null
    };

    const token = generateToken(payload);

    return {
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        phone: user.phone,
        role: user.role_code,
        fullName: user.citizen_name || user.officer_name || null,
        citizenId: user.citizen_id || null,
        officerId: user.officer_id || null,
        badgeNo: user.badge_no || null,
        rank: user.rank || null,
        stationId: user.station_id || null,
        stationName: user.station_name || null,
        permissions
      }
    };
  } finally {
    client.release();
  }
}

/**
 * Officer registration by ADMIN only (PROJECT_CONTEXT.md §5.1 FR-A4)
 */
async function registerOfficer({
  email,
  phone,
  password,
  fullName,
  badgeNo,
  rank,
  role,
  stationId,
  adminUserId,
  ipAddress
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check uniqueness of email, phone, and badge number
    const existing = await client.query(
      `SELECT 'email' AS field FROM users WHERE LOWER(email) = $1
       UNION
       SELECT 'phone' AS field FROM users WHERE phone IS NOT NULL AND phone = $2
       UNION
       SELECT 'badge_no' AS field FROM officers WHERE badge_no = $3`,
      [normalizedEmail, phone || null, badgeNo.trim()]
    );

    if (existing.rows.length > 0) {
      const field = existing.rows[0].field;
      const err = new Error(`${field.replace('_', ' ')} is already registered`);
      err.statusCode = 409;
      throw err;
    }

    // 2. Validate station existence if stationId provided
    if (stationId) {
      const stationRes = await client.query(
        'SELECT station_id FROM police_stations WHERE station_id = $1',
        [stationId]
      );
      if (stationRes.rows.length === 0) {
        const err = new Error(`Police station with ID ${stationId} does not exist`);
        err.statusCode = 404;
        throw err;
      }
    }

    // 3. Fetch role ID
    const roleRes = await client.query('SELECT role_id FROM roles WHERE code = $1', [role]);
    if (roleRes.rows.length === 0) {
      const err = new Error(`Role '${role}' does not exist in the database`);
      err.statusCode = 400;
      throw err;
    }
    const roleId = roleRes.rows[0].role_id;

    // 4. Hash password
    const hashedPassword = await hashPassword(password);

    // 5. Insert into users
    const userRes = await client.query(
      `INSERT INTO users (email, phone, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, phone, created_at`,
      [normalizedEmail, phone || null, hashedPassword, roleId]
    );
    const newUser = userRes.rows[0];

    // 6. Insert into officers
    const officerRes = await client.query(
      `INSERT INTO officers (user_id, badge_no, full_name, rank, station_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING officer_id, badge_no, full_name, rank, station_id`,
      [newUser.user_id, badgeNo.trim(), fullName.trim(), rank.trim(), stationId || null]
    );
    const newOfficer = officerRes.rows[0];

    // 7. Append audit log entry (PROJECT_CONTEXT.md §9.1: OFFICER_CREATED)
    await logAuditEvent({
      client,
      actorId: adminUserId,
      actorRole: 'ADMIN',
      action: 'OFFICER_CREATED',
      entityType: 'officer',
      entityId: newOfficer.officer_id,
      newData: {
        userId: newUser.user_id,
        email: newUser.email,
        badgeNo: newOfficer.badge_no,
        rank: newOfficer.rank,
        role,
        stationId: newOfficer.station_id,
        fullName: newOfficer.full_name
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
      role,
      officer: newOfficer
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Request password reset (FR-A5: mock email token flow)
 */
async function forgotPassword({ email, ipAddress }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const res = await pool.query(
    'SELECT user_id, email, is_active FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    // Return friendly generic message to prevent account enumeration
    return {
      message: 'If the provided email is registered, a password reset token has been generated.'
    };
  }

  const user = res.rows[0];
  if (!user.is_active) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }

  const resetToken = generateResetToken({
    userId: user.user_id,
    email: user.email
  });

  await logAuditEvent({
    actorId: user.user_id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'user',
    entityId: user.user_id,
    newData: { email: user.email },
    ipAddress
  });

  return {
    message: 'If the provided email is registered, a password reset token has been generated.',
    // Returning resetToken for simulated email delivery testing
    simulatedResetToken: resetToken
  };
}

/**
 * Reset password using token (PROJECT_CONTEXT.md §5.1 FR-A5)
 */
async function resetPassword({ token, newPassword, ipAddress }) {
  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch (err) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(newPassword);

  const updateRes = await pool.query(
    `UPDATE users
     SET password_hash = $1, failed_logins = 0, locked_until = NULL
     WHERE user_id = $2
     RETURNING user_id, email`,
    [hashedPassword, decoded.userId]
  );

  if (updateRes.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  await logAuditEvent({
    actorId: decoded.userId,
    action: 'PASSWORD_RESET',
    entityType: 'user',
    entityId: decoded.userId,
    newData: { email: decoded.email },
    ipAddress
  });

  return {
    message: 'Password reset successful. You can now log in with your new password.'
  };
}

/**
 * Logs out user and records LOGOUT in audit_log
 */
async function logoutUser({ userId, role, ipAddress }) {
  if (userId) {
    await logAuditEvent({
      actorId: userId,
      actorRole: role,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      ipAddress
    });
  }
  return { message: 'Logged out successfully' };
}

/**
 * Fetch fresh current user profile with roles, profile data, and permissions
 */
async function getCurrentUserProfile(userId) {
  const query = `
    SELECT u.user_id, u.email, u.phone, u.is_active, u.created_at,
           r.code AS role_code, r.description AS role_description,
           c.citizen_id, c.full_name AS citizen_name, c.address, c.dob, c.id_proof_type, c.id_proof_last4,
           o.officer_id, o.badge_no, o.rank, o.station_id, o.full_name AS officer_name,
           ps.code AS station_code, ps.name AS station_name, ps.district AS station_district
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN citizens c ON u.user_id = c.user_id
    LEFT JOIN officers o ON u.user_id = o.user_id
    LEFT JOIN police_stations ps ON o.station_id = ps.station_id
    WHERE u.user_id = $1;
  `;
  const res = await pool.query(query, [userId]);
  if (res.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const user = res.rows[0];

  const permsRes = await pool.query(
    `SELECT p.code
     FROM permissions p
     JOIN role_permissions rp ON p.permission_id = rp.permission_id
     JOIN roles r ON rp.role_id = r.role_id
     WHERE r.code = $1`,
    [user.role_code]
  );
  const permissions = permsRes.rows.map(row => row.code);

  return {
    userId: user.user_id,
    email: user.email,
    phone: user.phone,
    role: user.role_code,
    roleDescription: user.role_description,
    fullName: user.citizen_name || user.officer_name || null,
    citizen: user.citizen_id
      ? {
          citizenId: user.citizen_id,
          fullName: user.citizen_name,
          address: user.address,
          dob: user.dob,
          idProofType: user.id_proof_type,
          idProofLast4: user.id_proof_last4
        }
      : null,
    officer: user.officer_id
      ? {
          officerId: user.officer_id,
          badgeNo: user.badge_no,
          rank: user.rank,
          stationId: user.station_id,
          stationCode: user.station_code,
          stationName: user.station_name,
          stationDistrict: user.station_district
        }
      : null,
    permissions
  };
}

async function logLoginAttempt(client, identifier, success, ipAddress) {
  try {
    await client.query(
      `INSERT INTO login_attempts (identifier, success, ip_address)
       VALUES ($1, $2, $3)`,
      [identifier, success, ipAddress || null]
    );
  } catch (error) {
    console.error('Error logging login attempt:', error.message);
  }
}

module.exports = {
  registerCitizen,
  loginUser,
  registerOfficer,
  forgotPassword,
  resetPassword,
  logoutUser,
  getCurrentUserProfile
};