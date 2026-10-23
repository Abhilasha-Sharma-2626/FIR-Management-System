# Authentication & Authorization Implementation Guide (Team Split)

This guide documents the full design, architecture, and step-by-step code implementation for the **Authentication & Authorization System** of the Online FIR & Police Case Management System.

The work is divided into two distinct, decoupled parts for a team of 2 developers.

---

## 1. System Contract Between Both Members

To work in parallel without blocking each other or causing merge conflicts, both members agree on this contract:

### A. JWT Payload Structure
When Member 1 generates a token on login, its decrypted payload must follow:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "CITIZEN",
  "citizenId": 12,
  "officerId": null,
  "stationId": null
}
```

### B. Middleware & Request Context
Member 2 extracts and verifies this token, attaching `req.user = decodedPayload`. Any controller or middleware downstream can reliably access:
- `req.user.userId`
- `req.user.role`
- `req.user.stationId` (for officers)
- `req.user.citizenId` (for citizens)

---

## 2. Member Responsibilities Overview

| Task / Area | Member 1 | Member 2 |
|---|---|---|
| **Primary Domain** | Core Auth, Transactions & Security | Authorization, Middlewares & API Routing |
| **Files to Write** | `src/utils/auth.util.js`<br>`src/validators/auth.validator.js`<br>`src/services/auth.service.js` | `src/middlewares/auth.middleware.js`<br>`src/middlewares/rbac.middleware.js`<br>`src/controllers/auth.controller.js`<br>`src/routes/auth.route.js`<br>`src/app.js` (Route mounting) |
| **Database Interactions** | `users`, `citizens`, `login_attempts` transactions | `role_permissions`, `roles`, `permissions` checks |

---

# 👤 Member 1: Authentication Core & Transactions

## Task 1.1: Cryptography & Token Utility
**File:** `src/utils/auth.util.js`  
**Purpose:** Centralizes password hashing using `bcrypt` and JWT token signing and verification using `jsonwebtoken`.

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'casesync_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Hash plain text password using bcrypt
async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Compare plain text password against stored hash
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Sign a JWT with identity and scope payload
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify incoming token against the secret
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
```

---

## Task 1.2: Input Validation Helper
**File:** `src/validators/auth.validator.js`  
**Purpose:** Validates input structure before running database operations. Ensures password length, email formats, and only storing the last 4 digits of ID proof for privacy (PO7 - Ethics).

```javascript
function validateRegisterInput(data) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required.');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.push('Full name is required.');
  }

  if (data.phone && !/^\+?[0-9]{10,15}$/.test(data.phone)) {
    errors.push('Phone number must be between 10 and 15 digits.');
  }

  if (data.idProofLast4 && !/^[0-9]{4}$/.test(data.idProofLast4)) {
    errors.push('idProofLast4 must be exactly 4 digits.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLoginInput(data) {
  const errors = [];

  if (!data.email || !data.email.trim()) {
    errors.push('Email is required.');
  }

  if (!data.password) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
```

---

## Task 1.3: Auth Service & Database Transactions
**File:** `src/services/auth.service.js`  
**Purpose:** 
- Runs citizen registration in an **ACID transaction** (`BEGIN` ... `COMMIT`).
- Checks user existence and password validity.
- Enforces account lockout after 5 consecutive failed attempts (for 15 minutes) to prevent brute force attacks.
- Records attempts in `login_attempts`.

