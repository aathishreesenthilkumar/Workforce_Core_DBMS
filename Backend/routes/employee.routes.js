const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAuthenticated, requireRole } = require('../middleware/auth');

/**
 * GET /api/departments
 * List all available departments
 */
router.get('/departments', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY department_name ASC');
        res.json({ success: true, departments: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/employees
 * List employees with search, department filtering, and pagination
 */
router.get('/employees', isAuthenticated, async (req, res) => {
    try {
        const { search, department_id, status = 'ACTIVE', limit = 50, offset = 0 } = req.query;
        let sql = `
            SELECT 
                e.employee_id,
                e.employee_code,
                e.full_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.designation,
                e.joining_date,
                e.employment_status,
                u.role,
                u.is_active AS user_active
            FROM employees e
            JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN users u ON e.employee_id = u.employee_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            sql += ` AND e.employment_status = $${params.length}`;
        }
        if (department_id) {
            params.push(department_id);
            sql += ` AND e.department_id = $${params.length}`;
        }
        if (search) {
            params.push(`%${search.trim()}%`);
            sql += ` AND (e.full_name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
        }

        sql += ` ORDER BY e.employee_code ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const result = await db.query(sql, params);
        res.json({ success: true, employees: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/employees/:id
 * Retrieve single employee details (Employees can only view self; Admin/Manager can view any)
 */
router.get('/employees/:id', isAuthenticated, async (req, res) => {
    try {
        const targetId = parseInt(req.params.id, 10);
        const currentUser = req.session.user;

        // Authorization check: Employee cannot access other employees' records
        if (currentUser.role === 'EMPLOYEE' && currentUser.employee_id !== targetId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You are not authorized to view another employee’s record.'
            });
        }

        const sql = `
            SELECT 
                e.employee_id,
                e.employee_code,
                e.full_name,
                e.email,
                e.phone,
                e.department_id,
                d.department_name,
                e.designation,
                e.joining_date,
                e.employment_status,
                u.username,
                u.role,
                ss.basic_salary,
                ss.allowances,
                ss.standard_deductions
            FROM employees e
            JOIN departments d ON e.department_id = d.department_id
            LEFT JOIN users u ON e.employee_id = u.employee_id
            LEFT JOIN salary_structures ss ON e.employee_id = ss.employee_id AND ss.effective_to IS NULL
            WHERE e.employee_id = $1;
        `;
        const result = await db.query(sql, [targetId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        res.json({ success: true, employee: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

