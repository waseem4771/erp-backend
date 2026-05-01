
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// /**
//  * Controller: getDashboardSummary
//  * Purpose: Aggregates real-time financial data, charts, and low-stock alerts for the Mother Dashboard.
//  * Update: Added profit_share_percentage selection for global unit registry. ✅
//  */
// const getDashboardSummary = async (req, res) => {
//     const { sbu_id } = req.query; 

//     try {
//         // 1. Fetch Latest Exchange Rates for USD Conversion
//         const rates = await prisma.currency_rates.findMany();
//         const rateMap = {};
//         rates.forEach(r => {
//             rateMap[r.from_currency] = parseFloat(r.exchange_rate);
//         });

//         // 2. Define Global Filter Context
//         const globalFilter = sbu_id ? { sbu_id: parseInt(sbu_id) } : {};

//         // 3. Fetch Ledger Entries for Financial Aggregation
//         const ledgerEntries = await prisma.ledger_entries.findMany({
//             where: {
//                 journal_entries: {
//                     ...globalFilter,
//                     users: { status: 'Active' } 
//                 }
//             },
//             include: {
//                 chart_of_accounts: true,
//                 journal_entries: {
//                     include: { sbus: true }
//                 }
//             }
//         });

//         let totalRevenueUSD = 0;
//         let totalExpenseUSD = 0;
//         const monthlyAggregation = {};

//         // 4. Process Multi-Currency Transactions into USD
//         ledgerEntries.forEach(entry => {
//             const sbuCurrency = entry.journal_entries.sbus.currency || 'USD';
//             const rate = sbuCurrency === 'USD' ? 1 : (rateMap[sbuCurrency] || 1);
            
//             const debitUSD = parseFloat(entry.debit || 0) / rate;
//             const creditUSD = parseFloat(entry.credit || 0) / rate;

//             const monthName = new Date(entry.journal_entries.transaction_date).toLocaleString('en-US', { month: 'short' });

//             if (!monthlyAggregation[monthName]) {
//                 monthlyAggregation[monthName] = { month: monthName, revenue: 0, expense: 0 };
//             }

//             if (entry.chart_of_accounts.account_type === 'Income') {
//                 totalRevenueUSD += creditUSD;
//                 monthlyAggregation[monthName].revenue += creditUSD;
//             } else if (entry.chart_of_accounts.account_type === 'Expense') {
//                 totalExpenseUSD += debitUSD;
//                 monthlyAggregation[monthName].expense += debitUSD;
//             }
//         });

//         // 5. LOW STOCK ALERTS LOGIC
//         const stockData = await prisma.stock_levels.findMany({
//             where: {
//                 warehouses: { sbu_id: sbu_id ? parseInt(sbu_id) : undefined }
//             },
//             include: {
//                 product_variants: { include: { products: true } },
//                 warehouses: true
//             }
//         });

//         const lowStockAlerts = stockData.filter(item => 
//             (item.quantity || 0) <= (item.safety_stock || 0)
//         ).map(item => ({
//             id: item.id,
//             product_name: item.product_variants.products.name,
//             variant: item.product_variants.variant_name,
//             sku: item.product_variants.sku,
//             quantity: item.quantity,
//             safety_stock: item.safety_stock,
//             warehouse: item.warehouses.name
//         })).slice(0, 5);

//         // 6. SBU-WISE PERFORMANCE BREAKDOWN (Updated to select Profit Share %) ✅
//         const sbuStats = await prisma.sbus.findMany({
//             include: { 
//                 orders: { 
//                     where: { deleted_at: null },
//                     select: { total_amount: true } 
//                 } 
//             }
//         });

//         const sbuBreakdown = sbuStats.map(sbu => {
//             const rate = sbu.currency === 'USD' ? 1 : (rateMap[sbu.currency] || 1);
//             const totalRevenueLocal = sbu.orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
//             return {
//                 id: sbu.id,
//                 sbu_name: sbu.sbu_name,
//                 revenue: (totalRevenueLocal / rate).toFixed(2),
//                 local_currency: sbu.currency,
//                 // Included for Unit configuration visibility ✅
//                 profit_share_percentage: parseFloat(sbu.profit_share_percentage || 0).toFixed(2)
//             };
//         });

//         // Response payload
//         res.json({
//             summary: {
//                 total_revenue: totalRevenueUSD.toFixed(2),
//                 total_expenses: totalExpenseUSD.toFixed(2),
//                 net_profit: (totalRevenueUSD - totalExpenseUSD).toFixed(2),
//                 active_sbus: await prisma.sbus.count(),
//                 total_customers: await prisma.customers.count({ where: globalFilter })
//             },
//             chart_data: Object.values(monthlyAggregation).map(m => ({
//                 month: m.month,
//                 revenue: parseFloat(m.revenue.toFixed(2)),
//                 expense: parseFloat(m.expense.toFixed(2))
//             })),
//             sbu_breakdown: sbuBreakdown,
//             low_stock_alerts: lowStockAlerts
//         });

