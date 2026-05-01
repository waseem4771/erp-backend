

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * SBU Management Controller
 * Purpose: Handles the lifecycle of Strategic Business Units (SBUs).
 * Update: Final persistence fix for Profit Share Percentage mapping. ✅
 */

// ============================================================
// 1. REGISTER NEW STRATEGIC BUSINESS UNIT
// ============================================================
/**
 * Function: createSbu
 * Purpose: Registers a new business unit and initializes its financial ledger.
 */
const createSbu = async (req, res) => {
    // 1. Extracting data from validated request body
    const { 
        sbu_name, 
        sbu_type, 
        currency, 
        location, 
        profit_share_percentage, 
        user_id 
    } = req.body;

    try {
        // Using a Transaction to ensure the SBU and its Accounts are created together
        const result = await prisma.$transaction(async (tx) => {
            
            // 2. Initialize the new Strategic Business Unit record
            const sbu = await tx.sbus.create({
                data: {
                    mother_company_id: 1, 
                    sbu_name: sbu_name,
                    sbu_type: sbu_type, 
                    currency: currency || 'USD',
                    location: location || '',
                    // Ensures the value is stored as a Decimal in MySQL ✅
                    profit_share_percentage: parseFloat(profit_share_percentage) || 0.00
                }
            });

            // 3. AUTOMATED LEDGER SETUP ✅
            // Creating the essential Chart of Accounts for the new SBU automatically.
            await tx.chart_of_accounts.createMany({
                data: [
                    { sbu_id: sbu.id, account_code: '1001', account_name: 'Cash on Hand', account_type: 'Asset' },
                    { sbu_id: sbu.id, account_code: '4001', account_name: 'Mother Company Fund', account_type: 'Equity' },
                    { sbu_id: sbu.id, account_code: '5001', account_name: 'Sales Revenue', account_type: 'Income' },
                    { sbu_id: sbu.id, account_code: '6001', account_name: 'General Expenses', account_type: 'Expense' }
                ]
            });

            return sbu;
        });

        // 4. Record action in System Audit Log
        await recordAuditLog(
            user_id || 1, 
            result.id, 
            'CREATE_SBU', 
            'Settings', 
            { sbu_id: result.id, name: sbu_name, share: profit_share_percentage }, 
            req.ip
        );

        res.status(201).json({
            success: true,
            message: "New Business Unit registered and Financial Ledger initialized successfully.",
            data: result
        });

    } catch (error) {
        console.error("CREATE_SBU_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ 
            error: "Failed to initialize SBU. Ensure the business name is unique." 
        });
    }
};

// ============================================================
// 2. RETRIEVE ALL BUSINESS UNITS
// ============================================================
/**
 * Function: getAllSbus
 * Purpose: Pulls the complete registry of SBUs for the Mother Company view.
 */
const getAllSbus = async (req, res) => {
    try {
        const sbus = await prisma.sbus.findMany({
            include: {
                mother_company: {
                    select: { company_name: true }
                }
            },
            orderBy: { sbu_name: 'asc' }
        });
        
        res.json(sbus);
    } catch (error) {
        console.error("FETCH_SBUS_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve the business unit registry." });
    }
};

module.exports = { createSbu, getAllSbus };