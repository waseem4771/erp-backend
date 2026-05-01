const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Internal Audit Log Helper (Refined for Multi-Tenancy)
 * Purpose: Records every administrative action with User and Unit context.
 * @param {Number} userId - ID of the user performing the action
 * @param {Number} sbuId - ID of the Strategic Business Unit affected ✅
 * @param {String} action - Action title (e.g. CREATE_LEAD)
 * @param {String} module - Module name (e.g. Marketing)
 * @param {Object} details - JSON details of the modification
 * @param {String} ip - User's IP address
 */
const recordAuditLog = async (userId, sbuId, action, module, details = {}, ip = "127.0.0.1") => {
    try {
        await prisma.audit_logs.create({
            data: {
                user_id: userId ? parseInt(userId) : null,
                sbu_id: sbuId ? parseInt(sbuId) : null, // Logging the SBU ID for unit filtering ✅
                action: action,
                module: module,
                details: JSON.stringify(details),
                ip_address: ip
            }
        });
        console.log(`[AUDIT] Action ${action} logged for Unit ${sbuId} by User ${userId}`);
    } catch (error) {
        console.error("FAILED_TO_RECORD_AUDIT:", error.message);
    }
};

module.exports = { recordAuditLog };