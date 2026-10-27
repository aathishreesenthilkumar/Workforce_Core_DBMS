const db = require('../db');

/**
 * Attendance Service: Encapsulates attendance operations and analytics
 */
class AttendanceService {
    /**
     * Retrieve attendance records with optional filtering
     */
    async getAttendanceRecords({ employee_id, department_id, start_date, end_date, status, limit = 100, offset = 0 }) {
        let queryText = `
            SELECT 
                a.attendance_id,
                a.attendance_date,
                a.check_in,
                a.check_out,
                a.attendance_status,
                a.remarks,
                e.employee_id,
                e.employee_code,
                e.full_name,
                d.department_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            JOIN departments d ON e.department_id = d.department_id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            params.push(employee_id);
            queryText += ` AND a.employee_id = $${params.length}`;
        }
        if (department_id) {
            params.push(department_id);
            queryText += ` AND e.department_id = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            queryText += ` AND a.attendance_date >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            queryText += ` AND a.attendance_date <= $${params.length}`;
        }
        if (status) {
            params.push(status);
            queryText += ` AND a.attendance_status = $${params.length}`;
        }

        queryText += ` ORDER BY a.attendance_date DESC, e.employee_code ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(queryText, params);
        return result.rows;
    }

    /**
     * Record or update daily attendance
     */
    async recordAttendance({ employee_id, attendance_date, check_in, check_out, attendance_status, remarks }) {
        // Enforce valid attendance status
        const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'];
        if (!validStatuses.includes(attendance_status)) {
            throw new Error(`Invalid status '${attendance_status}'. Must be one of: ${validStatuses.join(', ')}`);
        }

        const queryText = `
            INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, attendance_status, remarks)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (employee_id, attendance_date)
            DO UPDATE SET 
                check_in = EXCLUDED.check_in,
                check_out = EXCLUDED.check_out,
                attendance_status = EXCLUDED.attendance_status,
                remarks = EXCLUDED.remarks
            RETURNING *;
        `;
        const result = await db.query(queryText, [
            employee_id,
            attendance_date,
            check_in || null,
            check_out || null,
            attendance_status,
            remarks || null
        ]);
        return result.rows[0];
    }

    /**
     * Get attendance summary for an employee in a given month or overall
     */
    async getEmployeeSummary(employee_id, year = 2026, month = 10) {
        const queryText = `
            SELECT 
                COUNT(*) AS total_recorded_days,
                COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present_days,
                COUNT(*) FILTER (WHERE attendance_status = 'ABSENT') AS absent_days,
                COUNT(*) FILTER (WHERE attendance_status = 'HALF_DAY') AS half_days,
                COUNT(*) FILTER (WHERE attendance_status = 'ON_LEAVE') AS leave_days,
                ROUND((COUNT(*) FILTER (WHERE attendance_status IN ('PRESENT', 'HALF_DAY'))::NUMERIC / 
                    NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2) AS attendance_percentage
            FROM attendance
            WHERE employee_id = $1
              AND EXTRACT(YEAR FROM attendance_date) = $2
              AND EXTRACT(MONTH FROM attendance_date) = $3;
        `;
        const result = await db.query(queryText, [employee_id, year, month]);
        return result.rows[0] || {
            total_recorded_days: 0,
            present_days: 0,
            absent_days: 0,
            half_days: 0,
            leave_days: 0,
            attendance_percentage: 0
        };
    }
}

module.exports = new AttendanceService();

