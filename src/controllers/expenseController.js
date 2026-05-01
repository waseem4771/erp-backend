const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * Expense Controller
 * Purpose: Manages business expenditures and ensures automated double-entry accounting.
 * Features: Multi-part form handling (Multer) for digital receipts and atomic transactions.
 * Update: Integrated SBU-specific audit logging. ✅
 */

// 1. MULTER STORAGE CONFIGURATION (For Invoice/Receipt Uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where files are stored
    },
    filename: (req, file, cb) => {
        // Generates a unique filename using timestamp
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// 2. CREATE EXPENSE AND POST TO LEDGER
/**
 * Function: createExpense
 * Logic: 
 * A. Saves expense details and digital receipt.
 * B. Automatically creates a Journal Entry.
 * C. Posts Double-Entry (Debit Expense Account / Credit Cash or Bank).
 */
const createExpense = async (req, res) => {
    const { sbu_id, account_id, amount, description, expense_date, user_id, payment_account_id } = req.body;
    const file = req.file; 

    try {
        const result = await prisma.$transaction(async (tx) => {
            
            // A. Create master record in the expenses table
            const expense = await tx.expenses.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    account_id: parseInt(account_id),
                    amount: parseFloat(amount),
                    description: description,
                    expense_date: new Date(expense_date),
                    invoice_url: file ? `/uploads/${file.filename}` : null
                }
            });

            // B. Initialize the Journal Entry for this transaction
            const journal = await tx.journal_entries.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    transaction_date: new Date(expense_date),
                    description: `Authorized Expense: ${description}`,
                    reference_no: `EXP-${expense.id}`,
                    created_by: parseInt(user_id)
                }
            });

            // C. Post Double-Entry to the Ledger
            // Debit (+): Expense Account (Selected by user)
            // Credit (-): Asset Account (Cash or Bank)
            await tx.ledger_entries.createMany({
                data: [
                    { 
                        journal_id: journal.id, 
                        account_id: parseInt(account_id), 
                        debit: parseFloat(amount), 
                        credit: 0 
                    },
                    { 
                        journal_id: journal.id, 
                        account_id: parseInt(payment_account_id || 1), 
                        debit: 0, 
                        credit: parseFloat(amount) 
                    }
                ]
            });

            return expense;
        });

        // UPDATED: Logging with Unit ID context for precise auditing ✅
        await recordAuditLog(
            user_id, 
            parseInt(sbu_id), 
            'CREATE_EXPENSE', 
            'Finance', 
            { expense_id: result.id, amount: amount, memo: description }, 
            req.ip
        );

        res.status(201).json({ 
            success: true, 
            message: "Expenditure recorded and ledger synchronized successfully.", 
            data: result 
        });

    } catch (error) {
        console.error("CREATE_EXPENSE_CONTROLLER_ERROR:", error.message);
        res.status(500).json({ error: "Failed to record expense. Verify account availability." });
    }
};

// 3. RETRIEVE UNIT EXPENSE HISTORY
const getExpenses = async (req, res) => {
    const { sbu_id } = req.query;

    if (!sbu_id) {
        return res.status(400).json({ error: "SBU ID is required to fetch unit records." });
    }

    try {
        const list = await prisma.expenses.findMany({
            where: { sbu_id: parseInt(sbu_id) },
            include: { 
                chart_of_accounts: {
                    select: { account_name: true, account_code: true }
                } 
            },
            orderBy: { expense_date: 'desc' }
        });
        
        res.json(list);
    } catch (error) {
        console.error("FETCH_EXPENSES_ERROR:", error.message);
        res.status(500).json({ error: "Failed to retrieve unit expenditure registry." });
    }
};

module.exports = { createExpense, getExpenses, upload };