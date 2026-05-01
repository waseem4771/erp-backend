
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * API Keys Controller
 * Purpose: Manages secure credentials (Client ID/Secret Key) for external platform integrations.
 * Update: Added Webhook URL support for real-time external site synchronization. ✅
 */

// ============================================================
// 1. GENERATE SECURE API CREDENTIALS (With Webhook Support)
// ============================================================
/**
 * Function: generateApiKey
 * Logic: Creates a unique VML identity and links it with an external Webhook URL.
 */
const generateApiKey = async (req, res) => {
    const { sbu_id, platform_name, webhook_url, user_id } = req.body;

    try {
        // Generating cryptographic secure strings for identity
        const client_id = "VML-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        const secret_key = crypto.randomBytes(24).toString('hex');

        // Creating the record with the newly added webhook_url column ✅
        const newKey = await prisma.api_keys.create({
            data: {
                sbu_id: parseInt(sbu_id),
                client_id,
                secret_key,
                platform_name: platform_name || 'Marketplace',
                webhook_url: webhook_url || null // Capturing the external sync endpoint
            }
        });

        // Audit Logging with Webhook details for security tracking
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'GENERATE_API_KEY', 
            'Settings', 
            { 
                platform: platform_name, 
                client_id: client_id, 
                sync_url: webhook_url || 'No Webhook Assigned' 
            }, 
            req.ip
        );

        res.status(201).json({ 
            success: true, 
            message: "Secure API credentials authorized and generated with Webhook link.", 
            data: newKey 
        });

    } catch (error) {
        console.error("API_KEY_GEN_ERROR:", error.message);
        res.status(500).json({ error: "Failed to generate secure marketplace connection. Ensure database is synced." });
    }
};

// ============================================================
// 2. RETRIEVE ACTIVE KEYS FOR SBU
// ============================================================
/**
 * Function: getSbuKeys
 * Purpose: Pulls the list of authorized external connections for the active unit.
 */
const getSbuKeys = async (req, res) => {
    const { sbu_id } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is mandatory to retrieve unit keys." });
    }

    try {
        const keys = await prisma.api_keys.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { created_at: 'desc' }
        });
        
        res.json(keys);
    } catch (error) {
        console.error("FETCH_KEYS_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve authorized credential registry." });
    }
};

module.exports = { generateApiKey, getSbuKeys };