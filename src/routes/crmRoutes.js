// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Logic for capturing leads, updating lead scores, and managing marketing campaigns.
//  */
// const { 
//     createLead, 
//     getLeads, 
//     updateLeadScore, 
//     createCampaign, 
//     getCampaigns 
// } = require('../controllers/crmController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Marketing / CRM
//  * Every route below is guarded by the RBAC middleware.
//  * Verification: Checks if the user role has 'Marketing' module access enabled.
//  */

// // --- 1. LEAD MANAGEMENT OPERATIONS ---

// /**
//  * POST: Capture a new potential customer lead
//  * Permission: Requires 'Marketing' access.
//  */
// router.post('/leads', checkPermission('Marketing'), createLead);

// /**
//  * GET: Retrieve all leads for a specific SBU
//  * Permission: Requires 'Marketing' access.
//  */
// router.get('/leads', checkPermission('Marketing'), getLeads);

// /**
//  * PATCH: Update lead priority based on scoring logic
//  * Permission: Requires 'Marketing' access.
//  */
// router.patch('/leads/score', checkPermission('Marketing'), updateLeadScore);


// // --- 2. CAMPAIGN MANAGEMENT OPERATIONS ---

// /**
//  * POST: Initiate a new marketing campaign (Email, Social, etc.)
//  * Permission: Requires 'Marketing' access.
//  */
// router.post('/campaigns', checkPermission('Marketing'), createCampaign);

// /**
//  * GET: Retrieve list of campaigns for the active SBU
//  * Permission: Requires 'Marketing' access.
//  */
// router.get('/campaigns', checkPermission('Marketing'), getCampaigns);


// module.exports = router;




const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for capturing leads, updating lead scores, and managing marketing campaigns.
 */
const { 
    createLead, 
    getLeads, 
    updateLeadScore, 
    createCampaign, 
    getCampaigns 
} = require('../controllers/crmController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * MODULE PROTECTION: Marketing / CRM
 * Guarded by RBAC and Zod Data Validation. ✅
 */

// --- 1. LEAD MANAGEMENT OPERATIONS ---

/**
 * POST: Capture a new potential customer lead
 * Logic: Validates name, email, and SBU ID context. ✅
 */
router.post(
    '/leads', 
    checkPermission('Marketing'), 
    validate(schemas.crmLead), 
    createLead
);

/**
 * GET: Retrieve all leads for a specific SBU
 * Logic: Ensures sbu_id is passed in URL query. ✅
 */
router.get(
    '/leads', 
    checkPermission('Marketing'), 
    validate(schemas.sbuIdQuery), 
    getLeads
);

/**
 * PATCH: Update lead priority based on scoring logic
 * Logic: Validates lead ID and the new numeric score. ✅
 */
router.patch(
    '/leads/score', 
    checkPermission('Marketing'), 
    validate(schemas.crmLeadScore), 
    updateLeadScore
);


// --- 2. CAMPAIGN MANAGEMENT OPERATIONS ---

/**
 * POST: Initiate a new marketing campaign
 * Logic: Validates budget and campaign identification. ✅
 */
router.post(
    '/campaigns', 
    checkPermission('Marketing'), 
    validate(schemas.crmCampaign), 
    createCampaign
);

/**
 * GET: Retrieve list of campaigns for the active SBU
 */
router.get(
    '/campaigns', 
    checkPermission('Marketing'), 
    validate(schemas.sbuIdQuery), 
    getCampaigns
);


module.exports = router;