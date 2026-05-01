// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Logic for initializing new business units and retrieving the global SBU registry.
//  */
// const { createSbu, getAllSbus } = require('../controllers/sbuController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * STRATEGIC BUSINESS UNIT (SBU) ROUTES
//  * Purpose: Global configuration for the Mother Company to manage its subsidiaries.
//  * Protection: Guarded by RBAC to prevent unauthorized unit creation.
//  */

// /**
//  * POST: Initialize a New Business Unit
//  * Endpoint: http://localhost:5000/api/settings/sbus
//  * Permission: Requires 'Accounting' or Administrative access.
//  */
// router.post('/', checkPermission('Accounting'), createSbu);

// /**
//  * GET: Retrieve All Registered SBUs
//  * Endpoint: http://localhost:5000/api/settings/sbus
//  * Logic: Fetches the complete list of units linked to the Mother Company.
//  */
// router.get('/', checkPermission('Accounting'), getAllSbus);


// module.exports = router;




const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for initializing new business units and retrieving the global SBU registry.
 */
const { createSbu, getAllSbus } = require('../controllers/sbuController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * STRATEGIC BUSINESS UNIT (SBU) ROUTES
 * Purpose: Global configuration for the Mother Company to manage its subsidiaries.
 * Update: Integrated Data Validation for unit enrollment. ✅
 */

/**
 * POST: Initialize a New Business Unit
 * Logic: Validates unit identity and profit share percentage before creation. ✅
 */
router.post(
    '/', 
    checkPermission('Accounting'), 
    validate(schemas.createSbu), 
    createSbu
);

/**
 * GET: Retrieve All Registered SBUs
 * Logic: Fetches the complete list of units linked to the Mother Company.
 */
router.get(
    '/', 
    checkPermission('Accounting'), 
    getAllSbus
);


module.exports = router;




