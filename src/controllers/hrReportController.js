const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controller: hrReportController
 * Purpose: Handles specialized HR analytics such as Department-wise salary costs.
 * Language: English comments for Canadian client audit readiness.
 */

// 1. Function to calculate payroll cost distribution by department
const getPayrollCostByDepartment = async (req, res) => {
    const { sbu_id, month, year } = req.query;

    // Basic validation to ensure required filters are present
    if (!sbu_id || !month || !year) {
        return res.status(400).json({ 
            error: "Missing parameters. SBU ID, Month, and Year are required." 
        });
    }

    try {
        // Fetch all payroll records for the given period
        // Including employee and department relations to get the department names
        const payrollData = await prisma.payroll_registers.findMany({
            where: {
                month: parseInt(month),
                year: parseInt(year),
                employees: {
                    sbu_id: parseInt(sbu_id)
                }
            },
            include: {
                employees: {
                    include: {
                        departments: true
                    }
                }
            }
        });

        // Logic: Aggregate costs by department name
        const costMapping = {};

        payrollData.forEach(item => {
            const deptName = item.employees?.departments?.dept_name || "Unassigned";
            const netSalary = parseFloat(item.net_salary || 0);

            if (!costMapping[deptName]) {
                costMapping[deptName] = 0;
            }
            costMapping[deptName] += netSalary;
        });

        // Converting the mapping into a flat array for frontend charts/tables
        const formattedData = Object.entries(costMapping).map(([dept, cost]) => ({
            department: dept,
            totalCost: parseFloat(cost.toFixed(2))
        }));

        res.json(formattedData);

    } catch (error) {
        console.error("HR_REPORT_ERROR:", error.message);
        res.status(500).json({ error: "Failed to generate payroll department report." });
    }
};

module.exports = { getPayrollCostByDepartment };