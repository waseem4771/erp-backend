

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Fixed Assets Controller
 * Purpose: Manages company assets, tracking purchase costs, and automated depreciation.
 * Features: Straight-line depreciation calculation and soft-delete for audit safety.
 */

// ============================================================
// 1. REGISTER NEW FIXED ASSET
// ============================================================
/**
 * Function: createAsset
 * Purpose: Records a new asset in the system for a specific SBU.
 */
const createAsset = async (req, res) => {
    const { 
        sbu_id, 
        asset_name, 
        asset_type, 
        purchase_date, 
        purchase_price, 
        salvage_value, 
        useful_life, 
        user_id 
    } = req.body;

    try {
        const asset = await prisma.fixed_assets.create({
            data: {
                sbu_id: parseInt(sbu_id),
                asset_name,
                asset_type,
                purchase_date: new Date(purchase_date),
                purchase_price: parseFloat(purchase_price),
                salvage_value: parseFloat(salvage_value || 0),
                useful_life: parseInt(useful_life),
                status: 'Active'
            }
        });

        // Logging the creation action for internal security auditing
        await recordAuditLog(
            user_id || null, 
            'CREATE_ASSET', 
            'Inventory', 
            { asset_id: asset.id, name: asset_name, cost: purchase_price }, 
            req.ip
        );

        res.status(201).json({ 
            success: true,
            message: "Fixed asset recorded and synchronized successfully.", 
            data: asset 
        });

    } catch (error) {
        console.error("CREATE_ASSET_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to register fixed asset in the ledger." });
    }
};

// ============================================================
// 2. ASSET REGISTRY & DEPRECIATION ANALYSIS
// ============================================================
/**
 * Function: getAssets
 * Purpose: Retrieves assets for an SBU and calculates real-time "Book Value".
 * Formula: Straight-Line Depreciation Method.
 */
const getAssets = async (req, res) => {
    const { sbu_id } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is required to fetch unit assets." });
    }

    try {
        // Fetch only active assets that have not been soft-deleted
        const assets = await prisma.fixed_assets.findMany({
            where: { 
                sbu_id: parseInt(sbu_id),
                deleted_at: null 
            }
        });

        const today = new Date();

        // Processing each asset to calculate current financial value
        const processedAssets = assets.map(asset => {
            const purchaseDate = new Date(asset.purchase_date);
            // Calculate total years passed since purchase
            const yearsPassed = (today - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25);
            
            // Straight-line formula: (Cost - Salvage) / Useful Life
            const annualDepreciation = (parseFloat(asset.purchase_price) - parseFloat(asset.salvage_value)) / asset.useful_life;
            
            // Ensure depreciation doesn't exceed the depreciable cost
            const totalDepreciation = Math.min(
                annualDepreciation * yearsPassed, 
                parseFloat(asset.purchase_price) - parseFloat(asset.salvage_value)
            );

            const currentValue = parseFloat(asset.purchase_price) - totalDepreciation;

            return {
                ...asset,
                annual_depreciation: annualDepreciation.toFixed(2),
                total_depreciation: totalDepreciation.toFixed(2),
                current_value: currentValue.toFixed(2)
            };
        });

        res.json(processedAssets);

    } catch (error) {
        console.error("FETCH_ASSETS_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve asset registry." });
    }
};

// ============================================================
// 3. ASSET LIFECYCLE MANAGEMENT (SOFT DELETE)
// ============================================================
/**
 * Function: deleteAsset
 * Purpose: Archives an asset to maintain historical financial records.
 */
const deleteAsset = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body || {}; 

    try {
        // We perform a soft delete to ensure audit trails remain intact
        await prisma.fixed_assets.update({ 
            where: { id: parseInt(id) },
            data: { 
                deleted_at: new Date(),
                status: 'Disposed' // Updating operational status
            } 
        });

        // Recording the disposal action in the security logs
        await recordAuditLog(
            user_id || null, 
            'SOFT_DELETE_ASSET', 
            'Inventory', 
            { asset_id: id }, 
            req.ip
        );

        res.json({ 
            success: true,
            message: "Asset has been successfully moved to the archive (Soft Deleted)." 
        });

    } catch (error) {
        console.error("DELETE_ASSET_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to archive the asset record." });
    }
};

// ============================================================
// 4. POST MONTHLY DEPRECIATION TO LEDGER (NEW ✅)
// ============================================================
/**
 * Function: postMonthlyDepreciation
 * Purpose: Calculates and records monthly depreciation as a Journal Entry.
 */
const postMonthlyDepreciation = async (req, res) => {
    const { sbu_id, user_id } = req.body;

    try {
        const today = new Date();
        const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const referenceNo = `DEPR-${today.getFullYear()}-${today.getMonth() + 1}`;

        // 1. Duplicate Check: Kya is mahine ki entry pehle se hai?
        const existingEntry = await prisma.journal_entries.findFirst({
            where: { sbu_id: parseInt(sbu_id), reference_no: referenceNo }
        });

        if (existingEntry) {
            return res.status(400).json({ error: `Depreciation for ${monthName} has already been posted.` });
        }

        // 2. Fetch all active assets for this SBU
        const assets = await prisma.fixed_assets.findMany({
            where: { sbu_id: parseInt(sbu_id), deleted_at: null }
        });

        if (assets.length === 0) {
            return res.status(404).json({ error: "No active assets found to depreciate." });
        }

        // 3. Calculate Total Monthly Depreciation
        let totalMonthlyDepr = 0;
        assets.forEach(asset => {
            const annual = (parseFloat(asset.purchase_price) - parseFloat(asset.salvage_value)) / asset.useful_life;
            totalMonthlyDepr += (annual / 12);
        });

        // 4. Find Required Accounts
        const expenseAcc = await prisma.chart_of_accounts.findFirst({
            where: { sbu_id: parseInt(sbu_id), account_name: { contains: 'Depreciation Expense' } }
        });

        const accumulatedAcc = await prisma.chart_of_accounts.findFirst({
            where: { sbu_id: parseInt(sbu_id), account_name: { contains: 'Accumulated Depreciation' } }
        });

        if (!expenseAcc || !accumulatedAcc) {
            return res.status(400).json({ error: "Accounting Error: Required Depreciation accounts not found in CoA." });
        }

        // 5. Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            const journal = await tx.journal_entries.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    transaction_date: today,
                    description: `Monthly Depreciation Posting - ${monthName}`,
                    reference_no: referenceNo,
                    created_by: parseInt(user_id)
                }
            });

            await tx.ledger_entries.createMany({
                data: [
                    { journal_id: journal.id, account_id: expenseAcc.id, debit: totalMonthlyDepr, credit: 0 },
                    { journal_id: journal.id, account_id: accumulatedAcc.id, debit: 0, credit: totalMonthlyDepr }
                ]
            });

            return journal;
        });

        await recordAuditLog(user_id, 'POST_DEPRECIATION', 'Finance', { amount: totalMonthlyDepr.toFixed(2), period: monthName }, req.ip);

        res.status(201).json({ 
            success: true, 
            message: `Success: $${totalMonthlyDepr.toFixed(2)} depreciation posted for ${monthName}.`,
            data: result 
        });

    } catch (error) {
        console.error("DEPR_POST_ERROR:", error.message);
        res.status(500).json({ error: "Internal error during depreciation posting." });
    }
};

module.exports = { 
    createAsset, 
    getAssets, 
    deleteAsset, 
    postMonthlyDepreciation // Added to exports ✅
};