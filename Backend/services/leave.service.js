const db = require('../db');

/**
 * Leave Management Service
 * Policy Note: Leave duration is calculated based on inclusive calendar days.
 * Formula: total_days = (end_date - start_date) + 1 day.
 */
class LeaveService {
    /**
     * Submit a new leave request with balance and overlap checks
     */
    async applyLeave({ employee_id, leave_type_id, start_date, end_date, reason }) {
        if (!start_date || !end_date || !reason || !leave_type_id) {
            throw new Error('All fields (leave_type_id, start_date, end_date, reason) are required.');
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid start or end date format.');
        }

        if (end < start) {
            throw new Error('Leave end date cannot be earlier than start date.');
        }

        // Cross-year validation:
        // Annual quotas (casual, sick, earned) are partitioned strictly on a calendar-year basis (Jan 1 - Dec 31).
        // Requests spanning multiple calendar years must be submitted as distinct applications for each year.
        if (start.getFullYear() !== end.getFullYear()) {
            throw new Error(
                'Cross-year leave requests spanning multiple calendar years must be submitted as separate requests for each year (one ending Dec 31 and one starting Jan 1) to align with annual leave quotas.'
            );
        }

        // Calculate inclusive calendar days
        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const leaveYear = start.getFullYear();

        // 1. Check for overlapping active (PENDING or APPROVED) leave requests
        const overlapCheck = await db.query(
            `SELECT leave_id, start_date, end_date, status 
             FROM leave_requests 
             WHERE employee_id = $1 
               AND status IN ('PENDING', 'APPROVED')
               AND start_date <= $2 
               AND end_date >= $3`,
            [employee_id, end_date, start_date]
        );

        if (overlapCheck.rows.length > 0) {
            throw new Error('You already have a pending or approved leave request overlapping this date range.');
        }

        // 2. Fetch leave type details
        const typeRes = await db.query(
            'SELECT leave_type_id, leave_type_name, is_paid FROM leave_types WHERE leave_type_id = $1',
            [leave_type_id]
        );
        if (typeRes.rows.length === 0) {
            throw new Error('Specified leave type does not exist.');
        }
        const leaveType = typeRes.rows[0];

        // 3. For paid leave, check current available balance
        if (leaveType.is_paid) {
            const balanceRes = await db.query(
                `SELECT allocated_days, used_days, (allocated_days - used_days) AS remaining_days
                 FROM leave_balances 
                 WHERE employee_id = $1 AND leave_type_id = $2 AND leave_year = $3`,
                [employee_id, leave_type_id, leaveYear]
            );

            if (balanceRes.rows.length === 0) {
                throw new Error(`No allocated leave balance found for ${leaveType.leave_type_name} in year ${leaveYear}.`);
            }

            const balance = balanceRes.rows[0];
            if (parseFloat(balance.remaining_days) < totalDays) {
                throw new Error(
                    `Insufficient leave balance. Requested: ${totalDays} days, Available: ${balance.remaining_days} days.`
                );
            }
        }

        // 4. Insert leave request
        const insertRes = await db.query(
            `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
             RETURNING *;`,
            [employee_id, leave_type_id, start_date, end_date, totalDays, reason]
        );

        return insertRes.rows[0];
    }

