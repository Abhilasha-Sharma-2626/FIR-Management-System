const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

const JWT_SECRET = process.env.JWT_SECRET || 'casesync_default_secret_key';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function hashPassword(plainPassword){
  return await bcrypt.hash(plainPassword,SALT_ROUNDS);
}

async function comparePassword(plainPassword,hashedPassword){
  return await bcrypt.compare(plainPassword,hashedPassword);
}

function generateToken(payload){
  return jwt.sign(payload,JWT_SECRET,{expiresIn:JWT_EXPIRES_IN});
}

function verifyToken(token){
  return jwt.verify(token,JWT_SECRET);
}

module.exports={
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
