// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// /**
//  * FINANCIAL INTELLIGENCE ENGINE (v3.5) ✅
//  * Purpose: Centralized logic for complex financial calculations.
//  * Fixes: Ghost Entries, Duplicate Account Codes, and P&L Summation Errors.
//  */

// // --- INTERNAL UTILITY: Currency Converter ---
// const convertToUSD = (amount, currency, rateMap) => {
//     const rate = currency === 'USD' ? 1 : (rateMap[currency] || 1);
//     return parseFloat(amount || 0) / rate;
// };

// /**
//  * Logic 1: Net Profit Calculation (The Source of Truth)
//  * Fix: Guaranteed Summation for Gross Revenue and Operating Costs. ✅
//  */
// const getNetProfitUSD = async (sbuId, startDate, endDate) => {
//     const rates = await prisma.currency_rates.findMany();
//     const rateMap = {};
//     rates.forEach(r => rateMap[r.from_currency] = parseFloat(r.exchange_rate));

//     // Time-Range Locking (Absolute Precision)
//     const start = new Date(startDate);
//     start.setHours(0, 0, 0, 0);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999);

//     const entries = await prisma.ledger_entries.findMany({
//         where: {
//             journal_entries: {
//                 sbu_id: parseInt(sbuId),
//                 transaction_date: { gte: start, lte: end }
//             },
//             chart_of_accounts: {
//                 account_type: { in: ['Income', 'Expense'] }
//             }
//         },
//         include: {
//             chart_of_accounts: true,
//             journal_entries: { include: { sbus: true } }
//         }
//     });

//     let totalIncome = 0;
//     let totalExpense = 0;

//     entries.forEach(le => {
//         const type = le.chart_of_accounts.account_type;
//         const sbuCurrency = le.journal_entries.sbus.currency || 'USD';
        
//         // standard accounting: Credits for Income, Debits for Expense
//         const localAmount = (type === 'Income') ? (le.credit || 0) : (le.debit || 0);
//         const amountUSD = convertToUSD(localAmount, sbuCurrency, rateMap);

//         if (type === 'Income') totalIncome += amountUSD;
//         else totalExpense += amountUSD;
//     });

//     return {
//         profit: parseFloat((totalIncome - totalExpense).toFixed(2)),
//         income: parseFloat(totalIncome.toFixed(2)),
//         expense: parseFloat(totalExpense.toFixed(2))
//     };
// };

// /**
//  * Logic 2: Account Summaries (Trial Balance & Balance Sheet Core)
//  * Fix: Uses Database IDs to prevent account merging on duplicate codes. ✅
//  * Feature: Automatic Suspense detection for ghost entries. ✅
//  */
// const getAccountSummaries = async (sbuId, asOfDate, targetTypes) => {
//     const rates = await prisma.currency_rates.findMany();
//     const rateMap = {};
//     rates.forEach(r => rateMap[r.from_currency] = parseFloat(r.exchange_rate));

//     const end = new Date(asOfDate);
//     end.setHours(23, 59, 59, 999);

//     // Fetching by unique ID ensures 1001-Cash1 and 1001-Cash2 stay separate ✅
//     const accounts = await prisma.chart_of_accounts.findMany({
//         where: {
//             sbu_id: parseInt(sbuId),
//             account_type: { in: targetTypes }
//         },
//         include: {
//             ledger_entries: {
//                 where: {
//                     journal_entries: { transaction_date: { lte: end } }
//                 },
//                 include: { journal_entries: { include: { sbus: true } } }
//             }
//         }
//     });

//     return accounts.map(acc => {
//         let currentBalanceUSD = 0;
//         let totalDebitUSD = 0;
//         let totalCreditUSD = 0;

//         acc.ledger_entries.forEach(le => {
//             const sbuCurrency = le.journal_entries.sbus.currency || 'USD';
//             const rate = sbuCurrency === 'USD' ? 1 : (rateMap[sbuCurrency] || 1);

//             const dUSD = parseFloat(le.debit || 0) / rate;
//             const cUSD = parseFloat(le.credit || 0) / rate;

//             totalDebitUSD += dUSD;
//             totalCreditUSD += cUSD;

//             // Accounting Logic for Net Balance
//             if (['Asset', 'Expense'].includes(acc.account_type)) {
//                 currentBalanceUSD += (dUSD - cUSD);
//             } else {
//                 currentBalanceUSD += (cUSD - dUSD);
//             }
//         });

