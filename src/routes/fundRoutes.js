// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Logic for capital allocation, profit sharing, and transaction history.
//  */
// const { 
//     transferFunds, 
//     getFundHistory,
//     calculateAutomatedProfitSharing 
// } = require('../controllers/fundController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Accounting / Finance
//  * Every route below is guarded by the RBAC middleware.
//  * Verification: Ensures only authorized financial personnel can move funds or view history.
//  */

// // --- 1. CAPITAL ALLOCATION & PROFIT RETURN ---
// /**
//  * POST: Manual Fund Transfer
//  * Purpose: Allows Mother Company to allocate budget or SBUs to return profit manually.
//  */
// router.post('/transfer', checkPermission('Accounting'), transferFunds);


// // --- 2. AUTOMATED PROFIT SHARING ENGINE ---
// /**
//  * POST: Automated Profit Sharing
//  * Purpose: Triggers the engine to calculate and transfer a % of net SBU earnings.
//  */
// router.post('/auto-profit-share', checkPermission('Accounting'), calculateAutomatedProfitSharing);


// // --- 3. CAPITAL TRANSACTION AUDIT ---
// /**
//  * GET: Inter-Company Transfer History
//  * Purpose: Retrieves the full ledger of fund movements for audit purposes.
//  */
// router.get('/history', checkPermission('Accounting'), getFundHistory);


// module.exports = router;





const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for capital allocation, profit sharing, and transaction history.
 */
const { 
    transferFunds, 
    getFundHistory,
    calculateAutomatedProfitSharing 
} = require('../controllers/fundController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * MODULE PROTECTION: Accounting / Finance
 * Every route below is guarded by RBAC and Data Validation layers. ✅
 */

// --- 1. CAPITAL ALLOCATION & PROFIT RETURN ---
/**
 * POST: Manual Fund Transfer
 * Logic: Validated via Zod before hitting the controller. ✅
 */
router.post(
    '/transfer', 
    checkPermission('Accounting'), 
    validate(schemas.fundTransfer), // Data validation layer added
    transferFunds
);


// --- 2. AUTOMATED PROFIT SHARING ENGINE ---
/**
 * POST: Automated Profit Sharing
 */
router.post('/auto-profit-share', checkPermission('Accounting'), calculateAutomatedProfitSharing);


// --- 3. CAPITAL TRANSACTION AUDIT ---
/**
 * GET: Inter-Company Transfer History
 */
router.get('/history', checkPermission('Accounting'), getFundHistory);


module.exports = router;