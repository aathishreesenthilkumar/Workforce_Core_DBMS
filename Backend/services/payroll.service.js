const db = require('../db');

/**
 * Payroll Management Service
 * 
 * Calculation Model:
 *   Gross Salary = Basic Salary + Allowances + Bonus
 *   Net Salary = Gross Salary - Standard Deductions - Unpaid Leave Deduction
 * 
 * Unpaid Leave Deduction Model:
 *   Per-day Salary Rate = Basic Salary / 30.0 (Standard 30-day corporate payroll basis)
 *   Unpaid Days = Sum of approved unpaid leave (LWP) days within the payroll month
 *   Unpaid Leave Deduction = Unpaid Days * Per-day Salary Rate
 */
class PayrollService {
    /**
     * Calculate overlapping inclusive calendar days between a leave request date range
     * and a specific calendar month.
     * 
     * Handles leaves starting in previous months, ending in future months,
     * month-end boundaries, and cross-year spans.
     * 
     * @param {string|Date} leaveStart - Start date of the leave
     * @param {string|Date} leaveEnd - End date of the leave
     * @param {number} year - Full calendar year (e.g. 2026)
     * @param {number} month - Calendar month (1-12)
     * @returns {number} Inclusive days overlapping the given month
     */
    calculateMonthOverlapDays(leaveStart, leaveEnd, year, month) {
        return PayrollService.calculateMonthOverlapDays(leaveStart, leaveEnd, year, month);
    }

