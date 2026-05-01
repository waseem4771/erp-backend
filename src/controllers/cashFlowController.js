const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// CASH FLOW STATEMENT ENGINE (Phase 7: Step 27)
// ============================================================
// Maqsad: Business mein actual cash ka aana (Inflow) aur jaana (Outflow) dikhana
const getCashFlowStatement = async (req, res) => {
    const { sbu_id, startDate, endDate } = req.query;

    try {
        // 1. Date filters set karna
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        // 2. Sirf Cash aur Bank type ke accounts ki entries uthana
        // Hum un accounts ko scan kar rahe hain jin ke naam mein 'Cash' ya 'Bank' hai
        const cashFlowEntries = await prisma.ledger_entries.findMany({
            where: {
                chart_of_accounts: {
                    OR: [
                        { account_name: { contains: 'Cash' } },
                        { account_name: { contains: 'Bank' } }
                    ]
                },
                journal_entries: {
                    transaction_date: { gte: start, lte: end },
                    ...(sbu_id && { sbu_id: parseInt(sbu_id) })
                }
            },
            include: {
                journal_entries: { include: { sbus: true } },
                chart_of_accounts: true
            }
        });

        // 3. Currency Rates for Conversion (USD Consolidated View)
        const rates = await prisma.currency_rates.findMany();
        const rateMap = {};
        rates.forEach(r => rateMap[r.from_currency] = parseFloat(r.exchange_rate));

        let totalInflow = 0;
        let totalOutflow = 0;
        const activities = [];

        // 4. Data Processing Loop
        cashFlowEntries.forEach(entry => {
            const sbuCurrency = entry.journal_entries.sbus.currency || 'USD';
            const rate = sbuCurrency === 'USD' ? 1 : (rateMap[sbuCurrency] || 1);

            const debitUSD = parseFloat(entry.debit || 0) / rate;
            const creditUSD = parseFloat(entry.credit || 0) / rate;

            // Inflow Logic: Jab Cash/Bank account DEBIT (+) hota hai
            if (debitUSD > 0) {
                totalInflow += debitUSD;
                activities.push({
                    id: entry.id,
                    date: entry.journal_entries.transaction_date,
                    description: entry.journal_entries.description,
                    type: 'Inflow',
                    account: entry.chart_of_accounts.account_name,
                    amount: parseFloat(debitUSD.toFixed(2))
                });
            }
            
            // Outflow Logic: Jab Cash/Bank account CREDIT (-) hota hai
            if (creditUSD > 0) {
                totalOutflow += creditUSD;
                activities.push({
                    id: entry.id,
                    date: entry.journal_entries.transaction_date,
                    description: entry.journal_entries.description,
                    type: 'Outflow',
                    account: entry.chart_of_accounts.account_name,
                    amount: parseFloat(creditUSD.toFixed(2))
                });
            }
        });

        res.json({
            meta: { startDate: start, endDate: end, currency: "USD" },
            summary: {
                total_inflow: parseFloat(totalInflow.toFixed(2)),
                total_outflow: parseFloat(totalOutflow.toFixed(2)),
                net_cash_change: parseFloat((totalInflow - totalOutflow).toFixed(2))
            },
            activities: activities.sort((a, b) => new Date(b.date) - new Date(a.date)) // Latest first
        });

    } catch (error) {
        console.error("CASH_FLOW_LOGIC_ERROR:", error);
        res.status(500).json({ error: "Failed to compile cash flow data" });
    }
};

module.exports = { getCashFlowStatement };