```javascript
const pool = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth.util');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Registers a citizen in a single ACID transaction across users and citizens tables
 */
async function registerCitizen({ email, phone, password, fullName, dob, address, idProofType, idProofLast4 }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check uniqueness of email and phone
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1 OR (phone = $2 AND phone IS NOT NULL)',
      [email, phone || null]
    );

    if (existingUser.rows.length > 0) {
      const err = new Error('Email or phone already registered');
      err.statusCode = 409;
      throw err;
    }

    // 2. Fetch CITIZEN role ID
    const roleRes = await client.query("SELECT role_id FROM roles WHERE code = 'CITIZEN'");
    if (roleRes.rows.length === 0) {
      throw new Error("CITIZEN role does not exist in the database");
    }
    const roleId = roleRes.rows[0].role_id;

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Insert into users
    const userRes = await client.query(
      `INSERT INTO users (email, phone, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, phone, created_at`,
      [email, phone || null, hashedPassword, roleId]
    );
    const newUser = userRes.rows[0];

    // 5. Insert into citizens profile
    const citizenRes = await client.query(
      `INSERT INTO citizens (user_id, full_name, dob, address, id_proof_type, id_proof_last4)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING citizen_id, full_name, address, id_proof_type, id_proof_last4`,
      [newUser.user_id, fullName, dob || null, address || null, idProofType || null, idProofLast4 || null]
    );
    const newCitizen = citizenRes.rows[0];

    await client.query('COMMIT');

    return {
      userId: newUser.user_id,
      email: newUser.email,
      phone: newUser.phone,
      role: 'CITIZEN',
      citizen: newCitizen
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Authenticates user, checks lockouts, and generates JWT
 */
async function loginUser({ email, password, ipAddress }) {
  const client = await pool.connect();
  try {
    // 1. Fetch user + role + citizen/officer profile details
    const userQuery = `
      SELECT u.user_id, u.email, u.phone, u.password_hash, u.is_active,
             u.failed_logins, u.locked_until, r.code AS role_code,
             c.citizen_id, c.full_name AS citizen_name,
             o.officer_id, o.badge_no, o.rank, o.station_id, o.full_name AS officer_name,
             ps.name AS station_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN citizens c ON u.user_id = c.user_id
      LEFT JOIN officers o ON u.user_id = o.user_id
      LEFT JOIN police_stations ps ON o.station_id = ps.station_id
      WHERE u.email = $1;
    `;
    const userRes = await client.query(userQuery, [email]);

    if (userRes.rows.length === 0) {
      await logLoginAttempt(client, email, false, ipAddress);
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const user = userRes.rows[0];

    // 2. Check if deactivated
    if (!user.is_active) {
      const err = new Error('Account is deactivated. Please contact support.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Check brute force lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (1000 * 60));
      const err = new Error(`Account temporarily locked due to multiple failed attempts. Try again in ${remainingMinutes} minute(s).`);
      err.statusCode = 423;
      throw err;
    }

    // 4. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const newFailedCount = user.failed_logins + 1;
      const params = [newFailedCount, user.user_id];

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        await client.query(
          `UPDATE users 
           SET failed_logins = $1, 
               locked_until = NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes'
           WHERE user_id = $2`,
          params
        );
      } else {
        await client.query(
          `UPDATE users SET failed_logins = $1 WHERE user_id = $2`,
          params
        );
      }

      await logLoginAttempt(client, email, false, ipAddress);
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // 5. Successful login: reset failed counters
    await client.query(
      `UPDATE users SET failed_logins = 0, locked_until = NULL WHERE user_id = $1`,
      [user.user_id]
    );
    await logLoginAttempt(client, email, true, ipAddress);

    // 6. Fetch permissions for user's role
    const permsRes = await client.query(
      `SELECT p.code 
       FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       JOIN roles r ON rp.role_id = r.role_id
       WHERE r.code = $1`,
      [user.role_code]
    );
    const permissions = permsRes.rows.map(row => row.code);

    // 7. Token payload
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
        stationId: user.station_id || null,
        stationName: user.station_name || null,
        permissions
      }
    };
  } finally {
    client.release();
  }
}

async function logLoginAttempt(client, identifier, success, ipAddress) {
  try {
    await client.query(
      `INSERT INTO login_attempts (identifier, success, ip_address)
       VALUES ($1, $2, $3)`,
      [identifier, success, ipAddress || null]
    );
  } catch (err) {
    console.error('Error logging login attempt:', err.message);
  }
}

module.exports = {
  registerCitizen,
  loginUser
};
```

---

# 👤 Member 2: Authorization, Middlewares & API Routing

## Task 2.1: Authentication Middleware
**File:** `src/middlewares/auth.middleware.js`  
**Purpose:** Intercepts requests, validates the Bearer token, and attaches `req.user`.

```javascript
const { verifyToken } = require('../utils/auth.util');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Sets { userId, email, role, stationId, citizenId, officerId }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

module.exports = {
  authenticate
};
```

---

## Task 2.2: RBAC & Scope Middleware
**File:** `src/middlewares/rbac.middleware.js`  
**Purpose:** Enforces role-based permissions, data-driven permission checks from the database, and police station jurisdiction boundaries.

```javascript
const pool = require('../config/db');

// 1. Role-based guard
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the required role to perform this action.'
      });
    }
    next();
  };
}

// 2. Data-driven permission guard (queries role_permissions)
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const checkRes = await pool.query(
        `SELECT 1
         FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE r.code = $1 AND p.code = $2`,
        [req.user.role, permissionCode]
      );

      if (checkRes.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permission '${permissionCode}'`
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Permission verification failed' });
    }
  };
}

