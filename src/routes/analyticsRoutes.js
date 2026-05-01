// const express = require('express');
// const router = express.Router();

// /**
//  * Controller Imports
//  * Professional financial statements, dashboard logic, and auditing tools.
//  */
// const { getDashboardSummary, getInternalAuditLogs } = require('../controllers/dashboardController');
// const { 
//     getProfitLossReport, 
//     getBalanceSheetReport, 
//     getTaxationReport,
//     getTrialBalance 
// } = require('../controllers/financialController');
// const { getARAgingReport, getAPAgingReport } = require('../controllers/agingController');
// const { getIndividualSbuReport } = require('../controllers/sbuReportController');
// const { getCashFlowStatement } = require('../controllers/cashFlowController');
// const { getUnreconciledEntries, markAsReconciled } = require('../controllers/reconciliationController');

// // Importing the Security Middleware for RBAC Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * ANALYTICS & REPORTING HUB
//  * Every reporting endpoint is now guarded by specific module-level permissions.
//  */

// // --- 1. CORE DASHBOARD & SYSTEM AUDIT ---

// // Global Mother Dashboard Summary (Consolidated)
// router.get('/summary', getDashboardSummary);

// // Internal Security Audit Logs
// router.get('/internal-logs', getInternalAuditLogs);


// // --- 2. PROFESSIONAL FINANCIAL STATEMENTS (ACCOUNTING GUARD) ---

// // Profit & Loss (Income Statement)
// router.get('/profit-loss', checkPermission('Accounting'), getProfitLossReport);

// // Balance Sheet (Financial Position)
// router.get('/balance-sheet', checkPermission('Accounting'), getBalanceSheetReport);

// // Taxation Compliance Report (Sales Tax / VAT)
// router.get('/taxation', checkPermission('Accounting'), getTaxationReport);

// // Trial Balance (Ledger Integrity Check)
// router.get('/trial-balance', checkPermission('Accounting'), getTrialBalance);

// // Cash Flow Statement (Liquidity Monitoring)
// router.get('/cash-flow', checkPermission('Accounting'), getCashFlowStatement);


// // --- 3. BANK RECONCILIATION WORKFLOW (ACCOUNTING GUARD) ---

// // Fetch unmatched ledger entries for verification
// router.get('/reconciliation/unreconciled', checkPermission('Accounting'), getUnreconciledEntries);

// // Authorize matching an entry with physical bank statement
// router.post('/reconciliation/mark', checkPermission('Accounting'), markAsReconciled);


// // --- 4. SALES & UNIT PERFORMANCE ANALYTICS (SALES GUARD) ---

// // Accounts Receivable (AR) Aging - Outstanding Customer Debt
// router.get('/ar-aging', checkPermission('Sales'), getARAgingReport);

// // Accounts Payable (AP) Aging - Outstanding Vendor Liabilities
// router.get('/ap-aging', checkPermission('Sales'), getAPAgingReport);

// // Strategic Business Unit (SBU) Independent Performance Analysis
// router.get('/sbu-report', checkPermission('Sales'), getIndividualSbuReport);


// module.exports = router;






const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Professional financial statements, dashboard logic, and auditing tools.
 */
const { getDashboardSummary, getInternalAuditLogs } = require('../controllers/dashboardController');
const { 
    getProfitLossReport, 
    getBalanceSheetReport, 
    getTaxationReport,
    getTrialBalance 
} = require('../controllers/financialController');
const { getARAgingReport, getAPAgingReport } = require('../controllers/agingController');
const { getIndividualSbuReport } = require('../controllers/sbuReportController');
const { getCashFlowStatement } = require('../controllers/cashFlowController');
const { getUnreconciledEntries, markAsReconciled } = require('../controllers/reconciliationController');

// Importing Security & Validation Middlewares ✅
const { checkPermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const schemas = require('../utils/validationSchemas');

/**
 * ANALYTICS & REPORTING HUB ✅
 * Every reporting endpoint is now guarded by RBAC and Data Validation.
 */

// --- 1. CORE DASHBOARD & SYSTEM AUDIT ---

// Global Mother Dashboard Summary (Consolidated)
router.get('/summary', getDashboardSummary);

// Internal Security Audit Logs
router.get('/internal-logs', getInternalAuditLogs);


// --- 2. PROFESSIONAL FINANCIAL STATEMENTS (ACCOUNTING GUARD) ---

// Profit & Loss (Income Statement) - Validates Dates & SBU ID ✅
router.get(
    '/profit-loss', 
    checkPermission('Accounting'), 
    validate(schemas.reportQuery), 
    getProfitLossReport
);

// Balance Sheet (Financial Position)
router.get(
    '/balance-sheet', 
    checkPermission('Accounting'), 
    validate(schemas.reportQuery), 
    getBalanceSheetReport
);

// Taxation Compliance Report (Sales Tax / VAT)
router.get(
    '/taxation', 
    checkPermission('Accounting'), 
    validate(schemas.reportQuery), 
    getTaxationReport
);

// Trial Balance (Ledger Integrity Check)
router.get(
    '/trial-balance', 
    checkPermission('Accounting'), 
    validate(schemas.reportQuery), 
    getTrialBalance
);

// Cash Flow Statement (Liquidity Monitoring)
router.get(
    '/cash-flow', 
    checkPermission('Accounting'), 
    validate(schemas.reportQuery), 
    getCashFlowStatement
);


// --- 3. BANK RECONCILIATION WORKFLOW (ACCOUNTING GUARD) ---

// Fetch unmatched ledger entries for verification
router.get(
    '/reconciliation/unreconciled', 
    checkPermission('Accounting'), 
    getUnreconciledEntries
);

// Authorize matching an entry with physical bank statement
router.post(
    '/reconciliation/mark', 
    checkPermission('Accounting'), 
    markAsReconciled
);


// --- 4. SALES & UNIT PERFORMANCE ANALYTICS (SALES GUARD) ---

// Accounts Receivable (AR) Aging - Outstanding Customer Debt
router.get(
    '/ar-aging', 
    checkPermission('Sales'), 
    validate(schemas.reportQuery), 
    getARAgingReport
);

// Accounts Payable (AP) Aging - Outstanding Vendor Liabilities
router.get(
    '/ap-aging', 
    checkPermission('Sales'), 
    validate(schemas.reportQuery), 
    getAPAgingReport
);

// Strategic Business Unit (SBU) Independent Performance Analysis
router.get(
    '/sbu-report', 
    checkPermission('Sales'), 
    validate(schemas.reportQuery), 
    getIndividualSbuReport
);


module.exports = router;