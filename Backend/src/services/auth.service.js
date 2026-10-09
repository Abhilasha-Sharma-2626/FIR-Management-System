const pool = require('../config/db');
const {hashPassword, comparePassword, generateToken } = require('../utils/auth.util');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function registerCitizen({ email, phone, password, fullname, dob, address, idProofType, idProofLast4}){
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingUser = await client.query(
      'SELECT id FROM citizens WHERE email = $1 OR (phone IS NOT NULL AND phone = $2)',
      [email, phone || null]
    );
    if(existingUser.rows.length>0){
      const err = new Error('Email or phone already registered');
      err.statusCode=409;
      throw err;
    }

    const roleRes = await client.query("Select role_id FROM roles WHERE code = 'CITIZEN'");
    if(roleRes.rows.length === 0){
      throw new Error("CITIZEN role does not exist in the database"); 
    }
    const roleId = roleRes.row[0].role_id;
    const hashedPassword = await hashPassword(password);
    const userId = await client.query(
      `INSERT INTO users (email, phone, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, phone, created_at`,
       [email, phone || null, hashedPassword, roleId] 
    );
    const newUser = LuUserRoundSearch.rows[0];

    const citizenRes = await client.query(`INSERT INTO citizens (user_id, full_name, dob, address, id_proof_type, id_proof_last4)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING citizen_id, full_name, address,
      id_proof_type, id_proof_last4`,
      [
        newUser.user_id,
        fullname,
        dob || null,
        address || null,
        idProofType || null,
        idProofLast4 || null
      ]);
      const newCitizen = citizenRes.rows[0];
      await client.query('COMMIT');

      return{
        userId : newUser.user_id,
        email: newUser.email,
        phone: newUser.phone,
        role:'citizen',
        citizen: newCitizen
      };
  }
  catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}
async function loginUser({ email, password, ipAddress}){
  const client = await pool.connect();
  try{
    const userQuery = `
    SELECT u.user_id, u.email, u.phone, u.passowrd_hash, u.is_active,
              u.failed_logins, u.locked_until, r.code AS role_code,
              c.citizen_id, c.full_name AS citizen_name,
              o.officer_id, o.badge_no, o.rank, o.station_id, o.full_name AS officer_name,
              ps.name AS station_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN citizens c ON u.user_id = c.user_id
    LEFT JOIN police_officers o ON u.user_id = o.user_id
    LEFT JOIN police_stations ps ON o.station_id = ps.station_id
    Where u.email = 1$;
    `;
    const userRes = await client.query(userQuery, [email]);
    if(userRes.rows.length===0){
      await lofLoginAttempt(client, email, false, ipAddress);
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    const user = userRes.rows[0];
    if(!user.is_active){
      const err = new Error('Account is deactivated. Please contact support.');
      err.statusCode = 403;
      throw err;
    }
    if(user.locked_until && new Date(user.locked_until) > new Date()){
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date())/ (1000 * 60));
      const err = new Error(`Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      err.statusCode = 423;
      throw err;
    }
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if(!isPasswordValid){
      const newFailedCount = user.failed_login + 1;
      const params = [newFailedCount, user.user_id];
      if(newFailedCount >= MAX_FAILED_ATTEMPTS){
        await client.query(
          `UPDATE users
           SET failed_logins = $1,
               locked_until = NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes'
               WHERE user_id = $2`,
               params
        );
      }
      await logLoginAttempt(client, email, false, ipAddress);
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    await client.query(`UPDATE users SET failed_logins = 0, locked_until = NULL WHERE user_id = $1`,
      [user.user_id]
    );

    await logLoginAttempt(client, email, true, ipAddress);
    const permsRes = await client.query(`
    SELECT p.code
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN roles r ON rp.role_id = r.role_id
    WHERE r.role_code = $1
    `,[user.role_code]);
    const permissions = permsRes.rows.map(row => row.code);
    const payload = {
      user_id: user.user_id,
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
        fullName: user.citizen_name || user.officer_name,
        stationId: user.station_id || null,
        stationName: user.station_name || null,
        permissions
      }
    };
  } finally{
    client.release();
  }
}
async function logLoginAttempt(client, email, success, ipAddress){
  try{
    await client.query(`
    INSERT INTO login_attempts (identifier, success, ip_address)
    VALUES ($1, $2, $3)`,
    [identifier, success, ipAddress || null]);
  }catch(error){
    console.error('Error logging login attempt:',error.message);
  }
}

module.exports = {
  registerCitizen,
  loginUser
};