//     } catch (error) {
//         console.error("DASHBOARD_CONTROLLER_ERROR:", error.message);
//         res.status(500).json({ error: "Failed to generate consolidated dashboard intelligence." });
//     }
// };

// /**
//  * Controller: getInternalAuditLogs
//  * Purpose: Fetches the security audit trail from the system.
//  */
// const getInternalAuditLogs = async (req, res) => {
//     const { sbu_id } = req.query;

//     try {
//         const auditFilter = sbu_id ? {
//             sbu_id: parseInt(sbu_id)
//         } : {};

//         const logs = await prisma.audit_logs.findMany({
//             where: auditFilter,
//             include: {
//                 users: {
//                     select: { 
//                         full_name: true, 
//                         email: true
//                     }
//                 }
//             },
//             orderBy: { 
//                 created_at: 'desc' 
//             },
//             take: 100 
//         });
        
//         res.json(logs);
//     } catch (error) {
//         console.error("AUDIT_LOG_CONTROLLER_ERROR:", error.message);
//         res.status(500).json({ error: "Failed to synchronize internal security audit trail." });
//     }
// };

// module.exports = { 
//     getDashboardSummary, 
//     getInternalAuditLogs 
// };





//---------------------------------------------------------------------------------------------


// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// /**
//  * Controller: getDashboardSummary
//  * Purpose: Aggregates real-time financial data, charts, and low-stock alerts for the Mother Dashboard.
//  * Update: Integrated dynamic Date Range filtering for Executive Intelligence. ✅
//  * Update: Added intelligent chart grouping (Daily vs Monthly) based on selected range. ✅
//  */
// const getDashboardSummary = async (req, res) => {
//     const { sbu_id, startDate, endDate } = req.query; 

//     try {
//         // 1. Fetch Latest Exchange Rates for USD Conversion
//         const rates = await prisma.currency_rates.findMany();
//         const rateMap = {};
//         rates.forEach(r => {
//             rateMap[r.from_currency] = parseFloat(r.exchange_rate);
//         });

//         // 2. Define Global & Date Filter Context
//         const globalFilter = sbu_id ? { sbu_id: parseInt(sbu_id) } : {};
        
//         const dateFilter = {};
//         if (startDate && endDate) {
//             dateFilter.gte = new Date(startDate);
//             dateFilter.lte = new Date(endDate);
//         }

//         // 3. Fetch Ledger Entries for Financial Aggregation (With Date Filter ✅)
//         const ledgerEntries = await prisma.ledger_entries.findMany({
//             where: {
//                 journal_entries: {
//                     ...globalFilter,
//                     ...(startDate && endDate && { transaction_date: dateFilter }),
//                     users: { status: 'Active' } 
//                 }
//             },
//             include: {
//                 chart_of_accounts: true,
//                 journal_entries: {
//                     include: { sbus: true }
//                 }
//             }
//         });

//         let totalRevenueUSD = 0;
//         let totalExpenseUSD = 0;
//         const chartAggregation = {};

//         // Calculate range to determine chart grouping (Daily vs Monthly)
//         const isSmallRange = startDate && endDate && 
//             (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) <= 35;

//         // 4. Process Multi-Currency Transactions into USD
//         ledgerEntries.forEach(entry => {
//             const sbuCurrency = entry.journal_entries.sbus.currency || 'USD';
//             const rate = sbuCurrency === 'USD' ? 1 : (rateMap[sbuCurrency] || 1);
            
//             const debitUSD = parseFloat(entry.debit || 0) / rate;
//             const creditUSD = parseFloat(entry.credit || 0) / rate;

//             // Dynamic Label Logic: Date (Daily) or Month Name (Monthly) ✅
//             const transDate = new Date(entry.journal_entries.transaction_date);
//             const label = isSmallRange 
//                 ? transDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
//                 : transDate.toLocaleString('en-US', { month: 'short' });

//             if (!chartAggregation[label]) {
//                 chartAggregation[label] = { label: label, revenue: 0, expense: 0 };
//             }

//             if (entry.chart_of_accounts.account_type === 'Income') {
//                 totalRevenueUSD += creditUSD;
//                 chartAggregation[label].revenue += creditUSD;
//             } else if (entry.chart_of_accounts.account_type === 'Expense') {
//                 totalExpenseUSD += debitUSD;
//                 chartAggregation[label].expense += debitUSD;
//             }
//         });

//         // 5. LOW STOCK ALERTS LOGIC
//         const stockData = await prisma.stock_levels.findMany({
//             where: {
//                 warehouses: { sbu_id: sbu_id ? parseInt(sbu_id) : undefined }
//             },
//             include: {
//                 product_variants: { include: { products: true } },
//                 warehouses: true
//             }
//         });

