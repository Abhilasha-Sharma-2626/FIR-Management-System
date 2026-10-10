const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'casesync_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || '15m';

/**
 * Hash plain text password using bcrypt
 */
async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare plain text password against stored hash
 */
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Sign a JWT with identity and scope payload
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify incoming JWT token against secret
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Sign a password reset JWT token with short expiry (15m)
 */
function generateResetToken(payload) {
  return jwt.sign({ ...payload, purpose: 'password_reset' }, JWT_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES_IN
  });
}

/**
 * Verify a password reset JWT token
 */
function verifyResetToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.purpose !== 'password_reset') {
    const error = new Error('Invalid token purpose');
    error.statusCode = 400;
    throw error;
  }
  return decoded;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateResetToken,
  verifyResetToken
};