    /**
     * Review leave request (Approve or Reject) using an ACID transaction and row locking
     */
    async reviewLeave({ leave_id, reviewer_employee_id, reviewer_role = null, action, review_comments }) {
        if (!['APPROVE', 'REJECT'].includes(action)) {
            throw new Error("Action must be either 'APPROVE' or 'REJECT'.");
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Lock the target leave request row for atomic processing and join employee's department
            const reqRes = await client.query(
                `SELECT lr.*, lt.is_paid, e.department_id AS employee_dept_id, e.full_name AS employee_name
                 FROM leave_requests lr
                 JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
                 JOIN employees e ON lr.employee_id = e.employee_id
                 WHERE lr.leave_id = $1 FOR UPDATE`,
                [leave_id]
            );

            if (reqRes.rows.length === 0) {
                throw new Error('Leave request not found.');
            }

            const request = reqRes.rows[0];
            if (request.status !== 'PENDING') {
                throw new Error(`Leave request has already been ${request.status.toLowerCase()}.`);
            }

            // Department authorization check:
            // ADMIN has organization-wide authority to approve/reject.
            // MANAGER can ONLY approve or reject leave requests within their own department.
            if (reviewer_role === 'MANAGER') {
                const reviewerEmpRes = await client.query(
                    'SELECT department_id FROM employees WHERE employee_id = $1',
                    [reviewer_employee_id]
                );
                if (reviewerEmpRes.rows.length > 0) {
                    const reviewerDeptId = reviewerEmpRes.rows[0].department_id;
                    if (reviewerDeptId !== request.employee_dept_id) {
                        throw new Error('Forbidden: Managers can only approve or reject leave requests within their own department.');
                    }
                }
            }

            const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            const leaveYear = new Date(request.start_date).getFullYear();

            // If approving a paid leave, deduct balance atomically
            if (action === 'APPROVE' && request.is_paid) {
                const balRes = await client.query(
                    `SELECT leave_balance_id, allocated_days, used_days, (allocated_days - used_days) AS remaining_days
                     FROM leave_balances
                     WHERE employee_id = $1 AND leave_type_id = $2 AND leave_year = $3
                     FOR UPDATE`,
                    [request.employee_id, request.leave_type_id, leaveYear]
                );

                if (balRes.rows.length === 0) {
                    throw new Error('Leave balance record not found for this employee and year.');
                }

                const balance = balRes.rows[0];
                if (parseFloat(balance.remaining_days) < parseFloat(request.total_days)) {
                    throw new Error(
                        `Cannot approve: Insufficient balance. Available: ${balance.remaining_days}, Required: ${request.total_days}`
                    );
                }

                // Update leave balance
                await client.query(
                    `UPDATE leave_balances 
                     SET used_days = used_days + $1 
                     WHERE leave_balance_id = $2`,
                    [request.total_days, balance.leave_balance_id]
                );
            }

            // Update leave request status
            const updateRes = await client.query(
                `UPDATE leave_requests
                 SET status = $1,
                     reviewed_by = $2,
                     reviewed_at = CURRENT_TIMESTAMP,
                     review_comments = $3
                 WHERE leave_id = $4
                 RETURNING *;`,
                [newStatus, reviewer_employee_id, review_comments || null, leave_id]
            );

            await client.query('COMMIT');
            return updateRes.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get leave balances for an employee
     */
    async getBalances(employee_id, year = 2026) {
        const res = await db.query(
            `SELECT 
                lb.leave_balance_id,
                lt.leave_type_id,
                lt.leave_type_name,
                lt.is_paid,
                lb.leave_year,
                lb.allocated_days,
                lb.used_days,
                (lb.allocated_days - lb.used_days) AS remaining_days
             FROM leave_balances lb
             JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
             WHERE lb.employee_id = $1 AND lb.leave_year = $2
             ORDER BY lt.leave_type_id ASC`,
            [employee_id, year]
        );
        return res.rows;
    }

    /**
     * List leave requests with filters
     */
    async getRequests({ employee_id, status, department_id, limit = 50, offset = 0 }) {
        let queryText = `
            SELECT 
                lr.leave_id,
                lr.employee_id,
                e.employee_code,
                e.full_name,
                d.department_name,
                lt.leave_type_name,
                lt.is_paid,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.reason,
                lr.status,
                lr.applied_at,
                lr.reviewed_at,
                lr.review_comments,
                rev.full_name AS reviewer_name
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
            LEFT JOIN employees rev ON lr.reviewed_by = rev.employee_id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            params.push(employee_id);
            queryText += ` AND lr.employee_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            queryText += ` AND lr.status = $${params.length}`;
        }
        if (department_id) {
            params.push(department_id);
            queryText += ` AND e.department_id = $${params.length}`;
        }

        queryText += ` ORDER BY lr.applied_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const res = await db.query(queryText, params);
        return res.rows;
    }
}

module.exports = new LeaveService();