    static calculateMonthOverlapDays(leaveStart, leaveEnd, year, month) {
        // Month start: year-month-01 UTC
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        // Month end: last day of month UTC
        const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const monthEnd = new Date(Date.UTC(year, month - 1, lastDayOfMonth));

        // Format and parse leave dates as UTC
        const startStr = typeof leaveStart === 'string' ? leaveStart.split('T')[0] : leaveStart.toISOString().split('T')[0];
        const endStr = typeof leaveEnd === 'string' ? leaveEnd.split('T')[0] : leaveEnd.toISOString().split('T')[0];

        const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
        const [eYear, eMonth, eDay] = endStr.split('-').map(Number);

        const lStart = new Date(Date.UTC(sYear, sMonth - 1, sDay));
        const lEnd = new Date(Date.UTC(eYear, eMonth - 1, eDay));

        // If leave ends before month starts or starts after month ends, overlap is 0
        if (lEnd < monthStart || lStart > monthEnd) {
            return 0;
        }

        const effectiveStart = lStart > monthStart ? lStart : monthStart;
        const effectiveEnd = lEnd < monthEnd ? lEnd : monthEnd;

        if (effectiveEnd < effectiveStart) {
            return 0;
        }

        const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    /**
     * Compute unpaid leave days for an employee strictly falling within a given payroll month
     */
    async getApprovedUnpaidLeaveDays(employeeId, payMonthDate) {
        const year = payMonthDate.getFullYear();
        const month = payMonthDate.getMonth() + 1; // 1-12
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const res = await db.query(
            `SELECT lr.leave_id, lr.start_date, lr.end_date, lr.total_days
             FROM leave_requests lr
             JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
             WHERE lr.employee_id = $1
               AND lt.is_paid = FALSE
               AND lr.status = 'APPROVED'
               AND lr.start_date <= $2 
               AND lr.end_date >= $3`,
            [employeeId, endDate, startDate]
        );

        let totalUnpaidDaysInMonth = 0;
        for (const row of res.rows) {
            const overlapDays = PayrollService.calculateMonthOverlapDays(row.start_date, row.end_date, year, month);
            totalUnpaidDaysInMonth += overlapDays;
        }

        return totalUnpaidDaysInMonth;
    }

    /**
     * Generate monthly payroll for all active employees or specific employees
     * @param {string} payMonthStr - Canonical date string (e.g. '2026-10-01')
     * @param {number[]} [targetEmployeeIds] - Optional specific employee IDs
     */
    async generateMonthlyPayroll(payMonthStr, targetEmployeeIds = null) {
        // Parse canonical first-of-month date
        const payMonthDate = new Date(payMonthStr);
        if (isNaN(payMonthDate.getTime())) {
            throw new Error('Invalid pay month format. Expected YYYY-MM-01.');
        }

        const canonicalMonth = `${payMonthDate.getFullYear()}-${String(payMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        const year = payMonthDate.getFullYear();
        const month = payMonthDate.getMonth() + 1;
        const lastDay = new Date(year, month, 0).getDate();
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Fetch active employees with their salary structure active during this payroll month.
            // Enforces:
            //   a) effective_from <= monthEnd (future-dated structures are excluded)
            //   b) effective_to IS NULL OR effective_to >= monthStart (expired structures are excluded)
            //   c) Ordered by effective_from DESC to select the latest valid structure for that month
            let empQuery = `
                SELECT 
                    e.employee_id,
                    e.employee_code,
                    e.full_name,
                    ss.salary_structure_id,
                    ss.basic_salary,
                    ss.allowances,
                    ss.standard_deductions,
                    ss.effective_from,
                    ss.effective_to
                FROM employees e
                JOIN salary_structures ss ON e.employee_id = ss.employee_id
                WHERE e.employment_status = 'ACTIVE'
                  AND ss.effective_from <= $1
                  AND (ss.effective_to IS NULL OR ss.effective_to >= $2)
            `;
            const empParams = [monthEnd, monthStart];
            if (targetEmployeeIds && targetEmployeeIds.length > 0) {
                empParams.push(targetEmployeeIds);
                empQuery += ' AND e.employee_id = ANY($3)';
            }
            empQuery += ' ORDER BY e.employee_id, ss.effective_from DESC, ss.salary_structure_id DESC';

            const empRes = await client.query(empQuery, empParams);
            if (empRes.rows.length === 0) {
                throw new Error('No eligible active employees with configured salary structures found.');
            }

            // Deduplicate: select the single latest active structure per employee for this month
            const empMap = new Map();
            for (const row of empRes.rows) {
                if (!empMap.has(row.employee_id)) {
                    empMap.set(row.employee_id, row);
                }
            }
            const eligibleEmployees = Array.from(empMap.values());

            const generatedRecords = [];
            const skippedDuplicates = [];

            for (const emp of eligibleEmployees) {
                // Check if payroll record already exists for this employee and month
                const existingCheck = await client.query(
                    'SELECT payroll_id FROM payroll WHERE employee_id = $1 AND pay_month = $2',
                    [emp.employee_id, canonicalMonth]
                );

                if (existingCheck.rows.length > 0) {
                    skippedDuplicates.push(emp.employee_code);
                    continue;
                }

                // 2. Calculate Unpaid Leave Deductions
                const unpaidDays = await this.getApprovedUnpaidLeaveDays(emp.employee_id, payMonthDate);
                const basicSalary = parseFloat(emp.basic_salary);
                const allowances = parseFloat(emp.allowances);
                const deductions = parseFloat(emp.standard_deductions);
                const bonus = 0.00;

                const dailyRate = basicSalary / 30.0;
                const unpaidLeaveDeduction = parseFloat((unpaidDays * dailyRate).toFixed(2));

                // 3. Compute Gross and Net Salary
                const grossSalary = parseFloat((basicSalary + allowances + bonus).toFixed(2));
                const netSalary = parseFloat(Math.max(0, grossSalary - deductions - unpaidLeaveDeduction).toFixed(2));

                // 4. Insert payroll row (freezing snapshot values)
                const insertRes = await client.query(
                    `INSERT INTO payroll (
                        employee_id, pay_month, basic_salary, allowances, bonus,
                        deductions, unpaid_leave_deduction, gross_salary, net_salary,
                        payment_status, payment_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PROCESSED', NULL)
                    RETURNING *;`,
                    [
                        emp.employee_id,
                        canonicalMonth,
                        basicSalary,
                        allowances,
                        bonus,
                        deductions,
                        unpaidLeaveDeduction,
                        grossSalary,
                        netSalary
                    ]
                );

                generatedRecords.push(insertRes.rows[0]);
            }

            await client.query('COMMIT');

            return {
                pay_month: canonicalMonth,
                total_processed: generatedRecords.length,
                total_skipped_duplicates: skippedDuplicates.length,
                skipped_employee_codes: skippedDuplicates,
                records: generatedRecords
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Retrieve payroll list with filters
     */
    async getPayrollList({ employee_id, pay_month, department_id, payment_status, limit = 50, offset = 0 }) {
        let queryText = `
            SELECT 
                p.payroll_id,
                p.employee_id,
                e.employee_code,
                e.full_name,
                d.department_name,
                e.designation,
                p.pay_month,
                p.basic_salary,
                p.allowances,
                p.bonus,
                p.deductions,
                p.unpaid_leave_deduction,
                p.gross_salary,
                p.net_salary,
                p.payment_status,
                p.payment_date,
                p.generated_at
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            params.push(employee_id);
            queryText += ` AND p.employee_id = $${params.length}`;
        }
        if (pay_month) {
            params.push(pay_month);
            queryText += ` AND p.pay_month = $${params.length}`;
        }
        if (department_id) {
            params.push(department_id);
            queryText += ` AND e.department_id = $${params.length}`;
        }
        if (payment_status) {
            params.push(payment_status);
            queryText += ` AND p.payment_status = $${params.length}`;
        }

        queryText += ` ORDER BY p.pay_month DESC, e.employee_code ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const res = await db.query(queryText, params);
        return res.rows;
    }

    /**
     * Retrieve single payslip by ID with full employee and company details
     */
    async getPayslipById(payrollId) {
        const queryText = `
            SELECT 
                p.payroll_id,
                p.employee_id,
                e.employee_code,
                e.full_name,
                e.email,
                e.phone,
                e.designation,
                e.joining_date,
                d.department_name,
                p.pay_month,
                p.basic_salary,
                p.allowances,
                p.bonus,
                p.deductions,
                p.unpaid_leave_deduction,
                p.gross_salary,
                p.net_salary,
                p.payment_status,
                p.payment_date,
                p.generated_at
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE p.payroll_id = $1
        `;
        const res = await db.query(queryText, [payrollId]);
        if (res.rows.length === 0) {
            return null;
        }
        return res.rows[0];
    }
}

const payrollServiceInstance = new PayrollService();
payrollServiceInstance.PayrollService = PayrollService;
module.exports = payrollServiceInstance;

