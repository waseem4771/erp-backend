

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * External Integration Controller (Marketplace Gateway)
 * Purpose: Handles real-time synchronization with Shopify, WooCommerce, and MERN stores.
 * Logic: Auto-Customer Creation, Inventory Deduction, and Dynamic Ledger Posting.
 * Update: Added Duplicate Order Prevention and Dynamic Account Resolution. ✅
 */

// ============================================================
// 1. SYNC EXTERNAL ORDER (Shopify / WooCommerce / MERN)
// ============================================================
const syncExternalOrder = async (req, res) => {
    const { customer_info, items, total_amount, platform_order_id } = req.body;
    const sbu_id = req.sbu_id; // Extracted from External Auth Middleware

    try {
        const result = await prisma.$transaction(async (tx) => {
            
            // A. PREVENT DUPLICATES: Check if this platform order was already synced ✅
            const existingJournal = await tx.journal_entries.findFirst({
                where: { reference_no: platform_order_id, sbu_id: sbu_id }
            });

            if (existingJournal) {
                throw new Error(`Order ${platform_order_id} is already synchronized with ERP.`);
            }

            // B. CUSTOMER MANAGEMENT: Find by email within SBU or Create New
            let customer = await tx.customers.findFirst({
                where: { email: customer_info.email, sbu_id: sbu_id }
            });

            if (!customer) {
                customer = await tx.customers.create({
                    data: {
                        sbu_id: sbu_id,
                        customer_name: customer_info.name,
                        email: customer_info.email,
                        phone: customer_info.phone || '',
                        source: 'External Marketplace'
                    }
                });
            }

            // C. ORDER CREATION
            const order = await tx.orders.create({
                data: {
                    sbu_id: sbu_id,
                    customer_id: customer.id,
                    total_amount: parseFloat(total_amount),
                    status: 'Paid', // Marketplace orders are usually prepaid
                    order_date: new Date()
                }
            });

            // D. ITEMS PROCESSING & STOCK DEDUCTION
            for (const item of items) {
                const variant = await tx.product_variants.findUnique({
                    where: { sku: item.sku },
                    include: { products: true }
                });

                if (!variant) throw new Error(`SKU ${item.sku} not found in ERP Master Catalog.`);

                // Record Line Item
                await tx.order_items.create({
                    data: {
                        order_id: order.id,
                        variant_id: variant.id,
                        quantity: parseInt(item.quantity),
                        unit_price: parseFloat(item.price),
                        subtotal: parseFloat(item.price) * parseInt(item.quantity)
                    }
                });

                // Deduct Inventory (Assuming first warehouse for auto-sync)
                const stock = await tx.stock_levels.findFirst({
                    where: { variant_id: variant.id, warehouses: { sbu_id: sbu_id } }
                });

                if (!stock || stock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for SKU ${item.sku} in Unit ${sbu_id}.`);
                }

                await tx.stock_levels.update({
                    where: { id: stock.id },
                    data: { quantity: { decrement: parseInt(item.quantity) } }
                });
            }

            // E. DYNAMIC ACCOUNTING SYNC (No hardcoded IDs) ✅
            // Finding the specific accounts for this Business Unit
            const cashAccount = await tx.chart_of_accounts.findFirst({
                where: { sbu_id: sbu_id, account_name: 'Cash on Hand' }
            });

            const revenueAccount = await tx.chart_of_accounts.findFirst({
                where: { sbu_id: sbu_id, account_name: 'Sales Revenue' }
            });

            if (!cashAccount || !revenueAccount) {
                throw new Error("Accounting Error: 'Cash on Hand' or 'Sales Revenue' accounts not configured for this unit.");
            }

            const journal = await tx.journal_entries.create({
                data: {
                    sbu_id: sbu_id,
                    transaction_date: new Date(),
                    description: `Marketplace Sync: Order #${platform_order_id} (${customer.customer_name})`,
                    reference_no: platform_order_id
                }
            });

            await tx.ledger_entries.createMany({
                data: [
                    { journal_id: journal.id, account_id: cashAccount.id, debit: parseFloat(total_amount), credit: 0 },
                    { journal_id: journal.id, account_id: revenueAccount.id, debit: 0, credit: parseFloat(total_amount) }
                ]
            });

            return order;
        });

        res.status(201).json({ 
            success: true, 
            message: "External order synchronized with Inventory & Ledger successfully.", 
            erp_order_id: result.id 
        });

    } catch (error) {
        console.error("SYNC_EXTERNAL_ORDER_ERROR:", error.message);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================================
// 2. GET PRODUCT DATA (Real-time Inquiry for External Sites)
// ============================================================
const getExternalProductData = async (req, res) => {
    const { sku } = req.query; 
    const sbu_id = req.sbu_id; 

    if (!sku) return res.status(400).json({ error: "SKU is required for inquiry." });

    try {
        const variant = await prisma.product_variants.findUnique({
            where: { sku: sku },
            include: {
                products: true,
                stock_levels: {
                    where: { warehouses: { sbu_id: sbu_id } }
                },
                price_books: {
                    where: { sbu_id: sbu_id }
                }
            }
        });

        if (!variant) return res.status(404).json({ error: "SKU not registered in ERP catalog." });

        const totalStock = variant.stock_levels.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        // Tiered Pricing Logic (Default to Retail for External Sync)
        const customPriceEntry = variant.price_books.find(p => p.tier === 'Retail');
        const finalPrice = customPriceEntry ? parseFloat(customPriceEntry.price) : (parseFloat(variant.products.base_price) + parseFloat(variant.additional_price || 0));

        res.json({
            sku: variant.sku,
            product_name: variant.products.name,
            price: finalPrice,
            stock: totalStock,
            currency: "USD",
            is_active: variant.products.deleted_at === null
        });

    } catch (error) {
        console.error("GET_EXTERNAL_PRODUCT_ERROR:", error);
        res.status(500).json({ error: "Internal ERP lookup failed." });
    }
};

// ============================================================
// 3. GET API TRAFFIC LOGS (Monitoring)
// ============================================================
const getApiLogs = async (req, res) => {
    const { sbu_id } = req.query;
    if (!sbu_id) return res.status(400).json({ error: "sbu_id is required." });

    try {
        const logs = await prisma.api_logs.findMany({
            where: {
                api_keys: { sbu_id: parseInt(sbu_id) }
            },
            include: {
                api_keys: true 
            },
            orderBy: { created_at: 'desc' },
            take: 50 
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    syncExternalOrder, 
    getExternalProductData,
    getApiLogs 
};