//         const lowStockAlerts = stockData.filter(item => 
//             (item.quantity || 0) <= (item.safety_stock || 0)
//         ).map(item => ({
//             id: item.id,
//             product_name: item.product_variants.products.name,
//             variant: item.product_variants.variant_name,
//             sku: item.product_variants.sku,
//             quantity: item.quantity,
//             safety_stock: item.safety_stock,
//             warehouse: item.warehouses.name
//         })).slice(0, 5);

//         // 6. SBU-WISE PERFORMANCE BREAKDOWN
//         const sbuStats = await prisma.sbus.findMany({
//             include: { 
//                 orders: { 
//                     where: { 
//                         deleted_at: null,
//                         ...(startDate && endDate && { order_date: dateFilter }) 
//                     },
//                     select: { total_amount: true } 
//                 } 
//             }
//         });

//         const sbuBreakdown = sbuStats.map(sbu => {
//             const rate = sbu.currency === 'USD' ? 1 : (rateMap[sbu.currency] || 1);
//             const totalRevenueLocal = sbu.orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
//             return {
//                 id: sbu.id,
//                 sbu_name: sbu.sbu_name,
//                 revenue: (totalRevenueLocal / rate).toFixed(2),
//                 local_currency: sbu.currency,
//                 profit_share_percentage: parseFloat(sbu.profit_share_percentage || 0).toFixed(2)
//             };
//         });

//         // Response payload
//         res.json({
//             summary: {
//                 total_revenue: totalRevenueUSD.toFixed(2),
//                 total_expenses: totalExpenseUSD.toFixed(2),
//                 net_profit: (totalRevenueUSD - totalExpenseUSD).toFixed(2),
//                 active_sbus: await prisma.sbus.count(),
//                 total_customers: await prisma.customers.count({ where: globalFilter })
//             },
//             chart_data: Object.values(chartAggregation).map(c => ({
//                 month: c.label, // Kept key as 'month' for frontend chart compatibility
//                 revenue: parseFloat(c.revenue.toFixed(2)),
//                 expense: parseFloat(c.expense.toFixed(2))
//             })),
//             sbu_breakdown: sbuBreakdown,
//             low_stock_alerts: lowStockAlerts
//         });

//     } catch (error) {
//         console.error("DASHBOARD_CONTROLLER_ERROR:", error.message);
//         res.status(500).json({ error: "Failed to generate consolidated dashboard intelligence." });
//     }
// };

// /**
//  * Controller: getInternalAuditLogs
//  * Purpose: Fetches the security audit trail from the system.
//  */
// const getInternalAuditLogs = async (req, res) => {
//     const { sbu_id } = req.query;

//     try {
//         const auditFilter = sbu_id ? {
//             sbu_id: parseInt(sbu_id)
//         } : {};

//         const logs = await prisma.audit_logs.findMany({
//             where: auditFilter,
//             include: {
//                 users: {
//                     select: { 
//                         full_name: true, 
//                         email: true
//                     }
//                 }
//             },
//             orderBy: { 
//                 created_at: 'desc' 
//             },
//             take: 100 
//         });
        
//         res.json(logs);
//     } catch (error) {
//         console.error("AUDIT_LOG_CONTROLLER_ERROR:", error.message);
//         res.status(500).json({ error: "Failed to synchronize internal security audit trail." });
//     }
// };

// module.exports = { 
//     getDashboardSummary, 
//     getInternalAuditLogs 
// };











const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controller: getDashboardSummary
 * Purpose: Aggregates real-time financial data, charts, and low-stock alerts for the Mother Dashboard.
 * Update: Hard-fixed Date Filtering logic to ensure charts update instantly on preset selection. ✅
 * Update: Synchronized SBU breakdown list with dynamic date ranges. ✅
 */
