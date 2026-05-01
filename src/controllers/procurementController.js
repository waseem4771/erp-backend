const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

// ============================================================
// PROCUREMENT & APPROVAL ENGINE
// ============================================================

const approvePurchaseOrder = async (req, res) => {
    const { po_id, user_id, user_role } = req.body; 
    // user_role values: 'Staff', 'Manager', 'Director'

    try {
        // 1. PO dhoondna
        const po = await prisma.purchase_orders.findUnique({
            where: { id: parseInt(po_id) }
        });

        if (!po) return res.status(404).json({ error: "Purchase Order not found." });
        
        if (po.status === 'Received') {
            return res.status(400).json({ error: "Cannot approve a PO that is already received." });
        }

        const amount = parseFloat(po.total_amount);

        // 2. APPROVAL RULES (Automatic Dollar Limit Logic) ✅
        
        // RULE A: Agar amount $1,000 se zyada hai toh sirf Director approve kar sakta hai
        if (amount > 1000 && user_role !== 'Director') {
            return res.status(403).json({ 
                error: `Limit Exceeded: This order is $${amount}. Orders above $1,000 require Director approval.` 
            });
        }

        // RULE B: Agar amount $1,000 se kam hai toh Manager ya Director dono kar saktay hain
        if (amount <= 1000 && (user_role !== 'Manager' && user_role !== 'Director')) {
            return res.status(403).json({ 
                error: "Insufficient Permissions: You need at least a Manager role to approve this order." 
            });
        }

        // 3. STATUS TAYYAR KARNA
        const newStatus = (user_role === 'Director') ? 'Director_Approved' : 'Manager_Approved';

        // 4. DATABASE UPDATE
        const updatedPO = await prisma.purchase_orders.update({
            where: { id: parseInt(po_id) },
            data: { 
                status: newStatus,
                approved_by: parseInt(user_id)
            }
        });

        // 5. AUDIT LOG ✅
        await recordAuditLog(user_id, `PO_APPROVE_${newStatus.toUpperCase()}`, 'Procurement', { po_id, amount }, req.ip);

        res.json({ 
            message: `Purchase Order approved successfully as ${newStatus}.`, 
            data: updatedPO 
        });

    } catch (error) {
        console.error("PROCURMENT_APPROVAL_ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { approvePurchaseOrder };