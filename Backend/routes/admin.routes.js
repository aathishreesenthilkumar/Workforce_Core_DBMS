const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { isAuthenticated, requireRole } = require('../middleware/auth');

// All admin routes strictly require ADMIN or MANAGER role
router.use(isAuthenticated, requireRole('ADMIN', 'MANAGER'));

/**
 * GET /api/admin/stats
 * Dashboard high-level KPIs and metrics
 */
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [empRes, deptRes, attRes, leaveRes, payRes] = await Promise.all([
            db.query("SELECT COUNT(*) AS total_employees FROM employees WHERE employment_status = 'ACTIVE'"),
            db.query("SELECT COUNT(*) AS total_departments FROM departments"),
            db.query("SELECT COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present_today FROM attendance WHERE attendance_date = $1", [today]),
            db.query("SELECT COUNT(*) AS pending_leaves FROM leave_requests WHERE status = 'PENDING'"),
            db.query("SELECT COALESCE(SUM(net_salary), 0) AS last_month_payroll FROM payroll WHERE pay_month = (SELECT MAX(pay_month) FROM payroll)")
        ]);

        res.json({
            success: true,
            stats: {
                total_employees: parseInt(empRes.rows[0].total_employees, 10),
                total_departments: parseInt(deptRes.rows[0].total_departments, 10),
                present_today: parseInt(attRes.rows[0].present_today || 0, 10),
                pending_leaves: parseInt(leaveRes.rows[0].pending_leaves, 10),
                last_month_payroll: parseFloat(payRes.rows[0].last_month_payroll)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/admin/employees
 * Register new employee with user account and initial leave balances
 */
router.post('/employees', requireRole('ADMIN'), async (req, res) => {
    const {
        employee_code,
        full_name,
        email,
        phone,
        department_id,
        designation,
        joining_date,
        username,
        password,
        role = 'EMPLOYEE',
        basic_salary = 50000,
        allowances = 10000,
        standard_deductions = 5000
    } = req.body;

    if (!employee_code || !full_name || !email || !department_id || !designation || !joining_date || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'All core employee and user account fields are required.'
        });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Check duplicate employee code or email
        const dupCheck = await client.query(
            'SELECT employee_id FROM employees WHERE employee_code = $1 OR email = $2',
            [employee_code, email]
        );
        if (dupCheck.rows.length > 0) {
            throw new Error('Employee code or email already exists.');
        }

        // Check duplicate username
        const userCheck = await client.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            throw new Error('Username already exists.');
        }

        // 1. Insert Employee
        const empInsert = await client.query(
            `INSERT INTO employees (employee_code, full_name, email, phone, department_id, designation, joining_date, employment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
             RETURNING *;`,
            [employee_code, full_name, email, phone, department_id, designation, joining_date]
        );
        const newEmployee = empInsert.rows[0];

        // 2. Hash Password and Insert User
        const passwordHash = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO users (employee_id, username, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, TRUE);`,
            [newEmployee.employee_id, username, passwordHash, role]
        );

        // 3. Initialize Leave Balances for Current Year
        const currentYear = new Date().getFullYear();
        await client.query(
            `INSERT INTO leave_balances (employee_id, leave_type_id, leave_year, allocated_days, used_days)
             SELECT $1, leave_type_id, $2, default_allowance, 0
             FROM leave_types;`,
            [newEmployee.employee_id, currentYear]
        );

        // 4. Initialize Salary Structure
        await client.query(
            `INSERT INTO salary_structures (employee_id, basic_salary, allowances, standard_deductions, effective_from)
             VALUES ($1, $2, $3, $4, $5);`,
            [newEmployee.employee_id, basic_salary, allowances, standard_deductions, joining_date]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Employee, user account, leave balances, and salary structure created successfully.',
            employee: newEmployee
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

/**
 * PATCH /api/admin/employees/:id
 * Update employee record
 */
router.patch('/employees/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        const empId = parseInt(req.params.id, 10);
        const { full_name, email, phone, department_id, designation, employment_status } = req.body;

        const updateRes = await db.query(
            `UPDATE employees 
             SET full_name = COALESCE($1, full_name),
                 email = COALESCE($2, email),
                 phone = COALESCE($3, phone),
                 department_id = COALESCE($4, department_id),
                 designation = COALESCE($5, designation),
                 employment_status = COALESCE($6, employment_status)
             WHERE employee_id = $7
             RETURNING *;`,
            [full_name, email, phone, department_id, designation, employment_status, empId]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully.',
            employee: updateRes.rows[0]
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

/**
 * DELETE /api/admin/employees/:id
 * Soft delete / deactivate employee
 */
router.delete('/employees/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        const empId = parseInt(req.params.id, 10);
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            await client.query("UPDATE employees SET employment_status = 'INACTIVE' WHERE employee_id = $1", [empId]);
            await client.query("UPDATE users SET is_active = FALSE WHERE employee_id = $1", [empId]);

            await client.query('COMMIT');
            res.json({ success: true, message: 'Employee deactivated successfully.' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;

