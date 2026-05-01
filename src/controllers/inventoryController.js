

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Inventory Controller - EXECUTIVE MASTER EDITION
 * Purpose: Handles Products, Warehouses, Procurement, and Stock Movements.
 * Update: Optimized getAllVariants to support multi-tier price mapping. ✅
 */

// ============================================================
// 1. PRODUCT & VARIANT MANAGEMENT
// ============================================================

const createProduct = async (req, res) => {
    const { sbu_id, name, description, category, product_type, base_price, variants, user_id } = req.body;

    if (!sbu_id) return res.status(400).json({ error: "sbu_id is required" });

    try {
        const newProduct = await prisma.$transaction(async (tx) => {
            const product = await tx.products.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    name,
                    description,
                    category,
                    product_type,
                    base_price: parseFloat(base_price),
                }
            });

            let defaultWarehouse = await tx.warehouses.findFirst({
                where: { sbu_id: parseInt(sbu_id), is_main: true }
            });

            if (!defaultWarehouse) {
                defaultWarehouse = await tx.warehouses.findFirst({
                    where: { sbu_id: parseInt(sbu_id) }
                });
            }

            if (variants && variants.length > 0) {
                for (const v of variants) {
                    const newVariant = await tx.product_variants.create({
                        data: {
                            product_id: product.id,
                            sku: v.sku,
                            variant_name: v.variant_name,
                            additional_price: parseFloat(v.additional_price) || 0,
                        }
                    });

                    if (defaultWarehouse) {
                        await tx.stock_levels.create({
                            data: {
                                variant_id: newVariant.id,
                                warehouse_id: defaultWarehouse.id,
                                quantity: 0,
                                safety_stock: 10
                            }
                        });
                    }
                }
            }
            return product;
        });

        await recordAuditLog(user_id, parseInt(sbu_id), 'CREATE_PRODUCT', 'Inventory', { product_id: newProduct.id, name }, req.ip);

        res.status(201).json({ message: "Product initialized successfully!", data: newProduct });
    } catch (error) {
        console.error("CREATE_PRODUCT_ERROR:", error.message);
        res.status(500).json({ error: "Failed to create product." });
    }
};

