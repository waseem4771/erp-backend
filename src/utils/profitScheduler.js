const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('./auditHelper');

/**
 * AUTOMATED PROFIT SHARING ENGINE ✅
 * Schedule: Runs at 00:00 (Midnight) on the 1st day of every month.
 * Purpose: Calculates previous month's net profit and transfers % share to Mother Company.
 */
const initProfitScheduler = () => {
    // Cron Pattern: '0 0 1 * *' (Minute Hour Day Month DayOfWeek)
    cron.schedule('0 0 1 * *', async () => {
        console.log("[SCHEDULER] Initiating Monthly Automated Profit Sharing...");

        try {
            const today = new Date();
            // Pichlay mahine ki dates nikalna
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
            
            const monthLabel = firstDayLastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

            // 1. Sirf wo SBUs uthana jin ka profit share 0 se zyada hai
            const sbus = await prisma.sbus.findMany({
                where: { profit_share_percentage: { gt: 0 } }
            });

            for (const sbu of sbus) {
                // 2. Calculate Total Income (Credit side of Income accounts)
                const income = await prisma.ledger_entries.aggregate({
                    where: {
                        journal_entries: { sbu_id: sbu.id, transaction_date: { gte: firstDayLastMonth, lte: lastDayLastMonth } },
                        chart_of_accounts: { account_type: 'Income' }
                    },
                    _sum: { credit: true }
                });

                // 3. Calculate Total Expenses (Debit side of Expense accounts)
                const expense = await prisma.ledger_entries.aggregate({
                    where: {
                        journal_entries: { sbu_id: sbu.id, transaction_date: { gte: firstDayLastMonth, lte: lastDayLastMonth } },
                        chart_of_accounts: { account_type: 'Expense' }
                    },
                    _sum: { debit: true }
                });

                const netProfit = (parseFloat(income._sum.credit || 0)) - (parseFloat(expense._sum.debit || 0));

                if (netProfit > 0) {
                    const shareAmount = (netProfit * parseFloat(sbu.profit_share_percentage)) / 100;

                    // 4. Atomic Transaction: Record Transfer + Ledger Entry
                    await prisma.$transaction(async (tx) => {
                        // A. Master record
                        const transfer = await tx.fund_transfers.create({
                            data: {
                                mother_company_id: 1,
                                sbu_id: sbu.id,
                                amount: shareAmount,
                                transfer_type: 'Profit_Return',
                                description: `AUTO-TRANS: ${sbu.profit_share_percentage}% Profit Share for ${monthLabel}.`
                            }
                        });

                        // B. Journal Entry
                        const journal = await tx.journal_entries.create({
                            data: {
                                sbu_id: sbu.id,
                                transaction_date: new Date(),
                                description: `Automated Profit Remittance - ${monthLabel}`,
                                reference_no: `AUTO-FT-${transfer.id}`
                            }
                        });

                        // C. Double Entry (Debit: Mother Fund Equity, Credit: Cash)
                        await tx.ledger_entries.createMany({
                            data: [
                                { journal_id: journal.id, account_id: 1, debit: 0, credit: shareAmount }, // Cash Out
                                { journal_id: journal.id, account_id: 4, debit: shareAmount, credit: 0 }  // Equity Transfer
                            ]
                        });
                    });

                    console.log(`[SCHEDULER] Success: Transferred $${shareAmount.toFixed(2)} from ${sbu.sbu_name}`);
                    
                    await recordAuditLog(1, sbu.id, 'AUTO_PROFIT_SHARE', 'Finance', { 
                        amount: shareAmount, 
                        period: monthLabel, 
                        msg: "System triggered automatic remittance" 
                    });
                }
            }
        } catch (error) {
            console.error("[SCHEDULER_ERROR]:", error.message);
        }
    });
};

module.exports = { initProfitScheduler };