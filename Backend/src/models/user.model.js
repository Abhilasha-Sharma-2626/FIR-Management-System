const pool = require('../config/db');

/**
 * User database model / helper queries
 */
class UserModel {
  static async findByEmail(email) {
    const res = await pool.query(
      `SELECT u.user_id, u.email, u.phone, u.password_hash, u.is_active,
              u.failed_logins, u.locked_until, u.created_at,
              r.code AS role_code, r.role_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.email) = $1`,
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  static async findById(userId) {
    const res = await pool.query(
      `SELECT u.user_id, u.email, u.phone, u.is_active, u.created_at,
              r.code AS role_code, r.role_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  static async getPermissionsByRoleCode(roleCode) {
    const res = await pool.query(
      `SELECT p.code
       FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       JOIN roles r ON rp.role_id = r.role_id
       WHERE r.code = $1`,
      [roleCode]
    );
    return res.rows.map(row => row.code);
  }
}

module.exports = UserModel;
