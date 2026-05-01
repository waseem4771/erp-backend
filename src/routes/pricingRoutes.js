const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 * Logic for unit-specific pricing and promotional coupon management.
 */
const { 
    upsertPriceBook, 
    createCoupon, 
    validateCoupon, 
    getSbuCoupons 
} = require('../controllers/pricingController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: Sales & Marketing
 * Every management route below is guarded by the RBAC middleware.
 * Logic: Price books fall under Sales, while Coupons fall under Marketing.
 */

// --- 1. UNIT-SPECIFIC PRICE BOOK MANAGEMENT ---
/**
 * POST: Create or Update a custom price for an SBU
 * Permission: Requires 'Sales' module access.
 */
router.post('/price-book/upsert', checkPermission('Sales'), upsertPriceBook);


// --- 2. PROMOTIONAL COUPON MANAGEMENT ---

/**
 * POST: Register a new discount promo code
 * Permission: Requires 'Marketing' module access.
 */
router.post('/coupons/add', checkPermission('Marketing'), createCoupon);

/**
 * GET: Retrieve list of active coupons for a specific SBU
 * Permission: Requires 'Marketing' module access.
 */
router.get('/coupons/list', checkPermission('Marketing'), getSbuCoupons);

/**
 * GET: Validate a coupon code during checkout/order processing
 * Permission: Requires 'Marketing' or 'Sales' access (using Marketing as primary).
 */
router.get('/coupons/validate', checkPermission('Marketing'), validateCoupon);


module.exports = router;