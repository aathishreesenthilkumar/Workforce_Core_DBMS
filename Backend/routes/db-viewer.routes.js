const express = require('express');
const router = express.Router();
const db = require('../db');
const mem = require('../memory-db');

// List of all 9 core tables in our schema
const TABLES = [
    'employees',
    'departments',
    'users',
    'attendance',
    'leave_types',
    'leave_balances',
    'leave_requests',
    'salary_structures',
    'payroll'
];

/**
 * GET /api/db-viewer/tables
 * Lists all tables and current row counts
 */
router.get('/tables', async (req, res) => {
    try {
        const counts = [];
        for (const tbl of TABLES) {
            let rowCount = 0;
            try {
                const countRes = await db.query(`SELECT COUNT(*) AS total FROM ${tbl}`);
                rowCount = parseInt(countRes.rows[0].total, 10);
            } catch (e) {
                // fallback to memory
                if (tbl === 'employees') rowCount = mem.employees.length;
                else if (tbl === 'departments') rowCount = mem.departments.length;
                else if (tbl === 'users') rowCount = mem.users.length;
                else if (tbl === 'attendance') rowCount = mem.attendanceLogs.length;
                else if (tbl === 'leave_types') rowCount = mem.leaveTypes.length;
                else if (tbl === 'leave_balances') rowCount = mem.leaveBalances.length;
                else if (tbl === 'leave_requests') rowCount = mem.leaveRequests.length;
                else if (tbl === 'salary_structures') rowCount = mem.salaryStructures.length;
                else if (tbl === 'payroll') rowCount = mem.payrollRecords.length;
            }
            counts.push({ table_name: tbl, row_count: rowCount });
        }
        res.json({ success: true, tables: counts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/db-viewer/tables/:tableName
 * Returns all stored rows and schema columns for the chosen table
 */
router.get('/tables/:tableName', async (req, res) => {
    try {
        const tbl = req.params.tableName.toLowerCase();
        if (!TABLES.includes(tbl)) {
            return res.status(400).json({ success: false, message: 'Invalid table name.' });
        }

        let rows = [];
        try {
            const queryRes = await db.query(`SELECT * FROM ${tbl} ORDER BY 1 ASC LIMIT 100`);
            rows = queryRes.rows;
        } catch (e) {
            // fallback
            if (tbl === 'employees') rows = mem.employees;
            else if (tbl === 'departments') rows = mem.departments;
            else if (tbl === 'users') rows = mem.users;
            else if (tbl === 'attendance') rows = mem.attendanceLogs;
            else if (tbl === 'leave_types') rows = mem.leaveTypes;
            else if (tbl === 'leave_balances') rows = mem.leaveBalances;
            else if (tbl === 'leave_requests') rows = mem.leaveRequests;
            else if (tbl === 'salary_structures') rows = mem.salaryStructures;
            else if (tbl === 'payroll') rows = mem.payrollRecords;
        }

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        res.json({
            success: true,
            table_name: tbl,
            total_rows: rows.length,
            columns,
            rows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

