const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Currency Controller
 * Purpose: Manages international exchange rates for multi-currency consolidation.
 * Features: Fetching, updating, and registering new currency pairs.
 * Update: Integrated SBU-context audit logging for compliance tracking. ✅
 */

// ============================================================
// 1. FETCH ALL EXCHANGE RATES
// ============================================================
const getAllRates = async (req, res) => {
    try {
        const rates = await prisma.currency_rates.findMany({
            orderBy: { from_currency: 'asc' }
        });
        res.json(rates);
    } catch (error) {
        console.error("FETCH_RATES_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve global exchange rates." });
    }
};

// ============================================================
// 2. UPDATE EXISTING CURRENCY RATE
// ============================================================
const updateCurrencyRate = async (req, res) => {
    const { id, exchange_rate, user_id, sbu_id } = req.body;

    if (!id || !exchange_rate) {
        return res.status(400).json({ error: "Rate ID and new exchange rate are mandatory." });
    }

    try {
        const updated = await prisma.currency_rates.update({
            where: { id: parseInt(id) },
            data: { 
                exchange_rate: parseFloat(exchange_rate),
                last_updated: new Date() 
            }
        });

        // FIXED: Re-aligned arguments for recordAuditLog (userId, sbuId, action, module...) ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id || 1), 
            'UPDATE_EXCHANGE_RATE', 
            'Settings', 
            { currency: updated.from_currency, new_rate: exchange_rate }, 
            req.ip
        );

        res.json({ success: true, message: "Exchange rate updated successfully.", data: updated });
    } catch (error) {
        console.error("RATE_UPDATE_ERROR:", error.message);
        res.status(500).json({ error: "Failed to modify exchange rate in the database." });
    }
};

// ============================================================
// 3. REGISTER NEW CURRENCY PAIR
// ============================================================
const addCurrency = async (req, res) => {
    const { from_currency, to_currency, exchange_rate, user_id, sbu_id } = req.body;
    
    if (!from_currency || !exchange_rate) {
        return res.status(400).json({ error: "Currency code and rate are required." });
    }

    try {
        const nayaRate = await prisma.currency_rates.create({
            data: {
                from_currency: from_currency.toUpperCase(),
                to_currency: to_currency || 'USD',
                exchange_rate: parseFloat(exchange_rate)
            }
        });

        // FIXED: Re-aligned arguments for recordAuditLog ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id || 1), 
            'ADD_NEW_CURRENCY', 
            'Settings', 
            { code: from_currency, rate: exchange_rate }, 
            req.ip
        );

        res.status(201).json({ success: true, message: "New currency pair initialized.", data: nayaRate });
    } catch (error) {
        console.error("ADD_CURRENCY_ERROR:", error.message);
        res.status(500).json({ error: "Failed to add currency. Ensure the code is unique." });
    }
};

module.exports = { getAllRates, updateCurrencyRate, addCurrency };