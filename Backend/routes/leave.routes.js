const express = require('express');
const router = express.Router();
const leaveService = require('../services/leave.service');
const db = require('../db');
const { isAuthenticated, requireRole } = require('../middleware/auth');

/**
 * GET /api/leave/types
 * List all leave types catalog
 */
router.get('/types', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM leave_types ORDER BY leave_type_id ASC');
        res.json({ success: true, leave_types: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/leave/balances
 * Get leave balances for logged in employee (or specified employee if manager/admin)
 */
router.get('/balances', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let targetEmpId = currentUser.employee_id;

        if (currentUser.role !== 'EMPLOYEE' && req.query.employee_id) {
            targetEmpId = parseInt(req.query.employee_id, 10);
        }

        const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
        const balances = await leaveService.getBalances(targetEmpId, year);
        res.json({ success: true, balances });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/leave
 * List leave requests with role-based scoping
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let { employee_id, status, department_id, limit, offset } = req.query;

        // Employees can only inspect their own leave applications
        if (currentUser.role === 'EMPLOYEE') {
            employee_id = currentUser.employee_id;
        }

        const requests = await leaveService.getRequests({
            employee_id: employee_id ? parseInt(employee_id, 10) : undefined,
            status,
            department_id: department_id ? parseInt(department_id, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0
        });

        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/leave/apply
 * Submit a leave application
 */
router.post('/apply', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const { leave_type_id, start_date, end_date, reason } = req.body;

        const request = await leaveService.applyLeave({
            employee_id: currentUser.employee_id,
            leave_type_id: parseInt(leave_type_id, 10),
            start_date,
            end_date,
            reason
        });

        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully.',
            leave: request
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

/**
 * PATCH /api/leave/:id/approve
 * Reviewer approval endpoint (Admin / Manager only)
 */
router.patch('/:id/approve', isAuthenticated, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const leaveId = parseInt(req.params.id, 10);
        const reviewerId = req.session.user.employee_id;
        const reviewerRole = req.session.user.role;
        const { comments } = req.body;

        const updated = await leaveService.reviewLeave({
            leave_id: leaveId,
            reviewer_employee_id: reviewerId,
            reviewer_role: reviewerRole,
            action: 'APPROVE',
            review_comments: comments
        });

        res.json({
            success: true,
            message: 'Leave application approved successfully.',
            leave: updated
        });
    } catch (err) {
        const status = err.message && err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ success: false, message: err.message });
    }
});

/**
 * PATCH /api/leave/:id/reject
 * Reviewer rejection endpoint (Admin / Manager only)
 */
router.patch('/:id/reject', isAuthenticated, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
    try {
        const leaveId = parseInt(req.params.id, 10);
        const reviewerId = req.session.user.employee_id;
        const reviewerRole = req.session.user.role;
        const { comments } = req.body;

        const updated = await leaveService.reviewLeave({
            leave_id: leaveId,
            reviewer_employee_id: reviewerId,
            reviewer_role: reviewerRole,
            action: 'REJECT',
            review_comments: comments
        });

        res.json({
            success: true,
            message: 'Leave application rejected.',
            leave: updated
        });
    } catch (err) {
        const status = err.message && err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ success: false, message: err.message });
    }
});

module.exports = router;

