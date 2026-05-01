const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Fund Management Controller
 * Purpose: Orchestrates capital movement between Mother Company and Strategic Business Units.
 * Features: Atomic transactions for fund transfers and automated profit-sharing calculation.
 * Update: Re-aligned Audit Logs and implemented Dynamic SBU Account resolution. ✅
 */

// ============================================================
// 1. MANUAL FUND TRANSFER (Allocation / Profit Return)
// ============================================================
/**
 * Function: transferFunds
 * Purpose: Records a capital movement and generates synchronized accounting entries.
 */
const transferFunds = async (req, res) => {
    const { mother_company_id, sbu_id, amount, transfer_type, description, user_id } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            
            // A. DYNAMIC ACCOUNT RESOLUTION ✅
            // Locating the specific Ledger accounts for this SBU
            const cashAccount = await tx.chart_of_accounts.findFirst({
                where: { sbu_id: parseInt(sbu_id), account_name: 'Cash on Hand' }
            });

            const equityAccount = await tx.chart_of_accounts.findFirst({
                where: { sbu_id: parseInt(sbu_id), account_name: 'Mother Company Fund' }
            });

            if (!cashAccount || !equityAccount) {
                throw new Error("Financial Error: Target unit is missing primary capital accounts.");
            }

            // B. Create the Master Transfer Record
            const transfer = await tx.fund_transfers.create({
                data: {
                    mother_company_id: parseInt(mother_company_id),
                    sbu_id: parseInt(sbu_id),
                    amount: parseFloat(amount),
                    transfer_type: transfer_type, // 'Allocation' or 'Profit_Return'
                    description: description
                }
            });

            // C. Generate Journal Entry for Ledger Synchronization
            const journal = await tx.journal_entries.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    transaction_date: new Date(),
                    description: `Capital ${transfer_type}: ${description}`,
                    reference_no: `FT-${transfer.id}`,
                    created_by: user_id ? parseInt(user_id) : 1
                }
            });

            // D. Double-Entry Accounting Logic
            const isAllocation = transfer_type === 'Allocation';
            
            await tx.ledger_entries.createMany({
                data: [
                    { 
                        journal_id: journal.id, 
                        account_id: cashAccount.id, 
                        debit: isAllocation ? parseFloat(amount) : 0, 
                        credit: isAllocation ? 0 : parseFloat(amount) 
                    },
                    { 
                        journal_id: journal.id, 
                        account_id: equityAccount.id, 
                        debit: isAllocation ? 0 : parseFloat(amount), 
                        credit: isAllocation ? parseFloat(amount) : 0 
                    }
                ]
            });

            return transfer;
        });

        // FIXED: Corrected arguments for recordAuditLog (userId, sbuId, action, module...) ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            `FUND_TRANSFER_${transfer_type.toUpperCase()}`, 
            'Finance', 
            { amount: amount, type: transfer_type, memo: description }, 
            req.ip
        );

        res.status(201).json({ 
            success: true,
            message: "Capital transfer processed and ledger synchronized successfully.", 
            data: result 
        });

    } catch (error) {
        console.error("FUND_TRANSFER_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 2. AUTOMATED PROFIT SHARING ENGINE
// ============================================================
/**
 * Function: calculateAutomatedProfitSharing
 * Purpose: Scans SBU performance and automatically transfers a % of net profit to Mother Company.
 */
const calculateAutomatedProfitSharing = async (req, res) => {
    const { sbu_id, percentage, month, year, user_id } = req.body;

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Aggregating Total Unit Income
        const income = await prisma.ledger_entries.aggregate({
            where: {
                journal_entries: { sbu_id: parseInt(sbu_id), transaction_date: { gte: startDate, lte: endDate } },
                chart_of_accounts: { account_type: 'Income' }
            },
            _sum: { credit: true }
        });

        // Aggregating Total Unit Operating Expenses
        const expense = await prisma.ledger_entries.aggregate({
            where: {
                journal_entries: { sbu_id: parseInt(sbu_id), transaction_date: { gte: startDate, lte: endDate } },
                chart_of_accounts: { account_type: 'Expense' }
            },
            _sum: { debit: true }
        });

        const netProfit = (parseFloat(income._sum.credit || 0)) - (parseFloat(expense._sum.debit || 0));
        
        if (netProfit <= 0) {
            return res.status(400).json({ error: "Insufficient Profit: No net earnings detected for this period." });
        }

        const sharingAmount = (netProfit * parseFloat(percentage)) / 100;

        // Executing the transfer by reusing the manual transfer logic
        req.body = {
            mother_company_id: 1,
            sbu_id: sbu_id,
            amount: sharingAmount.toFixed(2),
            transfer_type: 'Profit_Return',
            description: `Automated ${percentage}% Profit Share for ${month}/${year}. (Net Profit: $${netProfit.toFixed(2)})`,
            user_id: user_id
        };

        return transferFunds(req, res); 

    } catch (error) {
        console.error("AUTOMATED_PROFIT_ERROR:", error.message);
        res.status(500).json({ error: "Profit sharing engine failed to calculate results." });
    }
};

// ============================================================
// 3. FUND HISTORY REGISTRY
// ============================================================
/**
 * Function: getFundHistory
 * Purpose: Retrieves historical capital movement records.
 */
const getFundHistory = async (req, res) => {
    const { sbu_id } = req.query;

    try {
        const history = await prisma.fund_transfers.findMany({
            where: sbu_id ? { sbu_id: parseInt(sbu_id) } : {},
            include: { 
                sbus: { select: { sbu_name: true } } 
            },
            orderBy: { transfer_date: 'desc' }
        });
        
        res.json(history);
    } catch (error) {
        console.error("FETCH_FUND_HISTORY_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve capital transaction history." });
    }
};

module.exports = { 
    transferFunds, 
    getFundHistory,
    calculateAutomatedProfitSharing 
};