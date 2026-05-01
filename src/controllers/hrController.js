

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recordAuditLog } = require('../utils/auditHelper');

/**
 * HR Controller
 * Purpose: Manages Departments, Employee Directory, and Automated Payroll.
 * Update: Fixed Foreign Key Violation in Salary Payment logic. ✅
 */

// ==========================================
// 1. DEPARTMENT MANAGEMENT
// ==========================================

const createDepartment = async (req, res) => {
    const { sbu_id, dept_name, user_id } = req.body;
    try {
        const dept = await prisma.departments.create({
            data: { 
                sbu_id: parseInt(sbu_id), 
                dept_name 
            }
        });

        await recordAuditLog(user_id, 'CREATE_DEPARTMENT', 'HR', { dept_id: dept.id, name: dept_name, sbu_id }, req.ip);

        res.status(201).json(dept);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDepartments = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const depts = await prisma.departments.findMany({
            where: { sbu_id: parseInt(sbu_id) }
        });
        res.json(depts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteDepartment = async (req, res) => {
    const { id } = req.params;
    const { user_id, sbu_id } = req.body;
    try {
        const staffCount = await prisma.employees.count({
            where: { dept_id: parseInt(id), deleted_at: null }
        });

        if (staffCount > 0) {
            return res.status(400).json({ error: "Action Denied: Cannot revoke department with active staff members." });
        }

        await prisma.departments.delete({
            where: { id: parseInt(id) }
        });

        await recordAuditLog(user_id, 'REVOKE_DEPARTMENT', 'HR', { dept_id: id, sbu_id }, req.ip);

        res.json({ success: true, message: "Department designation revoked successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal Error: Could not revoke department." });
    }
};

// ==========================================
// 2. EMPLOYEE MANAGEMENT
// ==========================================

const createEmployee = async (req, res) => {
    const { sbu_id, dept_id, full_name, designation, joining_date, base_salary, user_id } = req.body;
    try {
        const emp = await prisma.employees.create({
            data: {
                sbu_id: parseInt(sbu_id),
                dept_id: parseInt(dept_id),
                full_name,
                designation,
                joining_date: new Date(joining_date),
                base_salary: parseFloat(base_salary),
                status: 'Active' 
            }
        });

        await recordAuditLog(user_id, 'CREATE_EMPLOYEE', 'HR', { emp_id: emp.id, name: full_name, sbu_id }, req.ip);

        res.status(201).json(emp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getEmployees = async (req, res) => {
    const { sbu_id } = req.query;
    try {
        const emps = await prisma.employees.findMany({
            where: { 
                sbu_id: parseInt(sbu_id),
                deleted_at: null 
            },
            include: { 
                departments: true 
            }
        });
        res.json(emps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    const { user_id, sbu_id } = req.body;
    try {
        await prisma.employees.update({
            where: { id: parseInt(id) },
            data: { deleted_at: new Date(), status: 'Terminated' }
        });

        await recordAuditLog(user_id, 'SOFT_DELETE_EMPLOYEE', 'HR', { emp_id: id, sbu_id }, req.ip);

        res.json({ message: "Employee record archived (Soft Deleted)." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. PAYROLL LOGIC (Generation & Payment)
// ==========================================

const generateMonthlyPayroll = async (req, res) => {
    const { sbu_id, month, year, user_id } = req.body;
    
    if (!sbu_id || !month || !year) {
        return res.status(400).json({ error: "SBU ID, Month, and Year are required." });
    }

    try {
        const existingPayroll = await prisma.payroll_registers.findFirst({
            where: {
                employees: { sbu_id: parseInt(sbu_id) },
                month: parseInt(month),
                year: parseInt(year)
            }
        });

        if (existingPayroll) {
            return res.status(400).json({ error: `Action Denied: Payroll for ${month}/${year} already exists.` });
        }

        const activeEmployees = await prisma.employees.findMany({
            where: { 
                sbu_id: parseInt(sbu_id), 
                status: 'Active',
                deleted_at: null 
            }
        });

        if (activeEmployees.length === 0) {
            return res.status(404).json({ error: "No active employees detected." });
        }

        const payrollEntries = await prisma.$transaction(
            activeEmployees.map(emp => prisma.payroll_registers.create({
                data: {
                    employee_id: emp.id,
                    month: parseInt(month),
                    year: parseInt(year),
                    gross_salary: emp.base_salary,
                    net_salary: emp.base_salary,
                    payment_status: 'Pending'
                }
            }))
        );

        await recordAuditLog(user_id, 'GENERATE_PAYROLL', 'HR', { month, year, count: payrollEntries.length, sbu_id }, req.ip);

        res.status(201).json({ message: "Payroll successfully generated.", count: payrollEntries.length });

    } catch (error) {
        res.status(500).json({ error: "Internal System Error during payroll execution." });
    }
};

/**
 * Function: markSalaryAsPaid (FIXED ✅)
 * Purpose: Resolves Account IDs dynamically to prevent Foreign Key crashes.
 */
const markSalaryAsPaid = async (req, res) => {
    const { payroll_id, sbu_id, user_id, payment_account_id } = req.body;

    try {
        const payrollRecord = await prisma.payroll_registers.findUnique({
            where: { id: parseInt(payroll_id) },
            include: { employees: true }
        });

        if (!payrollRecord || payrollRecord.payment_status === 'Paid') {
            return res.status(400).json({ error: "Invalid record or salary already disbursed." });
        }

        const amount = parseFloat(payrollRecord.net_salary);

        // 1. Find Expense Account (Dynamic search by name)
        const expenseAcc = await prisma.chart_of_accounts.findFirst({
            where: { sbu_id: parseInt(sbu_id), account_name: { contains: 'Salary' } }
        });

        // 2. Find Payment Account (Cash or provided ID)
        const paymentAcc = await prisma.chart_of_accounts.findFirst({
            where: { 
                OR: [
                    { id: parseInt(payment_account_id || 0) },
                    { sbu_id: parseInt(sbu_id), account_name: { contains: 'Cash' } }
                ]
            }
        });

        if (!expenseAcc || !paymentAcc) {
            return res.status(400).json({ 
                error: `Accounting Error: Required accounts (Salary Expense/Cash) not found for Unit ${sbu_id}.` 
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // A. Update Status
            const updatedPayroll = await tx.payroll_registers.update({
                where: { id: parseInt(payroll_id) },
                data: { payment_status: 'Paid', paid_at: new Date() }
            });

            // B. Create Journal
            const journal = await tx.journal_entries.create({
                data: {
                    sbu_id: parseInt(sbu_id),
                    transaction_date: new Date(),
                    description: `Salary: ${payrollRecord.employees.full_name} (${payrollRecord.month}/${payrollRecord.year})`,
                    reference_no: `PAY-${payrollRecord.id}`,
                    created_by: parseInt(user_id)
                }
            });

            // C. Double Entry
            await tx.ledger_entries.createMany({
                data: [
                    { journal_id: journal.id, account_id: expenseAcc.id, debit: amount, credit: 0 },
                    { journal_id: journal.id, account_id: paymentAcc.id, debit: 0, credit: amount }
                ]
            });

            return updatedPayroll;
        });

        await recordAuditLog(user_id, 'PAY_SALARY', 'HR', { payroll_id, amount, sbu_id }, req.ip);

        res.status(200).json({ success: true, message: "Salary paid and ledger synchronized.", data: result });

    } catch (error) {
        console.error("PAY_SALARY_ERROR:", error.message);
        res.status(500).json({ error: "Audit Error: Database constraint violated. Check Chart of Accounts." });
    }
};

const getPayrollHistory = async (req, res) => {
    const { sbu_id, month, year } = req.query;
    try {
        const payroll = await prisma.payroll_registers.findMany({
            where: {
                employees: { sbu_id: parseInt(sbu_id) },
                month: parseInt(month),
                year: parseInt(year)
            },
            include: { 
                employees: { include: { departments: true } } 
            }
        });
        res.json(payroll);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. PERMISSIONS / ACCESS CONTROL
// ==========================================

const getRolePermissions = async (req, res) => {
    const { role_id } = req.query;
    try {
        const perms = await prisma.permissions.findMany({
            where: { role_id: parseInt(role_id) }
        });
        res.json(perms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePermission = async (req, res) => {
    const { role_id, module_name, can_view, can_edit, user_id, sbu_id } = req.body;
    try {
        const existingPermission = await prisma.permissions.findFirst({
            where: { role_id: parseInt(role_id), module_name: module_name }
        });

        let result;
        if (existingPermission) {
            result = await prisma.permissions.update({
                where: { id: existingPermission.id },
                data: { can_view, can_edit }
            });
        } else {
            result = await prisma.permissions.create({
                data: { role_id: parseInt(role_id), module_name, can_view, can_edit }
            });
        }

        await recordAuditLog(user_id, 'UPDATE_PERMISSION', 'Security', { role_id, module: module_name, sbu_id }, req.ip);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createDepartment, 
    getDepartments,
    deleteDepartment,
    createEmployee, 
    getEmployees,
    deleteEmployee, 
    generateMonthlyPayroll,
    markSalaryAsPaid,
    getPayrollHistory,
    getRolePermissions,
    updatePermission
};