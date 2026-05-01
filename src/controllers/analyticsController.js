// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// // ============================================================
// // 1. DASHBOARD SUMMARY LOGIC (Consolidated & Filtered)
// // ============================================================
// const getMotherCompanySummary = async (req, res) => {
//     const { sbu_id } = req.query; 

//     try {
//         const globalFilter = sbu_id ? { sbu_id: parseInt(sbu_id) } : {};
//         const ledgerFilter = sbu_id ? { chart_of_accounts: { sbu_id: parseInt(sbu_id) } } : {};

//         const revenueResult = await prisma.ledger_entries.aggregate({
//             where: {
//                 ...ledgerFilter,
//                 chart_of_accounts: { 
//                     account_type: 'Income',
//                     ...(sbu_id && { sbu_id: parseInt(sbu_id) }) 
//                 }
//             },
//             _sum: { credit: true }
//         });

//         const expenseResult = await prisma.ledger_entries.aggregate({
//             where: {
//                 ...ledgerFilter,
//                 chart_of_accounts: { 
//                     account_type: 'Expense',
//                     ...(sbu_id && { sbu_id: parseInt(sbu_id) }) 
//                 }
//             },
//             _sum: { debit: true }
//         });

//         const rawChartData = await prisma.journal_entries.findMany({
//             where: globalFilter,
//             include: {
//                 ledger_entries: {
//                     include: { chart_of_accounts: true }
//                 }
//             },
//             orderBy: { transaction_date: 'asc' }
//         });

//         const monthlyAggregation = {};
//         rawChartData.forEach(entry => {
//             const monthName = new Date(entry.transaction_date).toLocaleString('default', { month: 'short' });
//             if (!monthlyAggregation[monthName]) {
//                 monthlyAggregation[monthName] = { month: monthName, revenue: 0, expense: 0 };
//             }
//             entry.ledger_entries.forEach(le => {
//                 if (le.chart_of_accounts.account_type === 'Income') {
//                     monthlyAggregation[monthName].revenue += parseFloat(le.credit || 0);
//                 } else if (le.chart_of_accounts.account_type === 'Expense') {
//                     monthlyAggregation[monthName].expense += parseFloat(le.debit || 0);
//                 }
//             });
//         });

//         const sbuStats = await prisma.sbus.findMany({
//             include: {
//                 orders: { select: { total_amount: true } }
//             }
//         });

//         const sbuBreakdown = sbuStats.map(sbu => {
//             const totalRevenue = sbu.orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
//             return {
//                 id: sbu.id,
//                 sbu_name: sbu.sbu_name,
//                 revenue: totalRevenue
//             };
//         });

//         const totalRevenue = parseFloat(revenueResult._sum.credit || 0);
//         const totalExpense = parseFloat(expenseResult._sum.debit || 0);

//         res.json({
//             summary: {
//                 total_revenue: totalRevenue,
//                 total_expenses: totalExpense,
//                 net_profit: totalRevenue - totalExpense,
//                 active_sbus: await prisma.sbus.count(),
//                 total_customers: await prisma.customers.count({ where: globalFilter })
//             },
//             chart_data: Object.values(monthlyAggregation),
//             sbu_breakdown: sbuBreakdown 
//         });

//     } catch (error) {
//         console.error("ANALYTICS_ERROR:", error);
//         res.status(500).json({ error: "Failed to fetch analytics summary" });
//     }
// };

// // ============================================================
// // 2. PROFIT & LOSS REPORT ENGINE
// // ============================================================
// const getProfitLossReport = async (req, res) => {
//     const { sbu_id, startDate, endDate } = req.query;

//     try {
//         const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//         const end = endDate ? new Date(endDate) : new Date();

//         const dateFilter = {
//             transaction_date: { gte: start, lte: end },
//             ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//         };

//         const accounts = await prisma.chart_of_accounts.findMany({
//             where: {
//                 OR: [{ account_type: 'Income' }, { account_type: 'Expense' }],
//                 ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//             },
//             include: {
//                 ledger_entries: { where: { journal_entries: dateFilter } }
//             }
//         });

//         let totalIncome = 0;
//         let totalExpense = 0;
//         const incomeList = [];
//         const expenseList = [];

//         accounts.forEach(acc => {
//             const balance = acc.ledger_entries.reduce((sum, entry) => {
//                 return sum + parseFloat(acc.account_type === 'Income' ? (entry.credit || 0) : (entry.debit || 0));
//             }, 0);

//             if (balance > 0) {
//                 const item = { name: acc.account_name, code: acc.account_code, amount: balance };
//                 if (acc.account_type === 'Income') {
//                     totalIncome += balance;
//                     incomeList.push(item);
//                 } else {
//                     totalExpense += balance;
//                     expenseList.push(item);
//                 }
//             }
//         });

//         res.json({
//             meta: { startDate: start, endDate: end, sbu_id: sbu_id || "All" },
//             income: incomeList,
//             expenses: expenseList,
//             totals: {
//                 total_income: totalIncome,
//                 total_expense: totalExpense,
//                 net_profit: totalIncome - totalExpense
//             }
//         });

