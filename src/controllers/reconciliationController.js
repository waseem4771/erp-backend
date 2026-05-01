const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

// ============================================================
// BANK RECONCILIATION ENGINE
// ============================================================

// 1. Unreconciled Transactions fetch karna
// Maqsad: Wo transactions dikhana jo abhi tak bank se match nahi huin
const getUnreconciledEntries = async (req, res) => {
    const { sbu_id, account_id } = req.query;

    try {
        const entries = await prisma.ledger_entries.findMany({
            where: {
                account_id: parseInt(account_id), // Specific Bank/Cash Account
                is_reconciled: false,             // Sirf unreconciled ✅
                journal_entries: {
                    sbu_id: parseInt(sbu_id)
                }
            },
            include: {
                journal_entries: true,
                chart_of_accounts: true
            },
            orderBy: {
                journal_entries: { transaction_date: 'desc' }
            }
        });

        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Mark Transaction as Reconciled ✅
// Maqsad: Entry ko bank statement se match kar ke lock kar dena
const markAsReconciled = async (req, res) => {
    const { entry_id, user_id } = req.body;

    try {
        const updatedEntry = await prisma.ledger_entries.update({
            where: { id: parseInt(entry_id) },
            data: {
                is_reconciled: true,
                reconciled_at: new Date()
            }
        });

        // AUDIT LOG record karna
        await recordAuditLog(user_id, 'BANK_RECONCILED', 'Finance', { entry_id }, req.ip);

        res.json({ message: "Transaction reconciled successfully!", data: updatedEntry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getUnreconciledEntries, markAsReconciled };