const express = require('express');
const router = express.Router();
const payrollService = require('../services/payroll.service');
const db = require('../db');
const { isAuthenticated, requireRole } = require('../middleware/auth');

/**
 * GET /api/payroll
 * List payroll history with role protection
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let { employee_id, pay_month, department_id, payment_status, limit, offset } = req.query;

        // Employees can only view their own payroll records
        if (currentUser.role === 'EMPLOYEE') {
            employee_id = currentUser.employee_id;
        }

        const records = await payrollService.getPayrollList({
            employee_id: employee_id ? parseInt(employee_id, 10) : undefined,
            pay_month,
            department_id: department_id ? parseInt(department_id, 10) : undefined,
            payment_status,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0
        });

        res.json({ success: true, payroll: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/payroll/summary/monthly
 * Financial aggregated summary (Admin/Manager only)
 */
router.get('/summary/monthly', isAuthenticated, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM v_monthly_payroll_summary ORDER BY pay_month DESC');
        res.json({ success: true, summaries: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/payroll/:id
 * Retrieve detailed payslip
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const payrollId = parseInt(req.params.id, 10);
        const payslip = await payrollService.getPayslipById(payrollId);

        if (!payslip) {
            return res.status(404).json({ success: false, message: 'Payslip not found.' });
        }

        const currentUser = req.session.user;
        // Verify employee can only access their own payslip
        if (currentUser.role === 'EMPLOYEE' && currentUser.employee_id !== payslip.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You cannot view another employee’s payslip.'
            });
        }

        res.json({ success: true, payslip });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/payroll/generate
 * Generate monthly payroll for active workforce (Admin / Manager only)
 */
router.post('/generate', isAuthenticated, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const { pay_month, employee_ids } = req.body;

        if (!pay_month) {
            return res.status(400).json({
                success: false,
                message: 'pay_month (YYYY-MM-01) is required.'
            });
        }

        const summary = await payrollService.generateMonthlyPayroll(pay_month, employee_ids);
        res.status(201).json({
            success: true,
            message: `Payroll successfully processed for ${summary.total_processed} employee(s).`,
            summary
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;