//     } catch (error) {
//         console.error("PL_REPORT_ERROR:", error);
//         res.status(500).json({ error: "Failed to generate Profit & Loss report" });
//     }
// };

// // ============================================================
// // 3. BALANCE SHEET REPORT ENGINE
// // ============================================================
// const getBalanceSheetReport = async (req, res) => {
//     const { sbu_id, date } = req.query;

//     try {
//         const asOfDate = date ? new Date(date) : new Date();

//         const dateFilter = {
//             transaction_date: { lte: asOfDate },
//             ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//         };

//         const accounts = await prisma.chart_of_accounts.findMany({
//             where: {
//                 account_type: { in: ['Asset', 'Liability', 'Equity'] },
//                 ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//             },
//             include: {
//                 ledger_entries: { where: { journal_entries: dateFilter } }
//             }
//         });

//         const report = {
//             assets: [],
//             liabilities: [],
//             equity: [],
//             totals: { total_assets: 0, total_liabilities: 0, total_equity: 0 }
//         };

//         accounts.forEach(acc => {
//             const balance = acc.ledger_entries.reduce((sum, entry) => {
//                 if (acc.account_type === 'Asset') {
//                     return sum + (parseFloat(entry.debit || 0) - parseFloat(entry.credit || 0));
//                 } else {
//                     return sum + (parseFloat(entry.credit || 0) - parseFloat(entry.debit || 0));
//                 }
//             }, 0);

//             if (balance !== 0) {
//                 const item = { name: acc.account_name, code: acc.account_code, amount: balance };
//                 if (acc.account_type === 'Asset') {
//                     report.assets.push(item);
//                     report.totals.total_assets += balance;
//                 } else if (acc.account_type === 'Liability') {
//                     report.liabilities.push(item);
//                     report.totals.total_liabilities += balance;
//                 } else {
//                     report.equity.push(item);
//                     report.totals.total_equity += balance;
//                 }
//             }
//         });

//         res.json({
//             meta: { asOfDate, sbu_id: sbu_id || "All" },
//             data: report
//         });

//     } catch (error) {
//         console.error("BALANCE_SHEET_ERROR:", error);
//         res.status(500).json({ error: "Failed to generate Balance Sheet" });
//     }
// };

// // ============================================================
// // 4. AR AGING REPORT ENGINE
// // ============================================================
// const getARAgingReport = async (req, res) => {
//     const { sbu_id } = req.query;
//     try {
//         const today = new Date();
//         const unpaidOrders = await prisma.orders.findMany({
//             where: {
//                 status: { in: ['Invoiced', 'Pending'] },
//                 ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//             },
//             include: { customers: true }
//         });

//         const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
//         const customerDetails = {};

//         unpaidOrders.forEach(order => {
//             const orderDate = new Date(order.order_date || order.created_at);
//             const daysDiff = Math.ceil(Math.abs(today - orderDate) / (1000 * 60 * 60 * 24));
//             const amount = parseFloat(order.total_amount);
//             const name = order.customers?.customer_name || "Unknown";

//             let bucket = daysDiff <= 30 ? "current" : daysDiff <= 60 ? "overdue30" : daysDiff <= 90 ? "overdue60" : "overdue90";

//             aging[bucket] += amount;
//             aging.total += amount;

//             if (!customerDetails[name]) customerDetails[name] = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
//             customerDetails[name][bucket] += amount;
//             customerDetails[name].total += amount;
//         });

//         res.json({ summary: aging, details: Object.entries(customerDetails).map(([name, data]) => ({ name, ...data })) });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // ============================================================
// // 5. AP AGING REPORT ENGINE ✅ (NEW STEP 12a)
// // ============================================================
// const getAPAgingReport = async (req, res) => {
//     const { sbu_id } = req.query;
//     try {
//         const today = new Date();
//         const unpaidBills = await prisma.purchase_orders.findMany({
//             where: {
//                 status: { in: ['Pending', 'Received', 'Manager_Approved', 'Director_Approved'] },
//                 ...(sbu_id && { sbu_id: parseInt(sbu_id) })
//             },
//             include: { suppliers: true }
//         });

//         const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
//         const vendorDetails = {};

//         unpaidBills.forEach(bill => {
//             const billDate = new Date(bill.order_date);
//             const daysDiff = Math.ceil(Math.abs(today - billDate) / (1000 * 60 * 60 * 24));
//             const amount = parseFloat(bill.total_amount);
//             const name = bill.suppliers?.supplier_name || "Unknown Vendor";

//             let bucket = daysDiff <= 30 ? "current" : daysDiff <= 60 ? "overdue30" : daysDiff <= 90 ? "overdue60" : "overdue90";

//             aging[bucket] += amount;
//             aging.total += amount;

//             if (!vendorDetails[name]) vendorDetails[name] = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
//             vendorDetails[name][bucket] += amount;
//             vendorDetails[name].total += amount;
//         });

//         res.json({ summary: aging, details: Object.entries(vendorDetails).map(([name, data]) => ({ name, ...data })) });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// module.exports = { 
//     getMotherCompanySummary,
//     getProfitLossReport,
//     getBalanceSheetReport,
//     getARAgingReport,
//     getAPAgingReport // All 5 functions exported ✅
// };