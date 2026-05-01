const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 */
const { createExpense, getExpenses, upload } = require('../controllers/expenseController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: Accounting / Finance
 * Every route below is guarded by the RBAC middleware.
 * Logic: Ensures only authorized personnel can record financial expenditures.
 */

/**
 * POST: Record Expense with File Upload
 * Middleware order: 
 * 1. Permission Check ('Accounting') 
 * 2. File Processing (Multer 'invoice')
 */
router.post('/', checkPermission('Accounting'), upload.single('invoice'), createExpense);

/**
 * GET: Retrieve List of Expenses
 * Filtered by SBU ID and protected by Accounting module permissions.
 */
router.get('/', checkPermission('Accounting'), getExpenses);

module.exports = router;