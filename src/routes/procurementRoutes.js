const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 * Handles the multi-level authorization workflow for purchase requisitions.
 */
const { approvePurchaseOrder } = require('../controllers/procurementController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: Inventory / Procurement
 * This endpoint is guarded by the RBAC middleware.
 * Requirement: "Automatic $ amount max approval" logic is enforced within the controller.
 * Verification: Ensures only users with 'Inventory' access can authorize expenditures.
 */

// 1. Purchase Order Approval Route
/**
 * PATCH: Authorize a pending Purchase Order (PO)
 * Endpoint: http://localhost:5000/api/procurement/approve
 * Permission: Requires 'Inventory' module access.
 */
router.patch('/approve', checkPermission('Inventory'), approvePurchaseOrder);

module.exports = router;