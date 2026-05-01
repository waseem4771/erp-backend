
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Pricing & Discount Controller
 * Purpose: Manages unit-specific price books (with Customer Tiers) and promotional coupons.
 * Update: Resolved Unique Constraint conflict by targeting the triple-index (SBU + Variant + Tier). ✅
 */

// ============================================================
// 1. UNIT-SPECIFIC PRICE BOOK MANAGEMENT (With Tiers)
// ============================================================

/**
 * Function: upsertPriceBook
 * Purpose: Creates or updates a custom price for a product SKU based on SBU and Customer Tier.
 */
const upsertPriceBook = async (req, res) => {
    const { sbu_id, variant_id, price, user_id, tier } = req.body;

    const sbuIdInt = parseInt(sbu_id);
    const variantIdInt = parseInt(variant_id);
    const priceFloat = parseFloat(price);
    const targetTier = tier || 'Retail'; // Defaults to Retail if not specified

    // Validation: Ensures all required numerical fields are present
    if (isNaN(sbuIdInt) || isNaN(variantIdInt) || isNaN(priceFloat)) {
        return res.status(400).json({ error: "Invalid input: SBU ID, Variant ID, and Price must be valid numbers." });
    }

    try {
        // EXECUTION: Using the triple-index where clause to allow multi-tier prices per product ✅
        const priceEntry = await prisma.price_books.upsert({
            where: {
                sbu_id_variant_id_tier: {
                    sbu_id: sbuIdInt,
                    variant_id: variantIdInt,
                    tier: targetTier
                }
            },
            update: { 
                price: priceFloat 
            },
            create: {
                sbu_id: sbuIdInt,
                variant_id: variantIdInt,
                price: priceFloat,
                tier: targetTier
            }
        });

        // Authorized Audit Logging
        await recordAuditLog(
            user_id || 1, 
            sbuIdInt, 
            'UPDATE_PRICE_BOOK', 
            'Inventory', 
            { variant_id: variantIdInt, new_price: priceFloat, tier: targetTier }, 
            req.ip
        );

        res.status(200).json({ 
            success: true, 
            message: `Strategic Price updated for ${targetTier} tier in Unit ${sbuIdInt}.`, 
            data: priceEntry 
        });

    } catch (error) {
        console.error("PRICING_UPSERT_ERROR:", error.message);
        
        // Handling the specific database constraint mismatch
        if (error.code === 'P2002') {
            return res.status(500).json({ 
                error: "Database Conflict: A conflicting unique constraint (unique_sbu_variant) exists. Please ensure your schema only enforces the triple-tier index." 
            });
        }
        
        res.status(500).json({ error: "Internal Error: Failed to synchronize price book." });
    }
};

// ============================================================
// 2. PROMOTIONAL COUPON MANAGEMENT
// ============================================================

/**
 * Function: createCoupon
 * Purpose: Registers a new discount promo code for the Strategic Business Unit.
 */
const createCoupon = async (req, res) => {
    const { sbu_id, code, discount_type, discount_value, expiry_date, user_id } = req.body;
    
    try {
        const coupon = await prisma.coupons.create({
            data: {
                sbu_id: parseInt(sbu_id),
                code: code.toUpperCase(),
                discount_type,
                discount_value: parseFloat(discount_value),
                expiry_date: expiry_date ? new Date(expiry_date) : null
            }
        });

        await recordAuditLog(
            user_id || 1, 
            parseInt(sbu_id), 
            'CREATE_COUPON', 
            'Marketing', 
            { coupon_code: code, discount_value: discount_value }, 
            req.ip
        );

        res.status(201).json({ success: true, message: "Promotional coupon authorized successfully.", data: coupon });
    } catch (error) {
        console.error("CREATE_COUPON_ERROR:", error.message);
        res.status(500).json({ error: "Coupon creation failed. Ensure the code is unique for this unit." });
    }
};

/**
 * Function: validateCoupon
 * Purpose: Verifies if a coupon is active and valid for the current unit.
 */
const validateCoupon = async (req, res) => {
    const { sbu_id, code } = req.query;
    try {
        const coupon = await prisma.coupons.findFirst({
            where: {
                sbu_id: parseInt(sbu_id),
                code: code.toUpperCase(),
                is_active: true,
                OR: [
                    { expiry_date: null },
                    { expiry_date: { gte: new Date() } }
                ]
            }
        });

        if (!coupon) {
            return res.status(404).json({ valid: false, error: "Invalid, inactive, or expired coupon." });
        }

        res.json({ 
            valid: true, 
            discount_type: coupon.discount_type, 
            discount_value: parseFloat(coupon.discount_value) 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to validate coupon code." });
    }
};

/**
 * Function: getSbuCoupons
 * Purpose: Retrieves all coupons associated with the active unit.
 */
const getSbuCoupons = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const coupons = await prisma.coupons.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { created_at: 'desc' }
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve the unit coupon registry." });
    }
};

module.exports = { 
    upsertPriceBook, 
    createCoupon, 
    validateCoupon, 
    getSbuCoupons 
};