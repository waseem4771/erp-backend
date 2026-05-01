const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Aging Controller
 * Purpose: Analyzes outstanding debt (Receivables) and liabilities (Payables).
 * Requirements: Categorization into Current, 30, 60, and 90+ day buckets.
 */

// ============================================================
// 1. ACCOUNTS RECEIVABLE (AR) AGING REPORT
// ============================================================
/**
 * Function: getARAgingReport
 * Purpose: Tracks outstanding payments owed by customers.
 */
const getARAgingReport = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const today = new Date();
        
        // Fetching only 'Invoiced' or 'Pending' orders that haven't been fully paid yet
        const unpaidOrders = await prisma.orders.findMany({
            where: {
                status: { in: ['Invoiced', 'Pending'] },
                deleted_at: null,
                ...(sbu_id && { sbu_id: parseInt(sbu_id) })
            },
            include: { customers: true }
        });

        // Initialize aging buckets
        const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
        const customerDetails = {};

        unpaidOrders.forEach(order => {
            const orderDate = new Date(order.order_date || order.created_at);
            // Calculate difference in days from today
            const daysDiff = Math.ceil(Math.abs(today - orderDate) / (1000 * 60 * 60 * 24));
            const amount = parseFloat(order.total_amount);
            const name = order.customers?.customer_name || "Guest Customer";

            // Determine the correct aging bucket
            let bucket = daysDiff <= 30 ? "current" : daysDiff <= 60 ? "overdue30" : daysDiff <= 90 ? "overdue60" : "overdue90";

            // Aggregate totals for the summary view
            aging[bucket] += amount;
            aging.total += amount;

            // Aggregate totals for individual customer details
            if (!customerDetails[name]) {
                customerDetails[name] = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
            }
            customerDetails[name][bucket] += amount;
            customerDetails[name].total += amount;
        });

        res.json({ 
            summary: aging, 
            details: Object.entries(customerDetails).map(([name, data]) => ({ name, ...data })) 
        });
    } catch (error) {
        console.error("AR_AGING_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to generate accounts receivable aging report." });
    }
};

// ============================================================
// 2. ACCOUNTS PAYABLE (AP) AGING REPORT
// ============================================================
/**
 * Function: getAPAgingReport
 * Purpose: Tracks outstanding liabilities owed to suppliers/vendors.
 */
const getAPAgingReport = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const today = new Date();

        // Fetching Purchase Orders that are received but payment is pending
        const unpaidBills = await prisma.purchase_orders.findMany({
            where: {
                status: { in: ['Pending', 'Received', 'Manager_Approved', 'Director_Approved'] },
                deleted_at: null,
                ...(sbu_id && { sbu_id: parseInt(sbu_id) })
            },
            include: { suppliers: true }
        });

        // Initialize aging buckets
        const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
        const vendorDetails = {};

        unpaidBills.forEach(bill => {
            const billDate = new Date(bill.order_date);
            const daysDiff = Math.ceil(Math.abs(today - billDate) / (1000 * 60 * 60 * 24));
            const amount = parseFloat(bill.total_amount);
            const name = bill.suppliers?.supplier_name || "Unknown Vendor";

            // Determine the correct aging bucket
            let bucket = daysDiff <= 30 ? "current" : daysDiff <= 60 ? "overdue30" : daysDiff <= 90 ? "overdue60" : "overdue90";

            // Aggregate totals for the summary view
            aging[bucket] += amount;
            aging.total += amount;

            // Aggregate totals for individual vendor details
            if (!vendorDetails[name]) {
                vendorDetails[name] = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0, total: 0 };
            }
            vendorDetails[name][bucket] += amount;
            vendorDetails[name].total += amount;
        });

        res.json({ 
            summary: aging, 
            details: Object.entries(vendorDetails).map(([name, data]) => ({ name, ...data })) 
        });
    } catch (error) {
        console.error("AP_AGING_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to generate accounts payable aging report." });
    }
};

module.exports = { 
    getARAgingReport, 
    getAPAgingReport 
};