// 3. Station jurisdictional scope guard
function requireStationScope(stationIdParamKey = 'stationId') {
  return (req, res, next) => {
    const targetStationId = parseInt(req.params[stationIdParamKey] || req.body[stationIdParamKey], 10);

    // SUPERVISOR and ADMIN have district/system-wide jurisdiction
    if (['SUPERVISOR', 'ADMIN'].includes(req.user.role)) {
      return next();
    }

    if (!req.user.stationId || req.user.stationId !== targetStationId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have jurisdiction in this police station.'
      });
    }
    next();
  };
}

module.exports = {
  requireRole,
  requirePermission,
  requireStationScope
};
```

---

## Task 2.3: Auth Controller
**File:** `src/controllers/auth.controller.js`  
**Purpose:** Handles HTTP requests, triggers validation, executes auth service functions, and formats standard JSON responses.

```javascript
const authService = require('../services/auth.service');
const { validateRegisterInput, validateLoginInput } = require('../validators/auth.validator');

async function register(req, res) {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await authService.registerCitizen(req.body);
    return res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
}

async function login(req, res) {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = await authService.loginUser({
      email: req.body.email,
      password: req.body.password,
      ipAddress
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
}

async function getMe(req, res) {
  try {
    // req.user was attached by the authenticate middleware
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching current user profile'
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
```

---

## Task 2.4: Auth Route Definition
**File:** `src/routes/auth.route.js`  
**Purpose:** Defines API endpoints and wires up the `authenticate` middleware.

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected endpoint
router.get('/me', authenticate, authController.getMe);

module.exports = router;
```

---

## Task 2.5: Express Route Mounting
**File:** `src/app.js`  
**Purpose:** Mounts `/api/auth` onto the Express application.

```javascript
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.route');

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Server is running on port 5000'
  });
});

module.exports = app;
```

---

## 3. How to Test the Entire Flow Together

Once both members have placed their code in their respective files:

1. **Start the server:**
   ```powershell
   npm run dev
   ```

2. **Test 1: Citizen Registration (`POST /api/auth/register`)**
   ```http
   POST http://localhost:5000/api/auth/register
   Content-Type: application/json

   {
     "email": "priya.citizen@example.com",
     "password": "Password@123",
     "fullName": "Priya Sharma",
     "phone": "9876543210",
     "idProofType": "AADHAAR",
     "idProofLast4": "5678"
   }
   ```
   *Expected Response:* `201 Created` with citizen ID and masked data.

3. **Test 2: Citizen Login (`POST /api/auth/login`)**
   ```http
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "email": "priya.citizen@example.com",
     "password": "Password@123"
   }
   ```
   *Expected Response:* `200 OK` with a signed JWT `token`.

4. **Test 3: Accessing Protected Profile (`GET /api/auth/me`)**
   ```http
   GET http://localhost:5000/api/auth/me
   Authorization: Bearer <PASTE_YOUR_TOKEN_HERE>
   ```
   *Expected Response:* `200 OK` with decoded payload (`role: "CITIZEN"`).
   *Negative Test:* Try calling without `Authorization` header $\to$ `401 Unauthorized`.
