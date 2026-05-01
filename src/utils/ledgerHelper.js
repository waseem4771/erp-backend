// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// /**
//  * Ledger Helper Utility (Automated Sync Version)
//  * Purpose: Dynamically resolves SBU specific accounts and posts double-entry records.
//  * Fix: Added 'userId' support to ensure Dashboard Analytics can track active entries. ✅
//  */

// /**
//  * Function: postSalesToLedger
//  * @param {Object} tx - Prisma Transaction Instance
//  * @param {Number} sbuId - The ID of the Strategic Business Unit
//  * @param {Number} amount - Total amount to be recorded
//  * @param {String} description - Transaction memo
//  * @param {String} reference - Reference number (Invoice ID)
//  * @param {Number} userId - The ID of the user performing the action ✅
//  */
// const postSalesToLedger = async (tx, sbuId, amount, description, reference, userId) => {
//     try {
//         // 1. DYNAMIC ACCOUNT RESOLUTION
//         // Finding the unique Cash and Revenue account IDs for this specific unit
//         const cashAccount = await tx.chart_of_accounts.findFirst({
//             where: { sbu_id: sbuId, account_name: 'Cash on Hand' }
//         });

//         const revenueAccount = await tx.chart_of_accounts.findFirst({
//             where: { sbu_id: sbuId, account_name: 'Sales Revenue' }
//         });

//         // Safety Check: Ensure the unit has been properly initialized
//         if (!cashAccount || !revenueAccount) {
//             throw new Error(`Accounting Error: Unit ${sbuId} is missing primary accounts.`);
//         }

//         // 2. CREATE JOURNAL ENTRY
//         // Now including 'created_by' so the Dashboard logic includes this in Revenue totals ✅
//         const journal = await tx.journal_entries.create({
//             data: {
//                 sbu_id: sbuId,
//                 transaction_date: new Date(),
//                 description: description,
//                 reference_no: reference,
//                 created_by: userId ? parseInt(userId) : 1 // Links the transaction to the user
//             }
//         });

//         // 3. POST DOUBLE-ENTRY (Debit Assets, Credit Income)
//         await tx.ledger_entries.createMany({
//             data: [
//                 { 
//                     journal_id: journal.id, 
//                     account_id: cashAccount.id, 
//                     debit: parseFloat(amount), 
//                     credit: 0 
//                 },
//                 { 
//                     journal_id: journal.id, 
//                     account_id: revenueAccount.id, 
//                     debit: 0, 
//                     credit: parseFloat(amount) 
//                 }
//             ]
//         });

//         return true;
//     } catch (error) {
//         console.error("LEDGER_HELPER_SYNC_ERROR:", error.message);
//         throw error; // Forces rollback of the main transaction
//     }
// };

// module.exports = { postSalesToLedger };








const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Ledger Helper Utility (Self-Healing Version) ✅
 * Purpose: Dynamically resolves SBU specific accounts and posts double-entry records.
 * Feature: Automatically creates missing primary accounts if they don't exist.
 */

/**
 * Function: postSalesToLedger
 * @param {Object} tx - Prisma Transaction Instance
 * @param {Number} sbuId - The ID of the Strategic Business Unit
 * @param {Number} amount - Total amount to be recorded
 * @param {String} description - Transaction memo
 * @param {String} reference - Reference number (Invoice ID)
 * @param {Number} userId - The ID of the user performing the action
 */
const postSalesToLedger = async (tx, sbuId, amount, description, reference, userId) => {
    try {
        // 1. DYNAMIC ACCOUNT RESOLUTION WITH AUTO-CREATION (Self-Healing) ✅
        
        // A. Resolve or Create 'Cash on Hand' Account
        let cashAccount = await tx.chart_of_accounts.findFirst({
            where: { sbu_id: sbuId, account_name: 'Cash on Hand' }
        });

        if (!cashAccount) {
            console.log(`[LEDGER_REPAIR] Initializing 'Cash on Hand' for SBU ${sbuId}`);
            cashAccount = await tx.chart_of_accounts.create({
                data: {
                    sbu_id: sbuId,
                    account_code: '1001',
                    account_name: 'Cash on Hand',
                    account_type: 'Asset'
                }
            });
        }

        // B. Resolve or Create 'Sales Revenue' Account
        let revenueAccount = await tx.chart_of_accounts.findFirst({
            where: { sbu_id: sbuId, account_name: 'Sales Revenue' }
        });

        if (!revenueAccount) {
            console.log(`[LEDGER_REPAIR] Initializing 'Sales Revenue' for SBU ${sbuId}`);
            revenueAccount = await tx.chart_of_accounts.create({
                data: {
                    sbu_id: sbuId,
                    account_code: '5001',
                    account_name: 'Sales Revenue',
                    account_type: 'Income'
                }
            });
        }

        // 2. CREATE JOURNAL ENTRY
        const journal = await tx.journal_entries.create({
            data: {
                sbu_id: sbuId,
                transaction_date: new Date(),
                description: description,
                reference_no: reference,
                created_by: userId ? parseInt(userId) : 1
            }
        });

        // 3. POST DOUBLE-ENTRY (Debit Assets, Credit Income)
        await tx.ledger_entries.createMany({
            data: [
                { 
                    journal_id: journal.id, 
                    account_id: cashAccount.id, 
                    debit: parseFloat(amount), 
                    credit: 0 
                },
                { 
                    journal_id: journal.id, 
                    account_id: revenueAccount.id, 
                    debit: 0, 
                    credit: parseFloat(amount) 
                }
            ]
        });

        return true;
    } catch (error) {
        console.error("LEDGER_HELPER_SYNC_ERROR:", error.message);
        throw error; // Forces rollback of the main transaction to maintain data integrity
    }
};

module.exports = { postSalesToLedger };