// const express = require('express');
// const router = express.Router();

// /**
//  * Auth Routes
//  * Purpose: Secure entry points for user authentication and administrative registration.
//  * Update: Enabled signup route for authorized user management. ✅
//  */
// const { login, signup } = require('../controllers/authController');

// /**
//  * POST: User Login
//  * Endpoint: /api/auth/login
//  * Logic: Validates credentials and returns session context (User ID, Role, SBU).
//  */
// router.post('/login', login);

// /**
//  * POST: Administrative Signup (User Creation)
//  * Endpoint: /api/auth/signup
//  * Logic: Allows Super Admins to register new Managers and staff members securely. ✅
//  */
// router.post('/signup', signup);

// module.exports = router;






const express = require('express');
const router = express.Router();

/**
 * Auth Routes
 * Purpose: Secure entry points for user authentication and administrative registration.
 * Update: Integrated Data Validation for Login and Signup. ✅
 */
const { login, signup } = require('../controllers/authController');

// Importing Security & Validation Middlewares ✅
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * POST: User Login
 * Logic: Validates email format and password presence before authentication. ✅
 */
router.post('/login', validate(schemas.authLogin), login);

/**
 * POST: Administrative Signup (User Creation)
 * Logic: Ensures all required personnel data is valid and securely formatted. ✅
 */
router.post('/signup', validate(schemas.authSignup), signup);

module.exports = router;