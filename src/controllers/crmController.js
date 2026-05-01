const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');
const nodemailer = require('nodemailer');

/**
 * CRM & Marketing Controller
 * Purpose: Manages potential customer leads and marketing campaign expenditures.
 * Integration: Standard SMTP Sandbox Integration for unrestricted testing. ✅
 */

// ============================================================
// 0. SMTP CONFIGURATION (Mailtrap Sandbox Mode)
// ============================================================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ============================================================
// 1. LEAD MANAGEMENT (POTENTIAL CUSTOMERS)
// ============================================================

/**
 * Function: createLead
 * Purpose: Manages manual entry of new business leads into the CRM.
 */
const createLead = async (req, res) => {
    const { 
        sbu_id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        source, 
        lead_score, 
        user_id 
    } = req.body;

    try {
        const lead = await prisma.leads.create({
            data: {
                sbu_id: parseInt(sbu_id),
                first_name: first_name,
                last_name: last_name || '',
                email: email,
                phone: phone || '',
                source: source || 'Internal Registry',
                lead_score: parseInt(lead_score || 0),
                status: 'New'
            }
        });

        await recordAuditLog(
            user_id, 
            parseInt(sbu_id),
            'CREATE_LEAD', 
            'Marketing', 
            { lead_id: lead.id, email: email, source: source }, 
            req.ip
        );

        res.status(201).json({ 
            success: true,
            message: "Inbound lead captured and synchronized successfully.", 
            data: lead 
        });

    } catch (error) {
        console.error("CREATE_LEAD_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to record the new business lead." });
    }
};

/**
 * Function: getLeads
 * Purpose: Retrieves all leads associated with the active SBU.
 */
const getLeads = async (req, res) => {
    const { sbu_id } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is required to fetch unit leads." });
    }

    try {
        const leads = await prisma.leads.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { 
                lead_score: 'desc' 
            } 
        });
        
        res.json(leads);
    } catch (error) {
        console.error("FETCH_LEADS_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve the CRM lead registry." });
    }
};

/**
 * Function: updateLeadScore
 * Purpose: Adjusts the priority score of an existing lead.
 */
const updateLeadScore = async (req, res) => {
    const { id, new_score, user_id, sbu_id } = req.body;

    try {
        const updatedLead = await prisma.leads.update({
            where: { id: parseInt(id) },
            data: { lead_score: parseInt(new_score) }
        });

        await recordAuditLog(
            user_id, 
            parseInt(sbu_id || updatedLead.sbu_id),
            'UPDATE_LEAD_SCORE', 
            'Marketing', 
            { lead_id: id, updated_score: new_score }, 
            req.ip
        );

        res.json({ 
            success: true,
            message: "Lead priority level updated successfully.", 
            data: updatedLead 
        });

    } catch (error) {
        console.error("LEAD_SCORE_UPDATE_ERROR:", error.message);
        res.status(500).json({ error: "Failed to update lead priority." });
    }
};

// ============================================================
// 2. MARKETING CAMPAIGN MANAGEMENT (Sandbox Ready ✅)
// ============================================================

/**
 * Function: createCampaign
 * Purpose: Registers a campaign and triggers SMTP emails to all leads for testing.
 */
const createCampaign = async (req, res) => {
    const { 
        sbu_id, 
        campaign_name, 
        campaign_type, 
        budget, 
        start_date, 
        end_date, 
        user_id 
    } = req.body;

    try {
        // A. Campaign Record Save
        const campaign = await prisma.marketing_campaigns.create({
            data: {
                sbu_id: parseInt(sbu_id),
                campaign_name: campaign_name,
                campaign_type: campaign_type,
                budget: parseFloat(budget || 0),
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                status: 'Active'
            }
        });

        // B. UNRESTRICTED EMAIL OUTREACH (Sandbox Mode) ✅
        if (campaign_type === 'Email') {
            const leads = await prisma.leads.findMany({
                where: { sbu_id: parseInt(sbu_id) }
            });

            if (leads.length > 0) {
                // Har lead ko email bhej rahe hain (Mailtrap Inbox mein pakhri jayengi)
                for (const lead of leads) {
                    try {
                        await transporter.sendMail({
                            from: process.env.SMTP_FROM || '"Vimal ERP" <noreply@vimal-erp.com>',
                            to: lead.email,
                            subject: `Marketing Alert: ${campaign_name}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; padding: 30px; border-radius: 0px;">
                                    <h2 style="color: #0f172a; text-transform: uppercase;">Hello ${lead.first_name},</h2>
                                    <p style="font-size: 16px; color: #334155;">
                                        This is an official update regarding our new initiative: <strong>${campaign_name}</strong>.
                                    </p>
                                    <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
                                        Strategic Unit ${sbu_id} is now live with enhanced features. Stay tuned!
                                    </p>
                                    <br />
                                    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb;">
                                        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #1e293b;">
                                            VIMAL ERP v3.1 - Strategic Intelligence Outreach
                                        </p>
                                    </div>
                                </div>
                            `
                        });
                    } catch (emailErr) {
                        console.error(`SANDBOX_SEND_ERROR to ${lead.email}:`, emailErr.message);
                    }
                }
            }
        }

        await recordAuditLog(
            user_id, 
            parseInt(sbu_id),
            'CREATE_CAMPAIGN', 
            'Marketing', 
            { campaign_id: campaign.id, name: campaign_name, type: campaign_type, outreach: "Sandbox Sync" }, 
            req.ip
        );

        res.status(201).json({
            success: true,
            message: campaign_type === 'Email' 
                ? "Success: Campaign launched and test emails captured in Sandbox." 
                : "Success: Marketing campaign initiated successfully.",
            data: campaign
        });

    } catch (error) {
        console.error("CREATE_CAMPAIGN_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to launch the marketing campaign." });
    }
};

/**
 * Function: getCampaigns
 * Purpose: Pulls the list of active/historical campaigns for an SBU.
 */
const getCampaigns = async (req, res) => {
    const { sbu_id } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is required to fetch unit campaigns." });
    }

    try {
        const campaigns = await prisma.marketing_campaigns.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            orderBy: { created_at: 'desc' }
        });

        res.json(campaigns);
    } catch (error) {
        console.error("FETCH_CAMPAIGNS_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve the marketing campaign registry." });
    }
};

module.exports = { 
    createLead, 
    getLeads, 
    updateLeadScore, 
    createCampaign, 
    getCampaigns 
};