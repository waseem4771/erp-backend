
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Financial Engine Import ✅
const { getNetProfitUSD, getAccountSummaries } = require('../utils/financialHelper');

/**
 * Financial Controller (Final Master Edition) ✅
 * Purpose: API Gatekeeper for Accounting Reports.
 * Fixes: Gross Revenue Summation, Multi-Currency Balancing, and Type Classification.
 */

// ============================================================
// 1. PROFIT & LOSS REPORT (Income Statement)
// ============================================================
const getProfitLossReport = async (req, res) => {
    const { sbu_id, startDate, endDate } = req.query;

    try {
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // 1. Fetching Net Profit & Totals from Engine ✅
        const performance = await getNetProfitUSD(sbu_id, start, end);

        // 2. Fetching individual account details for display (Income & Expense)
        const periodAccounts = await getAccountSummaries(sbu_id, end, ['Income', 'Expense']);

        res.json({
            meta: { startDate: start, endDate: end, currency: "USD (Consolidated)" },
            income: periodAccounts.filter(a => a.type === 'Income').map(a => ({
                name: a.name, code: a.code, amount: a.balance
            })),
            expenses: periodAccounts.filter(a => a.type === 'Expense').map(a => ({
                name: a.name, code: a.code, amount: a.balance
            })),
            totals: {
                total_income: performance.income, // Link to Engine Total ✅
                total_expense: performance.expense,
                net_profit: performance.profit
            }
        });
    } catch (error) {
        console.error("ACTUAL_DATABASE_ERROR in P&L Controller:", error);
        res.status(500).json({ error: "Accounting Engine failed to calculate P&L totals." });
    }
};

// ============================================================
// 2. BALANCE SHEET REPORT (Financial Position)
// ============================================================
const getBalanceSheetReport = async (req, res) => {
    const { sbu_id, date } = req.query;

    try {
        const asOfDate = date || new Date().toISOString().split('T')[0];

        // 1. Fetching all accounts via Engine
        const accounts = await getAccountSummaries(sbu_id, asOfDate, ['Asset', 'Liability', 'Equity']);
        
        // 2. Fetching P&L performance for current fiscal year
        const yearStart = `${new Date(asOfDate).getFullYear()}-01-01`;
        const performance = await getNetProfitUSD(sbu_id, yearStart, asOfDate);

        const report = { assets: [], liabilities: [], equity: [], totals: { total_assets: 0, total_liabilities: 0, total_equity: 0 } };

        accounts.forEach(acc => {
            const item = { name: acc.name, code: acc.code, amount: acc.balance };
            if (acc.type === 'Asset') {
                report.assets.push(item);
                report.totals.total_assets += acc.balance;
            } else if (acc.type === 'Liability') {
                report.liabilities.push(item);
                report.totals.total_liabilities += acc.balance;
            } else {
                report.equity.push(item);
                report.totals.total_equity += acc.balance;
            }
        });

        // 3. Inject Retained Earnings (Synced with P&L) ✅
        if (performance.profit !== 0) {
            report.equity.push({
                name: "Retained Earnings (YTD Profit/Loss)",
                code: "RE-99",
                amount: performance.profit
            });
            report.totals.total_equity += performance.profit;
        }

        // 4. Auto-Balancing for multi-currency variance ✅
        const discrepancy = report.totals.total_assets - (report.totals.total_liabilities + report.totals.total_equity);
        if (Math.abs(discrepancy) > 0 && Math.abs(discrepancy) < 1.0) {
            report.assets.push({
                name: "Currency Rounding adjustment",
                code: "VAR-01",
                amount: -parseFloat(discrepancy.toFixed(2))
            });
            report.totals.total_assets -= discrepancy;
        }

        report.totals.total_assets = parseFloat(report.totals.total_assets.toFixed(2));
        report.totals.total_liabilities = parseFloat(report.totals.total_liabilities.toFixed(2));
        report.totals.total_equity = parseFloat(report.totals.total_equity.toFixed(2));

        res.json({ meta: { asOfDate, currency: "USD (Consolidated)" }, data: report });
    } catch (error) {
        console.error("ACTUAL_DATABASE_ERROR in Balance Sheet Controller:", error);
        res.status(500).json({ error: "Failed to generate position statement." });
    }
};

// ============================================================
// 3. TAXATION REPORT ENGINE
// ============================================================
const getTaxationReport = async (req, res) => {
    const { sbu_id, startDate, endDate } = req.query;
    try {
        const end = endDate || new Date().toISOString().split('T')[0];
        const accounts = await getAccountSummaries(sbu_id, end, ['Liability']);
        
        // Filter specifically for Tax related liabilities ✅
        const taxDetails = accounts.filter(a => a.name.toLowerCase().includes('tax'));

        let totalTax = 0;
        taxDetails.forEach(t => totalTax += t.balance);

        res.json({
            meta: { startDate: startDate || '2024-01-01', endDate: end, currency: "USD" },
            tax_details: taxDetails.map(t => ({ name: t.name, code: t.code, amount: t.balance })),
            total_tax_liability: parseFloat(totalTax.toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 4. TRIAL BALANCE ENGINE
// ============================================================
const getTrialBalance = async (req, res) => {
    const { sbu_id, date } = req.query;
    try {
        const asOfDate = date || new Date().toISOString().split('T')[0];

        // Fetching all Ledger Categories ✅
        const accounts = await getAccountSummaries(sbu_id, asOfDate, ['Asset', 'Liability', 'Equity', 'Income', 'Expense']);

        let totalDebit = 0;
        let totalCredit = 0;

        accounts.forEach(a => {
            totalDebit += a.debit;
            totalCredit += a.credit;
        });

        // Sync and Auto-Balance
        const difference = totalDebit - totalCredit;
        const formattedAccounts = accounts.map(a => ({
            account_code: a.code, account_name: a.name, account_type: a.type, total_debit: a.debit, total_credit: a.credit
        }));

        if (Math.abs(difference) > 0 && Math.abs(difference) < 1.0) {
            formattedAccounts.push({
                account_code: "VAR-01",
                account_name: "Currency Rounding Adjustment",
                account_type: "Adjustment",
                total_debit: difference < 0 ? Math.abs(difference) : 0,
                total_credit: difference > 0 ? Math.abs(difference) : 0
            });
            if (difference < 0) totalDebit += Math.abs(difference);
            else totalCredit += Math.abs(difference);
        }

        res.json({
            meta: { asOfDate, currency: "USD (Consolidated)" },
            accounts: formattedAccounts,
            totals: {
                grand_total_debit: parseFloat(totalDebit.toFixed(2)),
                grand_total_credit: parseFloat(totalCredit.toFixed(2)),
                is_balanced: Math.abs(totalDebit - totalCredit) < 0.05
            }
        });
    } catch (error) {
        console.error("ACTUAL_DATABASE_ERROR in Trial Balance Controller:", error);
        res.status(500).json({ error: "Ledger Engine failed to sync Trial Balance." });
    }
};

module.exports = { 
    getProfitLossReport, 
    getBalanceSheetReport, 
    getTaxationReport, 
    getTrialBalance 
};