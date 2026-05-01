const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controller: getIndividualSbuReport
 * Purpose: Generates performance analytics for a specific Business Unit.
 * Features: Time-range filtering, flattened chart data, and SKU ranking.
 * Update: Robust Date range handling to ensure "Today" and custom filters work 100%. ✅
 */
const getIndividualSbuReport = async (req, res) => {
    // Extracting filters from the request query parameters
    const { sbu_id, startDate, endDate } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is required for reporting." });
    }

    try {
        const id = parseInt(sbu_id);

        // 1. Constructing a Robust Date Filter ✅
        const dateRangeFilter = {};
        if (startDate && endDate) {
            // Setting time to Start of Day (00:00:00) and End of Day (23:59:59)
            // This ensures "Today" filter captures all transactions made during the day.
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateRangeFilter.order_date = {
                gte: start,
                lte: end
            };
        }

        // 2. Fetch SBU basic info
        const sbuInfo = await prisma.sbus.findUnique({
            where: { id: id }
        });

        // 3. Sales Trend Logic (Optimized for Recharts) ✅
        const salesTrendRaw = await prisma.orders.groupBy({
            by: ['order_date'],
            where: { 
                sbu_id: id,
                deleted_at: null,
                ...dateRangeFilter 
            },
            _sum: { total_amount: true },
            orderBy: { order_date: 'asc' }
        });

        // Mapping to Flat Structure: { date: 'Apr 4', sales: 1500 }
        const dailyTrend = salesTrendRaw.map(item => ({
            date: item.order_date ? new Date(item.order_date).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' }) : 'N/A',
            sales: parseFloat(item._sum.total_amount || 0)
        }));

        // 4. Top Selling SKUs Logic
        const topProductsRaw = await prisma.order_items.groupBy({
            by: ['variant_id'],
            where: { 
                orders: { 
                    sbu_id: id,
                    deleted_at: null,
                    ...dateRangeFilter 
                } 
            },
            _sum: { quantity: true, subtotal: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5 
        });

        const enrichedTopProducts = await Promise.all(topProductsRaw.map(async (p) => {
            const variant = await prisma.product_variants.findUnique({
                where: { id: p.variant_id },
                include: { products: true }
            });
            return {
                name: variant?.products?.name || "Deleted Product",
                sku: variant?.sku || "N/A",
                total_sold: p._sum.quantity || 0,
                revenue: parseFloat(p._sum.subtotal || 0).toFixed(2)
            };
        }));

        // 5. Recent Unit Activity
        const recentActivity = await prisma.orders.findMany({
            where: { 
                sbu_id: id,
                deleted_at: null,
                ...dateRangeFilter 
            },
            orderBy: { created_at: 'desc' },
            take: 10,
            include: { 
                customers: { select: { customer_name: true } } 
            }
        });

        // Final Consolidated Response
        res.json({
            sbu_name: sbuInfo?.sbu_name || "Business Unit",
            currency: sbuInfo?.currency || "USD",
            daily_trend: dailyTrend, // Flattened data ✅
            top_products: enrichedTopProducts,
            recent_activity: recentActivity
        });

    } catch (error) {
        console.error("SBU_PERFORMANCE_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to compile independent unit performance report." });
    }
};

module.exports = { getIndividualSbuReport };