const getProducts = async (req, res) => {
    const { sbu_id } = req.query; 
    try {
        const products = await prisma.products.findMany({
            where: { 
                sbu_id: parseInt(sbu_id),
                deleted_at: null 
            },
            include: { product_variants: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 2. WAREHOUSE & SITE MANAGEMENT
// ============================================================

const createWarehouse = async (req, res) => {
    const { sbu_id, name, location, is_main, user_id } = req.body;
    try {
        const warehouse = await prisma.warehouses.create({
            data: { 
                sbu_id: parseInt(sbu_id), 
                name, 
                location, 
                is_main: is_main === true || is_main === "true" 
            }
        });
        await recordAuditLog(user_id, parseInt(sbu_id), 'CREATE_WAREHOUSE', 'Inventory', { name, location }, req.ip);
        res.status(201).json(warehouse);
    } catch (error) {
        console.error("CREATE_WAREHOUSE_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const getWarehouses = async (req, res) => {
    const { sbu_id } = req.query;
    if (!sbu_id || sbu_id === "undefined") {
        return res.status(400).json({ error: "Strategic Unit ID (sbu_id) is missing." });
    }
    try {
        const list = await prisma.warehouses.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { name: 'asc' }
        });
        res.json(list);
    } catch (error) {
        console.error("DATABASE_ERROR in getWarehouses:", error);
        res.status(500).json({ error: "Failed to fetch unit warehouses." });
    }
};

// ============================================================
// 3. PROCUREMENT & STOCK INTELLIGENCE
// ============================================================

const getStockReport = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const stock = await prisma.stock_levels.findMany({
            where: { warehouses: { sbu_id: parseInt(sbu_id) } },
            include: {
                product_variants: { include: { products: true } },
                warehouses: true
            }
        });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPurchaseOrder = async (req, res) => {
    const { sbu_id, supplier_id, total_amount, created_by, order_date } = req.body;
    try {
        const po = await prisma.purchase_orders.create({
            data: {
                sbu_id: parseInt(sbu_id),
                supplier_id: parseInt(supplier_id),
                total_amount: parseFloat(total_amount),
                created_by: parseInt(created_by),
                order_date: new Date(order_date),
                status: 'Pending'
            }
        });
        res.status(201).json({ message: "PO Created successfully!", data: po });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPurchaseOrders = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const orders = await prisma.purchase_orders.findMany({
            where: { sbu_id: parseInt(sbu_id), deleted_at: null },
            include: { suppliers: true },
            orderBy: { order_date: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const receivePurchaseOrder = async (req, res) => {
    const { po_id, variant_id, warehouse_id, quantity, user_id, sbu_id } = req.body;
    try {
        await prisma.$transaction(async (tx) => {
            await tx.purchase_orders.update({ 
                where: { id: parseInt(po_id) }, 
                data: { status: 'Received' } 
            });
            
            const existingStock = await tx.stock_levels.findFirst({ 
                where: { variant_id: parseInt(variant_id), warehouse_id: parseInt(warehouse_id) } 
            });

            if (existingStock) {
                await tx.stock_levels.update({ 
                    where: { id: existingStock.id }, 
                    data: { quantity: { increment: parseInt(quantity) } } 
                });
            } else {
                await tx.stock_levels.create({ 
                    data: { variant_id: parseInt(variant_id), warehouse_id: parseInt(warehouse_id), quantity: parseInt(quantity) } 
                });
            }
        });
        
        await recordAuditLog(user_id, parseInt(sbu_id || 1), 'RECEIVE_STOCK', 'Inventory', { po_id, quantity }, req.ip);
        res.json({ message: "PO Received and Stock Updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================================
// 4. STOCK ADJUSTMENTS
// ============================================================

const adjustStock = async (req, res) => {
    const { sbu_id, variant_id, warehouse_id, quantity, adjustment_type, reason, user_id } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const adjustment = await tx.stock_adjustments.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    variant_id: parseInt(variant_id),
                    warehouse_id: parseInt(warehouse_id),
                    quantity: parseInt(quantity),
                    adjustment_type,
                    reason
                }
            });

            const stock = await tx.stock_levels.findFirst({
                where: { variant_id: parseInt(variant_id), warehouse_id: parseInt(warehouse_id) }
            });

            if (!stock || stock.quantity < quantity) {
                throw new Error("Insufficient stock to perform adjustment");
            }

            await tx.stock_levels.update({
                where: { id: stock.id },
                data: { quantity: { decrement: parseInt(quantity) } }
            });

            return adjustment;
        });

        await recordAuditLog(user_id, parseInt(sbu_id), `STOCK_ADJUST_${adjustment_type.toUpperCase()}`, 'Inventory', { variant_id, quantity, reason }, req.ip);
        res.status(201).json({ message: "Stock adjustment recorded successfully!", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================
// 5. STOCK TRANSFER
// ============================================================

const transferStock = async (req, res) => {
    const { sbu_id, from_warehouse_id, to_warehouse_id, variant_id, quantity, user_id } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const sourceStock = await tx.stock_levels.findFirst({
                where: { variant_id: parseInt(variant_id), warehouse_id: parseInt(from_warehouse_id) }
            });

            if (!sourceStock || sourceStock.quantity < parseInt(quantity)) {
                throw new Error("Insufficient stock in the source warehouse.");
            }

            await tx.stock_levels.update({
                where: { id: sourceStock.id },
                data: { quantity: { decrement: parseInt(quantity) } }
            });

            const targetStock = await tx.stock_levels.findFirst({
                where: { variant_id: parseInt(variant_id), warehouse_id: parseInt(to_warehouse_id) }
            });

            if (targetStock) {
                await tx.stock_levels.update({
                    where: { id: targetStock.id },
                    data: { quantity: { increment: parseInt(quantity) } }
                });
            } else {
                await tx.stock_levels.create({
                    data: {
                        variant_id: parseInt(variant_id),
                        warehouse_id: parseInt(to_warehouse_id),
                        quantity: parseInt(quantity)
                    }
                });
            }

            const transferLog = await tx.stock_transfers.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    from_warehouse_id: parseInt(from_warehouse_id),
                    to_warehouse_id: parseInt(to_warehouse_id),
                    variant_id: parseInt(variant_id),
                    quantity: parseInt(quantity),
                    status: 'Completed'
                }
            });

            return transferLog;
        });

        await recordAuditLog(user_id, parseInt(sbu_id), 'STOCK_TRANSFER', 'Inventory', { variant_id, quantity, from: from_warehouse_id, to: to_warehouse_id }, req.ip);
        res.status(201).json({ success: true, message: "Stock transfer completed successfully.", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ============================================================
// 6. UTILITY & DROPDOWNS (SMART TIER PRICING LOGIC ✅)
// ============================================================

const getAllVariants = async (req, res) => {
    const { sbu_id } = req.query;
    if (!sbu_id) return res.status(400).json({ error: "sbu_id is required" });

    try {
        // Fetch variants with all associated price books for this unit
        const variants = await prisma.product_variants.findMany({
            where: { products: { sbu_id: parseInt(sbu_id) } },
            include: { 
                products: true, 
                stock_levels: { where: { warehouses: { sbu_id: parseInt(sbu_id) } } },
                price_books: { where: { sbu_id: parseInt(sbu_id) } }
            }
        });

        const variantsWithSmartPrices = variants.map(v => {
            // Mapping all defined tier prices into a single object ✅
            const tierPrices = {};
            v.price_books.forEach(pb => {
                tierPrices[pb.tier] = parseFloat(pb.price);
            });

            // Calculate base price (Catalog Price + Variant Addon)
            const baseCatalogPrice = parseFloat(v.products.base_price) + parseFloat(v.additional_price || 0);

            return {
                ...v,
                base_selling_price: baseCatalogPrice,
                tier_prices: tierPrices, // Dynamic Map: { Retail: 99, Wholesale: 80, VIP: 70 }
                // Fallback for UI components expecting a single field
                selling_price: tierPrices['Retail'] || baseCatalogPrice 
            };
        });

        res.json(variantsWithSmartPrices);
    } catch (error) {
        console.error("GET_VARIANTS_ERROR:", error.message);
        res.status(500).json({ error: "Failed to fetch smart pricing variants." });
    }
};

module.exports = {
    createProduct, getProducts, createWarehouse, getWarehouses, getStockReport,
    createPurchaseOrder, getPurchaseOrders, receivePurchaseOrder, 
    adjustStock, getAllVariants, transferStock
};