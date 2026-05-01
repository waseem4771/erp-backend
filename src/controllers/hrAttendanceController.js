const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * HR Attendance & Leave Controller
 * Purpose: Manages daily staff presence and leave application lifecycle.
 * Update: Re-aligned Audit Logs to include SBU ID for precise unit-level filtering. ✅
 */

// ============================================================
// 1. ATTENDANCE MANAGEMENT
// ============================================================

/**
 * Function: markAttendance
 * Purpose: Bulk records daily attendance for staff members.
 */
const markAttendance = async (req, res) => {
    const { sbu_id, date, attendance_records, user_id } = req.body;

    try {
        const result = await prisma.$transaction(
            attendance_records.map(rec => prisma.attendance.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    employee_id: parseInt(rec.employee_id),
                    date: new Date(date),
                    status: rec.status // Values: Present, Absent, Leave
                }
            }))
        );

        // FIXED: Added parseInt(sbu_id) as the second argument for audit accuracy ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'MARK_ATTENDANCE', 
            'HR', 
            { date, employee_count: result.length }, 
            req.ip
        );

        res.status(201).json({ success: true, message: "Attendance sheet synchronized successfully.", count: result.length });
    } catch (error) {
        console.error("MARK_ATTENDANCE_ERROR:", error.message);
        res.status(500).json({ error: "Failed to save attendance record." });
    }
};

/**
 * Function: getAttendanceReport
 * Purpose: Retrieves attendance logs for a specific date and unit.
 */
const getAttendanceReport = async (req, res) => {
    const { sbu_id, date } = req.query;
    try {
        const report = await prisma.attendance.findMany({
            where: {
                sbu_id: parseInt(sbu_id),
                date: new Date(date)
            },
            include: { 
                employees: { 
                    select: { full_name: true, designation: true } 
                } 
            }
        });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 2. LEAVE MANAGEMENT WORKFLOW
// ============================================================

/**
 * Function: applyLeave
 * Purpose: Registers a new leave request for an employee.
 */
const applyLeave = async (req, res) => {
    const { employee_id, sbu_id, leave_type, start_date, end_date, reason, user_id } = req.body;
    try {
        const leave = await prisma.leaves.create({
            data: {
                employee_id: parseInt(employee_id),
                sbu_id: parseInt(sbu_id),
                leave_type,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                reason,
                status: 'Pending'
            }
        });

        // FIXED: Re-aligned audit log arguments with SBU ID ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'APPLY_LEAVE', 
            'HR', 
            { employee_id, leave_type, reason }, 
            req.ip
        );

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Function: getLeaveRequests
 * Purpose: Lists all leave applications filtered by SBU.
 */
const getLeaveRequests = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const requests = await prisma.leaves.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            include: { employees: { select: { full_name: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Function: updateLeaveStatus
 * Purpose: Authorizes (Approves/Rejects) a pending leave application.
 */
const updateLeaveStatus = async (req, res) => {
    const { id, status, user_id, sbu_id } = req.body;
    try {
        const updated = await prisma.leaves.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        // FIXED: Re-aligned audit log arguments with SBU ID ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id || updated.sbu_id), 
            `LEAVE_${status.toUpperCase()}`, 
            'HR', 
            { leave_id: id, final_status: status }, 
            req.ip
        );

        res.json({ success: true, message: `Leave application ${status.toLowerCase()} successfully.`, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    markAttendance, 
    getAttendanceReport, 
    applyLeave, 
    getLeaveRequests, 
    updateLeaveStatus 
};