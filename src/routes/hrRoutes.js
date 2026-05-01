// const express = require('express');
// const router = express.Router();

// /**
//  * Controller & Middleware Imports
//  */
// const { 
//     createDepartment, 
//     getDepartments, 
//     createEmployee, 
//     getEmployees,
//     deleteEmployee, 
//     generateMonthlyPayroll,
//     markSalaryAsPaid, // Added here ✅
//     getPayrollHistory,
//     getRolePermissions, 
//     updatePermission    
// } = require('../controllers/hrController');

// const { getPayrollCostByDepartment } = require('../controllers/hrReportController');

// // Importing the Security Middleware for Permission Enforcement ✅
// const { checkPermission } = require('../middleware/rbacMiddleware');

// /**
//  * MODULE PROTECTION: HR
//  * Every route below is now guarded by the RBAC middleware.
//  * It checks the database 'permissions' table for the logged-in User ID.
//  */

// // --- 1. DEPARTMENT MANAGEMENT ---
// // Requires 'HR' module view/edit permission
// router.post('/departments', checkPermission('HR'), createDepartment);
// router.get('/departments', checkPermission('HR'), getDepartments);


// // --- 2. EMPLOYEE DIRECTORY ---
// router.post('/employees', checkPermission('HR'), createEmployee);
// router.get('/employees', checkPermission('HR'), getEmployees);
// router.delete('/employees/:id', checkPermission('HR'), deleteEmployee);


// // --- 3. PAYROLL ENGINE & ANALYTICS ---
// // Action: Trigger monthly salary calculation
// router.post('/payroll/generate', checkPermission('HR'), generateMonthlyPayroll);

// // Action: Finalize payment and post to General Ledger ✅
// router.post('/payroll/pay', checkPermission('HR'), markSalaryAsPaid);

// // Reporting: Fetch history and cost distribution
// router.get('/payroll/history', checkPermission('HR'), getPayrollHistory);
// router.get('/payroll/cost-by-department', checkPermission('HR'), getPayrollCostByDepartment);


// // --- 4. ACCESS CONTROL & PERMISSIONS (System Admin Level) ---
// // Note: Usually restricted to Super Admins only
// router.get('/permissions', checkPermission('HR'), getRolePermissions);
// router.post('/permissions/update', checkPermission('HR'), updatePermission);

// module.exports = router;




const express = require('express');
const router = express.Router();

/**
 * Controller & Middleware Imports
 */
const { 
    createDepartment, 
    getDepartments, 
    deleteDepartment, // Added here ✅
    createEmployee, 
    getEmployees,
    deleteEmployee, 
    generateMonthlyPayroll,
    markSalaryAsPaid,
    getPayrollHistory,
    getRolePermissions, 
    updatePermission    
} = require('../controllers/hrController');

const { getPayrollCostByDepartment } = require('../controllers/hrReportController');

// Importing the Security Middleware for Permission Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: HR
 * Every route below is now guarded by the RBAC middleware.
 * It checks the database 'permissions' table for the logged-in User ID.
 */

// --- 1. DEPARTMENT MANAGEMENT ---
// Requires 'HR' module view/edit permission
router.post('/departments', checkPermission('HR'), createDepartment);
router.get('/departments', checkPermission('HR'), getDepartments);
router.delete('/departments/:id', checkPermission('HR'), deleteDepartment); // Added Delete Route ✅


// --- 2. EMPLOYEE DIRECTORY ---
router.post('/employees', checkPermission('HR'), createEmployee);
router.get('/employees', checkPermission('HR'), getEmployees);
router.delete('/employees/:id', checkPermission('HR'), deleteEmployee);


// --- 3. PAYROLL ENGINE & ANALYTICS ---
// Action: Trigger monthly salary calculation
router.post('/payroll/generate', checkPermission('HR'), generateMonthlyPayroll);

// Action: Finalize payment and post to General Ledger ✅
router.post('/payroll/pay', checkPermission('HR'), markSalaryAsPaid);

// Reporting: Fetch history and cost distribution
router.get('/payroll/history', checkPermission('HR'), getPayrollHistory);
router.get('/payroll/cost-by-department', checkPermission('HR'), getPayrollCostByDepartment);


// --- 4. ACCESS CONTROL & PERMISSIONS (System Admin Level) ---
// Note: Usually restricted to Super Admins only
router.get('/permissions', checkPermission('HR'), getRolePermissions);
router.post('/permissions/update', checkPermission('HR'), updatePermission);

module.exports = router;
