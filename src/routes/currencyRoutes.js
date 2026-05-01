const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Handles global exchange rates used for USD reporting consolidation.
 */
const { 
    getAllRates, 
    updateCurrencyRate, 
    addCurrency 
} = require('../controllers/currencyController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: Accounting / Finance
 * Every route below is guarded by the RBAC middleware.
 * Logic: Currency management is a core financial setting and requires 'Accounting' permission.
 */

// --- 1. GLOBAL RATE RETRIEVAL ---
/**
 * GET: Fetch all active exchange rates
 * Method: GET http://localhost:5000/api/currencies
 */
router.get('/', checkPermission('Accounting'), getAllRates);


// --- 2. EXCHANGE RATE UPDATES ---
/**
 * PATCH: Modify an existing conversion rate
 * Method: PATCH http://localhost:5000/api/currencies/update
 */
router.patch('/update', checkPermission('Accounting'), updateCurrencyRate);


// --- 3. CURRENCY REGISTRATION ---
/**
 * POST: Register a new currency type in the system
 * Method: POST http://localhost:5000/api/currencies/add
 */
router.post('/add', checkPermission('Accounting'), addCurrency);


module.exports = router;