// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Logic for managing company assets, purchase history, and automated depreciation.
//  */
// const { 
//     createAsset, 
//     getAssets, 
//     deleteAsset 
// } = require('../controllers/fixedAssetsController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: Inventory
//  * Every route below is guarded by the RBAC middleware.
//  * Verification: Ensures only authorized personnel can manage the fixed asset register.
//  */

// // --- 1. ASSET REGISTRATION ---
// /**
//  * POST: Record a new fixed asset in the system
//  * Method: POST http://localhost:5000/api/fixed-assets
//  */
// router.post('/', checkPermission('Inventory'), createAsset);


// // --- 2. ASSET REGISTRY & DEPRECIATION VIEW ---
// /**
//  * GET: Retrieve list of assets with calculated current book values
//  * Method: GET http://localhost:5000/api/fixed-assets
//  */
// router.get('/', checkPermission('Inventory'), getAssets);


// // --- 3. ASSET LIFECYCLE MANAGEMENT ---
// /**
//  * DELETE: Move an asset to archive (Soft Delete)
//  * Method: DELETE http://localhost:5000/api/fixed-assets/:id
//  */
// router.delete('/:id', checkPermission('Inventory'), deleteAsset);


// module.exports = router;



const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for managing company assets, purchase history, and automated depreciation.
 */
const { 
    createAsset, 
    getAssets, 
    deleteAsset,
    postMonthlyDepreciation // Added here ✅
} = require('../controllers/fixedAssetsController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: Inventory / Accounting
 * Every route below is guarded by the RBAC middleware.
 * Verification: Ensures only authorized personnel can manage the fixed asset register.
 */

// --- 1. ASSET REGISTRATION ---
/**
 * POST: Record a new fixed asset in the system
 * Method: POST http://localhost:5000/api/fixed-assets
 */
router.post('/', checkPermission('Inventory'), createAsset);


// --- 2. ASSET REGISTRY & DEPRECIATION VIEW ---
/**
 * GET: Retrieve list of assets with calculated current book values
 * Method: GET http://localhost:5000/api/fixed-assets
 */
router.get('/', checkPermission('Inventory'), getAssets);


// --- 3. ASSET LIFECYCLE MANAGEMENT ---
/**
 * DELETE: Move an asset to archive (Soft Delete)
 * Method: DELETE http://localhost:5000/api/fixed-assets/:id
 */
router.delete('/:id', checkPermission('Inventory'), deleteAsset);


// --- 4. FINANCIAL LEDGER POSTING (NEW ✅) ---
/**
 * POST: Authorize and post monthly depreciation to the General Ledger.
 * Permission: Requires 'Accounting' access as it affects the General Ledger.
 */
router.post('/post-depreciation', checkPermission('Accounting'), postMonthlyDepreciation);


module.exports = router;