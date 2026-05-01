
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');
const { postSalesToLedger } = require('../utils/ledgerHelper');

/**
 * Sales & Revenue Controller
 * Purpose: Manages customers, sales orders, quotations, and automated ledger synchronization.
 * Update: Integrated Customer Tier logic and fixed Audit Log positioning. ✅
 */

// ============================================================
// 1. CUSTOMER ENTITY MANAGEMENT
// ============================================================

const createCustomer = async (req, res) => {
    const { sbu_id, customer_name, email, phone, address, tier, user_id } = req.body;
    
    if (!sbu_id || !customer_name) {
        return res.status(400).json({ error: "SBU ID and Customer Name are mandatory." });
    }

    try {
        const customer = await prisma.customers.create({
            data: {
                sbu_id: parseInt(sbu_id),
                customer_name,
                email,
                phone,
                address,
                tier: tier || 'Retail' // Support for Customer Tiers (Retail, Wholesale, VIP) ✅
            }
        });

        // FIXED: Using the required argument order for Audit Logging ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'CREATE_CUSTOMER', 
            'Sales', 
            { customer_id: customer.id, name: customer_name, tier: customer.tier }, 
            req.ip
        );

        res.status(201).json({ success: true, message: "Customer registered successfully.", data: customer });
    } catch (error) {
        console.error("CREATE_CUSTOMER_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getCustomers = async (req, res) => {
    const { sbu_id } = req.query;
    if (!sbu_id) return res.status(400).json({ error: "SBU ID is required." });
    try {
        const customers = await prisma.customers.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { created_at: 'desc' }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 2. SALES ORDER & INVOICE MANAGEMENT
// ============================================================

const createOrder = async (req, res) => {
    const { sbu_id, customer_id, total_amount, items, user_id } = req.body; 
    if (!sbu_id || !customer_id || !items || items.length === 0) {
        return res.status(400).json({ error: "Incomplete order data." });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // A. Create the master Sales Order record
            const order = await tx.orders.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    customer_id: parseInt(customer_id),
                    total_amount: parseFloat(total_amount),
                    status: 'Invoiced',
                    order_date: new Date() // Ensures accuracy for "Today" filters ✅
                }
            });

            // B. Process line items and perform inventory deduction
            for (const item of items) {
                await tx.order_items.create({
                    data: {
                        order_id: order.id,
                        variant_id: parseInt(item.variant_id),
                        quantity: parseInt(item.quantity),
                        unit_price: parseFloat(item.unit_price),
                        subtotal: parseFloat(item.unit_price) * parseInt(item.quantity)
                    }
                });

                // Stock Validation
                const stock = await tx.stock_levels.findFirst({
                    where: { variant_id: parseInt(item.variant_id), warehouse_id: 1 }
                });

                if (!stock || stock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for variant ID ${item.variant_id}`);
                }

                await tx.stock_levels.update({
                    where: { id: stock.id },
                    data: { quantity: { decrement: parseInt(item.quantity) } }
                });
            }

            // C. Synchronize with General Ledger via Helper
            await postSalesToLedger(
                tx, 
                parseInt(sbu_id), 
                parseFloat(total_amount), 
                `Sales Order Payment: #INV-${order.id}`, 
                `INV-${order.id}`,
                user_id 
            );

            return order;
        });

        // Audit Logging with SBU context
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'CREATE_SALES_ORDER', 
            'Sales', 
            { order_id: result.id, amount: total_amount }, 
            req.ip
        );

        res.status(201).json({ success: true, message: "Order placed and ledger updated.", order: result });
    } catch (error) {
        console.error("SALES_ORDER_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getOrders = async (req, res) => {
    const { sbu_id } = req.query;
    if (!sbu_id) return res.status(400).json({ error: "SBU ID is required." });
    try {
        const orders = await prisma.orders.findMany({
            where: { sbu_id: parseInt(sbu_id), deleted_at: null },
            include: { 
                customers: true,
                order_items: { include: { product_variants: { include: { products: true } } } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;
    const { user_id, sbu_id } = req.body || {};
    try {
        await prisma.orders.update({
            where: { id: parseInt(id) },
            data: { deleted_at: new Date() }
        });
        
        await recordAuditLog(user_id, parseInt(sbu_id), 'SOFT_DELETE_ORDER', 'Sales', { order_id: id }, req.ip);
        res.json({ success: true, message: "Sales record moved to archive." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 3. QUOTATIONS & PROPOSALS
// ============================================================

const createQuote = async (req, res) => {
    const { sbu_id, customer_id, total_amount, valid_until, items, user_id } = req.body;
    try {
        const quote = await prisma.$transaction(async (tx) => {
            const newQuote = await tx.quotes.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    customer_id: parseInt(customer_id),
                    total_amount: parseFloat(total_amount),
                    valid_until: valid_until ? new Date(valid_until) : null,
                    status: 'Draft'
                }
            });
            for (const item of items) {
                await tx.quote_items.create({
                    data: {
                        quote_id: newQuote.id,
                        variant_id: parseInt(item.variant_id),
                        quantity: parseInt(item.quantity),
                        unit_price: parseFloat(item.unit_price),
                        subtotal: parseFloat(item.unit_price) * parseInt(item.quantity)
                    }
                });
            }
            return newQuote;
        });

        await recordAuditLog(user_id, parseInt(sbu_id), 'CREATE_QUOTE', 'Sales', { quote_id: quote.id }, req.ip);

        res.status(201).json({ success: true, message: "Draft quotation registered.", quote });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getQuotes = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const quotes = await prisma.quotes.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            include: { customers: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 4. CONVERSION (Quote to Order with Date & Ledger Sync)
// ============================================================

const convertQuoteToOrder = async (req, res) => {
    const { quote_id, warehouse_id, user_id, sbu_id } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const quote = await tx.quotes.findUnique({
                where: { id: parseInt(quote_id) },
                include: { quote_items: true }
            });

            if (!quote || quote.status === 'Converted') throw new Error("Invalid or already converted quotation.");

            const order = await tx.orders.create({
                data: {
                    sbu_id: quote.sbu_id,
                    customer_id: quote.customer_id,
                    total_amount: quote.total_amount,
                    status: 'Invoiced',
                    order_date: new Date()
                }
            });

            for (const item of quote.quote_items) {
                await tx.order_items.create({
                    data: {
                        order_id: order.id,
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal
                    }
                });

                const stock = await tx.stock_levels.findFirst({
                    where: { variant_id: item.variant_id, warehouse_id: parseInt(warehouse_id || 1) }
                });

                if (!stock || stock.quantity < item.quantity) throw new Error("Insufficient inventory for conversion.");

                await tx.stock_levels.update({
                    where: { id: stock.id },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            await tx.quotes.update({
                where: { id: quote.id },
                data: { status: 'Converted' }
            });

            // Sync Conversion with Ledger
            await postSalesToLedger(tx, quote.sbu_id, parseFloat(quote.total_amount), `Quote Conversion: #INV-${order.id}`, `INV-${order.id}`, user_id);

            return order;
        });

        await recordAuditLog(user_id, parseInt(sbu_id || result.sbu_id), 'CONVERT_QUOTE', 'Sales', { quote_id, order_id: result.id }, req.ip);

        res.json({ success: true, message: "Quotation successfully converted to Sales Invoice.", order: result });
    } catch (error) {
        console.error("CONVERSION_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCustomer, getCustomers, createOrder, getOrders, deleteOrder, createQuote, getQuotes, convertQuoteToOrder
};