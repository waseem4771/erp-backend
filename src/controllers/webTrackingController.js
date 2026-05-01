const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * WebTracking Controller
 * Purpose: To capture leads automatically from external websites (WordPress, Shopify, etc.)
 * Integration: Hits from external sites using API Key Authentication
 */

// 1. Function to capture leads from external web forms
const captureWebLead = async (req, res) => {
    // Data coming from external website form
    const { first_name, last_name, email, phone, source_platform, message } = req.body;
    
    // sbu_id is extracted from the API Key Middleware (already implemented in Phase 6)
    const sbu_id = req.sbu_id; 

    if (!first_name || !email) {
        return res.status(400).json({ 
            success: false, 
            error: "Required fields (First Name and Email) are missing." 
        });
    }

    try {
        // Saving the lead into the database
        const newLead = await prisma.leads.create({
            data: {
                sbu_id: parseInt(sbu_id),
                first_name: first_name,
                last_name: last_name || '',
                email: email,
                phone: phone || '',
                // Identifying if it came from WordPress, Social Media, etc.
                source: source_platform || 'Web Tracking', 
                status: 'New',
                lead_score: 10 // Assigning a default starting score
            }
        });

        // Response back to the external website
        res.status(201).json({
            success: true,
            message: "Lead captured successfully in Vimal ERP",
            lead_id: newLead.id
        });

    } catch (error) {
        console.error("WEB_TRACKING_CAPTURE_ERROR:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal ERP error while capturing web lead." 
        });
    }
};

module.exports = { captureWebLead };