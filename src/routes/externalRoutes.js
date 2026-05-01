// const express = require('express');
// const router = express.Router();

// /**
//  * Middleware Imports
//  * 1. verifyExternalApiKey: Validates Client ID/Secret for external platforms.
//  * 2. checkPermission: Validates internal ERP user rights for the logs dashboard.
//  */
// const verifyExternalApiKey = require('../middleware/externalAuth');
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * Controller Imports
//  * Logic for order synchronization, real-time product inquiry, and traffic logging.
//  */
// const { 
//     syncExternalOrder, 
//     getExternalProductData, 
//     getApiLogs 
// } = require('../controllers/externalController');

// /**
//  * EXTERNAL API GATEWAY (B2B Integration)
//  * These endpoints are hit by external platforms like Shopify, WordPress, and MERN stores.
//  */

// // --- 1. CONNECTION AUTHENTICATION TEST ---
// /**
//  * GET: Verify if API Credentials are valid.
//  * Endpoint: http://localhost:5000/api/external/test-connection
//  */
// router.get('/test-connection', verifyExternalApiKey, (req, res) => {
//     res.json({ 
//         success: true,
//         message: "Handshake Successful: Connection to Vimal ERP is active.", 
//         connected_sbu_id: req.sbu_id 
//     });
// });

// // --- 2. REAL-TIME ORDER SYNCHRONIZATION ---
// /**
//  * POST: Push new sales orders from external sites into ERP.
//  * Logic: Deducts stock and records a journal entry automatically.
//  */
// router.post('/sync-order', verifyExternalApiKey, syncExternalOrder);

// // --- 3. INVENTORY & PRICING INQUIRY ---
// /**
//  * GET: Allows external sites to fetch live stock levels and SBU-specific prices.
//  * Example: /api/external/product-info?sku=DELL-7490-BLK
//  */
// router.get('/product-info', verifyExternalApiKey, getExternalProductData);


// /**
//  * INTERNAL ADMINISTRATION
//  * These endpoints are used by ERP staff to monitor the gateway.
//  */

// // --- 4. API TRAFFIC AUDIT LOGS ✅ ---
// /**
//  * GET: View detailed logs of all inbound API requests.
//  * Permission: Guarded by 'Sales' module access for internal security.
//  * Endpoint: /api/external/logs?sbu_id=1
//  */
// router.get('/logs', checkPermission('Sales'), getApiLogs);


// module.exports = router;






const express = require('express');
const router = express.Router();

/**
 * Middleware Imports
 * 1. verifyExternalApiKey: Validates Client ID/Secret for external platforms (Shopify/WP). ✅
 * 2. checkPermission: Validates internal ERP user rights for auditing. ✅
 */
const verifyExternalApiKey = require('../middleware/externalAuth');
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * Controller Imports
 * Logic for order synchronization, real-time product inquiry, and traffic logging.
 */
const { 
    syncExternalOrder, 
    getExternalProductData, 
    getApiLogs 
} = require('../controllers/externalController');

/**
 * EXTERNAL API GATEWAY (B2B Marketplace Hub)
 * These endpoints are accessed by Shopify, WooCommerce, and MERN stores.
 * Security: Every request must pass the API Key verification. ✅
 */

// --- 1. CONNECTION AUTHENTICATION TEST ---
/**
 * GET: Verify if API Credentials (x-client-id & x-secret-key) are active.
 * Endpoint: /api/external/test-connection
 */
router.get('/test-connection', verifyExternalApiKey, (req, res) => {
    res.json({ 
        success: true,
        message: "Handshake Successful: Connection to VIMAL ERP is verified and active.", 
        connected_sbu_id: req.sbu_id 
    });
});

// --- 2. REAL-TIME ORDER SYNCHRONIZATION ---
/**
 * POST: Push new sales orders from external sites into ERP.
 * Logic: Auto-Customer sync, Stock deduction, and Double-Entry Ledger Posting. ✅
 * Endpoint: /api/external/sync-order
 */
router.post('/sync-order', verifyExternalApiKey, syncExternalOrder);

// --- 3. INVENTORY & PRICING INQUIRY ---
/**
 * GET: Allows external sites to fetch live stock levels and Tier-specific prices.
 * Logic: Resolves SBU-specific price books automatically. ✅
 * Endpoint: /api/external/product-info
 */
router.get('/product-info', verifyExternalApiKey, getExternalProductData);


/**
 * INTERNAL ADMINISTRATION (ERP Dashboard Only)
 * These endpoints are used by internal staff to monitor marketplace activity.
 */

// --- 4. API TRAFFIC AUDIT LOGS ---
/**
 * GET: View detailed logs of all inbound B2B API requests for auditing.
 * Permission: Guarded by 'Sales' module access for internal security. ✅
 * Endpoint: /api/external/logs
 */
router.get('/logs', checkPermission('Sales'), getApiLogs);


module.exports = router;