const express = require('express');
const router = express.Router();

/**
 * Controller Imports
 * Logic for daily staff presence and leave lifecycle management.
 */
const { 
    markAttendance, 
    getAttendanceReport, 
    applyLeave, 
    getLeaveRequests, 
    updateLeaveStatus 
} = require('../controllers/hrAttendanceController');

// Importing the Security Middleware for RBAC Enforcement ✅
const { checkPermission } = require('../middleware/rbacMiddleware');

/**
 * MODULE PROTECTION: HR
 * Every route below is guarded by the RBAC middleware.
 * Verification: Checks if the user role has 'HR' module access enabled in the database.
 */

// --- 1. ATTENDANCE OPERATIONS ---

// POST: Bulk mark attendance for an entire branch
router.post('/mark', checkPermission('HR'), markAttendance);

// GET: Retrieve attendance records for a specific date and SBU
router.get('/report', checkPermission('HR'), getAttendanceReport);


// --- 2. LEAVE MANAGEMENT WORKFLOW ---

// POST: Submit a new leave application for an employee
router.post('/leaves/apply', checkPermission('HR'), applyLeave);

// GET: List all pending and historical leave requests for the unit
router.get('/leaves/list', checkPermission('HR'), getLeaveRequests);

// PATCH: Approve or Reject a specific leave application
router.patch('/leaves/status', checkPermission('HR'), updateLeaveStatus);


module.exports = router;