const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendance.service');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/attendance
 * List attendance records with role-based restriction
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let { employee_id, department_id, start_date, end_date, status, limit, offset } = req.query;

        // Employees are strictly restricted to their own attendance records
        if (currentUser.role === 'EMPLOYEE') {
            employee_id = currentUser.employee_id;
        }

        const records = await attendanceService.getAttendanceRecords({
            employee_id: employee_id ? parseInt(employee_id, 10) : undefined,
            department_id: department_id ? parseInt(department_id, 10) : undefined,
            start_date,
            end_date,
            status,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0
        });

        res.json({ success: true, attendance: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/attendance/summary
 * Retrieves attendance analytics for current month
 */
router.get('/summary', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let targetEmpId = currentUser.employee_id;

        // Manager or Admin can view summary for another employee
        if (currentUser.role !== 'EMPLOYEE' && req.query.employee_id) {
            targetEmpId = parseInt(req.query.employee_id, 10);
        }

        const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
        const month = req.query.month ? parseInt(req.query.month, 10) : (new Date().getMonth() + 1);

        const summary = await attendanceService.getEmployeeSummary(targetEmpId, year, month);
        res.json({ success: true, summary });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/attendance/mark
 * Mark or update daily attendance
 */
router.post('/mark', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        let { employee_id, attendance_date, check_in, check_out, attendance_status, remarks } = req.body;

        // An employee can only mark for themselves; managers/admins can mark for any employee, or default to themselves
        if (currentUser.role === 'EMPLOYEE' || !employee_id) {
            employee_id = currentUser.employee_id;
        }

        // Default to today's date if not provided
        if (!attendance_date) {
            attendance_date = new Date().toISOString().split('T')[0];
        }

        if (!employee_id || !attendance_date || !attendance_status) {
            return res.status(400).json({
                success: false,
                message: 'employee_id, attendance_date, and attendance_status are required.'
            });
        }

        const record = await attendanceService.recordAttendance({
            employee_id: parseInt(employee_id, 10),
            attendance_date,
            check_in,
            check_out,
            attendance_status,
            remarks
        });

        res.json({ success: true, message: 'Attendance recorded successfully.', record });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;