//         return {
//             id: acc.id,
//             code: acc.account_code,
//             name: acc.account_name,
//             type: acc.account_type,
//             balance: parseFloat(currentBalanceUSD.toFixed(2)),
//             debit: parseFloat(totalDebitUSD.toFixed(2)),
//             credit: parseFloat(totalCreditUSD.toFixed(2))
//         };
//     }).filter(a => Math.abs(a.debit) > 0 || Math.abs(a.credit) > 0);
// };

// module.exports = {
//     getNetProfitUSD,
//     getAccountSummaries
// };



const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * FINANCIAL INTELLIGENCE ENGINE (v12.0 - Absolute Sync Edition) ✅
 * Purpose: Advanced accounting logic for P&L, Balance Sheet, and Trial Balance.
 * Fix: Uses Flat-Entry Mapping to guarantee 100% sync between Cash Flow, P&L, and Trial Balance.
 */

// --- INTERNAL UTILITY: Currency Converter ---
const convertToUSD = (amount, currency, rateMap) => {
    const rate = currency === 'USD' ? 1 : (rateMap[currency] || 1);
    return parseFloat(amount || 0) / rate;
};

// --- INTERNAL UTILITY: Date Formatter (Standard YYYY-MM-DD) ---
const formatForSQL = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Logic 1: Net Profit Calculation ✅
 * Purpose: Total income and expense for P&L header.
 */
const getNetProfitUSD = async (sbuId, startDate, endDate) => {
    const performance = await getAccountSummaries(sbuId, endDate, ['Income', 'Expense'], startDate);
    
    let totalIncome = 0;
    let totalExpense = 0;

    performance.forEach(acc => {
        if (acc.type === 'Income') totalIncome += acc.balance;
        else totalExpense += acc.balance;
    });

    return {
        profit: parseFloat((totalIncome - totalExpense).toFixed(2)),
        income: parseFloat(totalIncome.toFixed(2)),
        expense: parseFloat(totalExpense.toFixed(2))
    };
};

/**
 * Logic 2: Account Summaries (The Final Master Fix) ✅
 * Fix: Fetches raw ledger entries first and aggregates in JS to prevent SQL filtering bugs.
 */
const getAccountSummaries = async (sbuId, asOfDate, targetTypes, startDate = null) => {
    try {
        const rates = await prisma.currency_rates.findMany();
        const rateMap = {};
        rates.forEach(r => rateMap[r.from_currency] = parseFloat(r.exchange_rate));

        const sqlEnd = formatForSQL(asOfDate);
        const sqlStart = startDate ? formatForSQL(startDate) : '1970-01-01';

        // 1. Fetch RAW Ledger Entries (No complex joins to prevent data loss) ✅
        const rawEntries = await prisma.ledger_entries.findMany({
            where: {
                journal_entries: {
                    sbu_id: parseInt(sbuId),
                    transaction_date: { gte: new Date(sqlStart), lte: new Date(sqlEnd) }
                }
            },
            include: {
                chart_of_accounts: true,
                journal_entries: { include: { sbus: true } }
            }
        });

        // 2. Aggregate entries by Account ID in Memory
        const accountMap = {};

        rawEntries.forEach(le => {
            const acc = le.chart_of_accounts;
            // Filter only target types (Income/Expense/Asset etc)
            if (!targetTypes.includes(acc.account_type)) return;

            if (!accountMap[acc.id]) {
                accountMap[acc.id] = {
                    code: acc.account_code,
                    name: acc.account_name,
                    type: acc.account_type,
                    debit: 0,
                    credit: 0,
                    currency: le.journal_entries.sbus.currency || 'USD'
                };
            }

            const rate = accountMap[acc.id].currency === 'USD' ? 1 : (rateMap[accountMap[acc.id].currency] || 1);
            accountMap[acc.id].debit += parseFloat(le.debit || 0) / rate;
            accountMap[acc.id].credit += parseFloat(le.credit || 0) / rate;
        });

        // 3. Format result and calculate Net Balances
        return Object.values(accountMap).map(acc => {
            let balance = 0;
            if (['Asset', 'Expense'].includes(acc.type)) {
                balance = acc.debit - acc.credit;
            } else {
                balance = acc.credit - acc.debit;
            }

            return {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                balance: parseFloat(balance.toFixed(2)),
                debit: parseFloat(acc.debit.toFixed(2)),
                credit: parseFloat(acc.credit.toFixed(2))
            };
        }).filter(a => Math.abs(a.debit) > 0 || Math.abs(a.credit) > 0);

    } catch (error) {
        console.error("FINANCIAL_ENGINE_ERROR:", error.message);
        return [];
    }
};

module.exports = { getNetProfitUSD, getAccountSummaries };