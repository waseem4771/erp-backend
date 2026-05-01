// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Logic for generating and managing secure API credentials for external site connectivity.
//  */
// const { generateApiKey, getSbuKeys } = require('../controllers/apiKeysController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Sales / API Gateway
//  * Every route below is guarded by the RBAC middleware.
//  * Verification: Ensures only authorized personnel can issue credentials to external websites.
//  */

// // --- 1. CREDENTIAL GENERATION ---
// /**
//  * POST: Generate New API Client ID and Secret Key
//  * Endpoint: http://localhost:5000/api/keys/generate
//  * Permission: Requires 'Sales' module access.
//  */
// router.post('/generate', checkPermission('Sales'), generateApiKey);


// // --- 2. CREDENTIAL REGISTRY ---
// /**
//  * GET: Retrieve list of active API keys for a specific SBU
//  * Endpoint: http://localhost:5000/api/keys/list?sbu_id=1
//  * Permission: Requires 'Sales' module access.
//  */
// router.get('/list', checkPermission('Sales'), getSbuKeys);


// module.exports = router;




const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for generating and managing secure API credentials for external site connectivity.
 */
const { generateApiKey, getSbuKeys } = require('../controllers/apiKeysController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * MODULE PROTECTION: Sales / API Gateway
 * Every route below is guarded by RBAC and Zod Validation layers. ✅
 */

// --- 1. CREDENTIAL GENERATION ---
/**
 * POST: Generate New API Client ID and Secret Key
 * Logic: Validates SBU ID, Platform Name, and Webhook URL format. ✅
 */
router.post(
    '/generate', 
    checkPermission('Sales'), 
    validate(schemas.generateApiKey), // Data validation added
    generateApiKey
);


// --- 2. CREDENTIAL REGISTRY ---
/**
 * GET: Retrieve list of active API keys for a specific SBU
 * Logic: Ensures sbu_id is passed correctly in query parameters. ✅
 */
router.get(
    '/list', 
    checkPermission('Sales'), 
    validate(schemas.sbuIdQuery), // Query validation added
    getSbuKeys
);


module.exports = router;