const getDashboardSummary = async (req, res) => {
    const { sbu_id, startDate, endDate } = req.query; 

    try {
        // 1. Fetch Latest Exchange Rates for USD Conversion
        const rates = await prisma.currency_rates.findMany();
        const rateMap = {};
        rates.forEach(r => {
            rateMap[r.from_currency] = parseFloat(r.exchange_rate);
        });

        // 2. Define Filters Context
        const globalFilter = sbu_id ? { sbu_id: parseInt(sbu_id) } : {};
        
        // Constructing a mathematically precise Date Filter ✅
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            dateFilter.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        // 3. Fetch Ledger Entries (Strictly Filtered by Date and Unit ✅)
        const ledgerEntries = await prisma.ledger_entries.findMany({
            where: {
                journal_entries: {
                    ...globalFilter,
                    // Mandatory Check: If dates are provided, they must be enforced here
                    ...(startDate && endDate && { transaction_date: dateFilter })
                }
            },
            include: {
                chart_of_accounts: true,
                journal_entries: {
                    include: { sbus: true }
                }
            }
        });

        let totalRevenueUSD = 0;
        let totalExpenseUSD = 0;
        const chartAggregation = {};

        // Calculate if the range is small (under 35 days) for Daily vs Monthly view
        const isSmallRange = startDate && endDate && 
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) <= 35;

        // 4. Process Multi-Currency Transactions
        ledgerEntries.forEach(entry => {
            const sbuCurrency = entry.journal_entries.sbus.currency || 'USD';
            const rate = sbuCurrency === 'USD' ? 1 : (rateMap[sbuCurrency] || 1);
            
            const debitUSD = parseFloat(entry.debit || 0) / rate;
            const creditUSD = parseFloat(entry.credit || 0) / rate;

            // Generate precise labels for the chart axis
            const transDate = new Date(entry.journal_entries.transaction_date);
            const label = isSmallRange 
                ? transDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
                : transDate.toLocaleString('en-US', { month: 'short' });

            if (!chartAggregation[label]) {
                chartAggregation[label] = { label: label, date: transDate, revenue: 0, expense: 0 };
            }

            if (entry.chart_of_accounts.account_type === 'Income') {
                totalRevenueUSD += creditUSD;
                chartAggregation[label].revenue += creditUSD;
            } else if (entry.chart_of_accounts.account_type === 'Expense') {
                totalExpenseUSD += debitUSD;
                chartAggregation[label].expense += debitUSD;
            }
        });

        // 5. LOW STOCK ALERTS LOGIC (Context-aware)
        const stockData = await prisma.stock_levels.findMany({
            where: {
                warehouses: { sbu_id: sbu_id ? parseInt(sbu_id) : undefined }
            },
            include: {
                product_variants: { include: { products: true } },
                warehouses: true
            }
        });

        const lowStockAlerts = stockData.filter(item => 
            (item.quantity || 0) <= (item.safety_stock || 0)
        ).map(item => ({
            id: item.id,
            product_name: item.product_variants.products.name,
            variant: item.product_variants.variant_name,
            sku: item.product_variants.sku,
            quantity: item.quantity,
            safety_stock: item.safety_stock,
            warehouse: item.warehouses.name
        })).slice(0, 5);

        // 6. SBU-WISE PERFORMANCE (Must also respect Date Filters ✅)
        const sbuStats = await prisma.sbus.findMany({
            include: { 
                orders: { 
                    where: { 
                        deleted_at: null,
                        ...(startDate && endDate && { order_date: dateFilter }) 
                    },
                    select: { total_amount: true } 
                } 
            }
        });

        const sbuBreakdown = sbuStats.map(sbu => {
            const rate = sbu.currency === 'USD' ? 1 : (rateMap[sbu.currency] || 1);
            const totalRevenueLocal = sbu.orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            return {
                id: sbu.id,
                sbu_name: sbu.sbu_name,
                revenue: (totalRevenueLocal / rate).toFixed(2),
                local_currency: sbu.currency,
                profit_share_percentage: parseFloat(sbu.profit_share_percentage || 0).toFixed(2)
            };
        });

        // Sorting chart data by date to ensure correct timeline flow
        const sortedChartData = Object.values(chartAggregation)
            .sort((a, b) => a.date - b.date)
            .map(c => ({
                month: c.label, 
                revenue: parseFloat(c.revenue.toFixed(2)),
                expense: parseFloat(c.expense.toFixed(2))
            }));

        // Final Response Payload
        res.json({
            summary: {
                total_revenue: totalRevenueUSD.toFixed(2),
                total_expenses: totalExpenseUSD.toFixed(2),
                net_profit: (totalRevenueUSD - totalExpenseUSD).toFixed(2),
                active_sbus: await prisma.sbus.count(),
                total_customers: await prisma.customers.count({ where: globalFilter })
            },
            chart_data: sortedChartData,
            sbu_breakdown: sbuBreakdown,
            low_stock_alerts: lowStockAlerts
        });

    } catch (error) {
        console.error("DASHBOARD_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to generate consolidated dashboard intelligence." });
    }
};

/**
 * Controller: getInternalAuditLogs
 * Purpose: Fetches the security audit trail from the system.
 */
const getInternalAuditLogs = async (req, res) => {
    const { sbu_id } = req.query;

    try {
        const auditFilter = sbu_id ? { sbu_id: parseInt(sbu_id) } : {};

        const logs = await prisma.audit_logs.findMany({
            where: auditFilter,
            include: {
                users: { select: { full_name: true, email: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 100 
        });
        
        res.json(logs);
    } catch (error) {
        console.error("AUDIT_LOG_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to synchronize security trail." });
    }
};

module.exports = { 
    getDashboardSummary, 
    getInternalAuditLogs 
};