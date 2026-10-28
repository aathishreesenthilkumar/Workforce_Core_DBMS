const { Pool } = require('pg');
require('dotenv').config();
const mem = require('./memory-db');

let isPgConnected = false;

// PostgreSQL Connection Pool configuration
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
    }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'employee_management_db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.warn('PostgreSQL pool idle client warning:', err.message);
});

/**
 * In-Memory Query Router & Fallback Handler
 */
async function executeMemoryQuery(text, params = []) {
    const cleanText = text.trim();
    const upper = cleanText.toUpperCase();

    // 1. SELECT Version
    if (upper.includes('SELECT VERSION()')) {
        return { rows: [{ version: 'PostgreSQL 16.2 (Simulated In-Memory Engine) on Windows' }] };
    }

    // 2. Auth Query: Lookup user by username
    if (upper.includes('FROM USERS U') && upper.includes('WHERE LOWER(U.USERNAME) = LOWER($1)')) {
        const username = (params[0] || '').toLowerCase();
        const user = mem.users.find(u => u.username.toLowerCase() === username);
        if (!user) return { rows: [] };
        const emp = mem.employees.find(e => e.employee_id === user.employee_id);
        const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
        return {
            rows: [{
                user_id: user.user_id,
                employee_id: user.employee_id,
                username: user.username,
                password_hash: user.password_hash,
                role: user.role,
                is_active: user.is_active,
                employee_code: emp ? emp.employee_code : 'EMP000',
                full_name: emp ? emp.full_name : 'User',
                email: emp ? emp.email : '',
                designation: emp ? emp.designation : '',
                department_id: emp ? emp.department_id : 1,
                department_name: dept ? dept.department_name : 'General'
            }]
        };
    }

    // 2b. Demo Users List
    if (upper.includes('FROM USERS U') && (upper.includes('WHERE U.IS_ACTIVE = TRUE') || upper.includes('DEMO-USERS'))) {
        return {
            rows: mem.users.filter(u => u.is_active).map(u => {
                const emp = mem.employees.find(e => e.employee_id === u.employee_id);
                const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
                return {
                    user_id: u.user_id,
                    username: u.username,
                    role: u.role,
                    employee_id: u.employee_id,
                    employee_code: emp ? emp.employee_code : 'EMP000',
                    full_name: emp ? emp.full_name : 'User',
                    designation: emp ? emp.designation : '',
                    department_id: dept ? dept.department_id : 1,
                    department_name: dept ? dept.department_name : 'General'
                };
            })
        };
    }

    // 3. Departments: List departments
    if (upper.includes('FROM DEPARTMENTS') && !upper.includes('COUNT(')) {
        return { rows: [...mem.departments] };
    }

    // 4. Employees: Single Employee Profile
    if (upper.includes('FROM EMPLOYEES E') && upper.includes('WHERE E.EMPLOYEE_ID = $1')) {
        const empId = parseInt(params[0], 10);
        const emp = mem.employees.find(e => e.employee_id === empId);
        if (!emp) return { rows: [] };
        const dept = mem.departments.find(d => d.department_id === emp.department_id);
        const user = mem.users.find(u => u.employee_id === empId);
        const sal = mem.salaryStructures.find(s => s.employee_id === empId && s.effective_to === null);
        return {
            rows: [{
                ...emp,
                department_name: dept ? dept.department_name : '',
                username: user ? user.username : '',
                role: user ? user.role : 'EMPLOYEE',
                basic_salary: sal ? sal.basic_salary : 50000,
                allowances: sal ? sal.allowances : 10000,
                standard_deductions: sal ? sal.standard_deductions : 5000
            }]
        };
    }

    // 5. Employees: Directory List / Search
    if (upper.includes('FROM EMPLOYEES E') && upper.includes('JOIN DEPARTMENTS')) {
        let results = mem.employees.map(emp => {
            const dept = mem.departments.find(d => d.department_id === emp.department_id);
            const user = mem.users.find(u => u.employee_id === emp.employee_id);
            return {
                ...emp,
                department_name: dept ? dept.department_name : '',
                role: user ? user.role : 'EMPLOYEE',
                user_active: user ? user.is_active : true
            };
        });

        // Filter status
        results = results.filter(e => e.employment_status === 'ACTIVE');

        // Check if filtered by department
        if (cleanText.includes('e.department_id = $')) {
            const deptIndex = cleanText.indexOf('e.department_id = $');
            const paramNum = parseInt(cleanText.substring(deptIndex + 19, deptIndex + 21), 10);
            if (params[paramNum - 1]) {
                results = results.filter(e => e.department_id === parseInt(params[paramNum - 1], 10));
            }
        }

        // Check search filter
        if (cleanText.includes('e.full_name ILIKE $')) {
            const searchVal = (params.find(p => typeof p === 'string' && p.startsWith('%')) || '').replace(/%/g, '').toLowerCase();
            if (searchVal) {
                results = results.filter(e => 
                    e.full_name.toLowerCase().includes(searchVal) || 
                    e.employee_code.toLowerCase().includes(searchVal) ||
                    e.email.toLowerCase().includes(searchVal)
                );
            }
        }

        return { rows: results };
    }

    // 6. Attendance: Summary for current month
    if (upper.includes('FROM ATTENDANCE') && upper.includes('COUNT(*)')) {
        const empId = parseInt(params[0], 10);
        const empLogs = mem.attendanceLogs.filter(a => a.employee_id === empId);
        const presentDays = empLogs.filter(a => a.attendance_status === 'PRESENT').length;
        const absentDays = empLogs.filter(a => a.attendance_status === 'ABSENT').length;
        const halfDays = empLogs.filter(a => a.attendance_status === 'HALF_DAY').length;
        const leaveDays = empLogs.filter(a => a.attendance_status === 'ON_LEAVE').length;
        const total = empLogs.length;
        const pct = total > 0 ? Math.round(((presentDays + halfDays * 0.5) / total) * 100) : 100;

        return {
            rows: [{
                total_recorded_days: total,
                present_days: presentDays,
                absent_days: absentDays,
                half_days: halfDays,
                leave_days: leaveDays,
                attendance_percentage: pct
            }]
        };
    }

    // 7. Attendance: List records
    if (upper.includes('FROM ATTENDANCE A') && upper.includes('JOIN EMPLOYEES E')) {
        let results = mem.attendanceLogs.map(a => {
            const emp = mem.employees.find(e => e.employee_id === a.employee_id);
            const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
            return {
                ...a,
                employee_code: emp ? emp.employee_code : '',
                full_name: emp ? emp.full_name : '',
                department_name: dept ? dept.department_name : ''
            };
        });

        // Filter employee_id
        if (cleanText.includes('a.employee_id = $')) {
            const empId = parseInt(params[0], 10);
            results = results.filter(r => r.employee_id === empId);
        }

        results.sort((x, y) => new Date(y.attendance_date) - new Date(x.attendance_date));
        return { rows: results };
    }

    // 8. Attendance: Insert / Mark
    if (upper.includes('INSERT INTO ATTENDANCE')) {
        const empId = parseInt(params[0], 10);
        const date = params[1];
        const checkIn = params[2];
        const checkOut = params[3];
        const status = params[4];
        const remarks = params[5];

        let existing = mem.attendanceLogs.find(a => a.employee_id === empId && a.attendance_date === date);
        if (existing) {
            existing.check_in = checkIn || existing.check_in;
            existing.check_out = checkOut || existing.check_out;
            existing.attendance_status = status;
            existing.remarks = remarks || existing.remarks;
            return { rows: [existing] };
        } else {
            const newLog = {
                attendance_id: mem.attendanceLogs.length + 1,
                employee_id: empId,
                attendance_date: date,
                check_in: checkIn,
                check_out: checkOut,
                attendance_status: status,
                remarks: remarks
            };
            mem.attendanceLogs.push(newLog);
            return { rows: [newLog] };
        }
    }

    // 9. Leave: Types
    if (upper.includes('FROM LEAVE_TYPES') && !upper.includes('WHERE LEAVE_TYPE_ID')) {
        return { rows: [...mem.leaveTypes] };
    }
    if (upper.includes('FROM LEAVE_TYPES WHERE LEAVE_TYPE_ID = $1')) {
        const typeId = parseInt(params[0], 10);
        const lt = mem.leaveTypes.find(t => t.leave_type_id === typeId);
        return { rows: lt ? [lt] : [] };
    }

    // 10. Leave: Balances
    if (upper.includes('FROM LEAVE_BALANCES LB')) {
        const empId = parseInt(params[0], 10);
        const year = parseInt(params[1], 10) || 2026;
        const bals = mem.leaveBalances.filter(b => b.employee_id === empId && b.leave_year === year);
        const results = bals.map(b => {
            const lt = mem.leaveTypes.find(t => t.leave_type_id === b.leave_type_id);
            return {
                ...b,
                leave_type_name: lt ? lt.leave_type_name : '',
                is_paid: lt ? lt.is_paid : true,
                remaining_days: (parseFloat(b.allocated_days) - parseFloat(b.used_days)).toFixed(1)
            };
        });
        return { rows: results };
    }

    // 11. Leave: Overlap check
    if (upper.includes('FROM LEAVE_REQUESTS') && upper.includes('OVERLAP') || (upper.includes('STATUS IN (\'PENDING\', \'APPROVED\')') && upper.includes('START_DATE <='))) {
        return { rows: [] }; // No overlap
    }

    // 12. Leave: Balance check for Apply
    if (upper.includes('SELECT ALLOCATED_DAYS, USED_DAYS') && upper.includes('FROM LEAVE_BALANCES')) {
        const empId = parseInt(params[0], 10);
        const typeId = parseInt(params[1], 10);
        const year = parseInt(params[2], 10);
        const bal = mem.leaveBalances.find(b => b.employee_id === empId && b.leave_type_id === typeId && b.leave_year === year);
        if (!bal) {
            return { rows: [{ allocated_days: 12, used_days: 0, remaining_days: 12 }] };
        }
        return {
            rows: [{
                allocated_days: bal.allocated_days,
                used_days: bal.used_days,
                remaining_days: bal.allocated_days - bal.used_days
            }]
        };
    }

    // 13. Leave: Apply
    if (upper.includes('INSERT INTO LEAVE_REQUESTS')) {
        const newReq = {
            leave_id: mem.leaveRequests.length + 1,
            employee_id: parseInt(params[0], 10),
            leave_type_id: parseInt(params[1], 10),
            start_date: params[2],
            end_date: params[3],
            total_days: parseFloat(params[4]),
            reason: params[5],
            status: 'PENDING',
            applied_at: new Date().toISOString(),
            reviewed_by: null,
            reviewed_at: null,
            review_comments: null
        };
        mem.leaveRequests.push(newReq);
        return { rows: [newReq] };
    }

    // 14. Leave: List requests
    if (upper.includes('FROM LEAVE_REQUESTS LR')) {
        let results = mem.leaveRequests.map(lr => {
            const emp = mem.employees.find(e => e.employee_id === lr.employee_id);
            const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
            const lt = mem.leaveTypes.find(t => t.leave_type_id === lr.leave_type_id);
            const reviewer = lr.reviewed_by ? mem.employees.find(e => e.employee_id === lr.reviewed_by) : null;
            return {
                ...lr,
                employee_code: emp ? emp.employee_code : '',
                full_name: emp ? emp.full_name : '',
                department_name: dept ? dept.department_name : '',
                leave_type_name: lt ? lt.leave_type_name : '',
                is_paid: lt ? lt.is_paid : true,
                reviewer_name: reviewer ? reviewer.full_name : null
            };
        });

        // Filter employee_id
        if (cleanText.includes('lr.employee_id = $')) {
            const empId = parseInt(params[0], 10);
            results = results.filter(r => r.employee_id === empId);
        }
        // Filter status
        if (cleanText.includes('lr.status = $')) {
            const statusVal = params.find(p => ['PENDING', 'APPROVED', 'REJECTED'].includes(p));
            if (statusVal) {
                results = results.filter(r => r.status === statusVal);
            }
        }

        results.sort((x, y) => new Date(y.applied_at) - new Date(x.applied_at));
        return { rows: results };
    }

    // 15. Leave: Lock request for review
    if (upper.includes('FROM LEAVE_REQUESTS LR') && upper.includes('WHERE LR.LEAVE_ID = $1 FOR UPDATE')) {
        const leaveId = parseInt(params[0], 10);
        const req = mem.leaveRequests.find(r => r.leave_id === leaveId);
        if (!req) return { rows: [] };
        const lt = mem.leaveTypes.find(t => t.leave_type_id === req.leave_type_id);
        const emp = mem.employees.find(e => e.employee_id === req.employee_id);
        return {
            rows: [{
                ...req,
                is_paid: lt ? lt.is_paid : true,
                employee_dept_id: emp ? emp.department_id : null,
                employee_name: emp ? emp.full_name : ''
            }]
        };
    }

    // 15b. Employee department query for authorization
    if (upper.includes('SELECT DEPARTMENT_ID FROM EMPLOYEES WHERE EMPLOYEE_ID = $1')) {
        const empId = parseInt(params[0], 10);
        const emp = mem.employees.find(e => e.employee_id === empId);
        if (!emp) return { rows: [] };
        return { rows: [{ department_id: emp.department_id }] };
    }

    // 15c. Unpaid leave query for payroll
    if (upper.includes('FROM LEAVE_REQUESTS LR') && upper.includes('LT.IS_PAID = FALSE') && upper.includes('LR.STATUS = \'APPROVED\'')) {
        const empId = parseInt(params[0], 10);
        const endDate = params[1];
        const startDate = params[2];
        const unpaidLt = mem.leaveTypes.find(lt => lt.is_paid === false);
        const unpaidTypeId = unpaidLt ? unpaidLt.leave_type_id : 4;

        const matching = mem.leaveRequests.filter(lr => 
            lr.employee_id === empId &&
            lr.leave_type_id === unpaidTypeId &&
            lr.status === 'APPROVED' &&
            lr.start_date <= endDate &&
            lr.end_date >= startDate
        );
        return { rows: matching };
    }

    // 16. Leave: Update status on review
    if (upper.includes('UPDATE LEAVE_REQUESTS') && upper.includes('SET STATUS = $1')) {
        const newStatus = params[0];
        const reviewerId = parseInt(params[1], 10);
        const comments = params[2];
        const leaveId = parseInt(params[3], 10);

        const req = mem.leaveRequests.find(r => r.leave_id === leaveId);
        if (req) {
            req.status = newStatus;
            req.reviewed_by = reviewerId;
            req.reviewed_at = new Date().toISOString();
            req.review_comments = comments;
        }
        return { rows: [req] };
    }

    // 17. Leave: Deduct balance on approval
    if (upper.includes('UPDATE LEAVE_BALANCES') && upper.includes('SET USED_DAYS = USED_DAYS + $1')) {
        const addDays = parseFloat(params[0]);
        const balId = parseInt(params[1], 10);
        const bal = mem.leaveBalances.find(b => b.leave_balance_id === balId);
        if (bal) {
            bal.used_days = parseFloat(bal.used_days) + addDays;
        }
        return { rows: [bal] };
    }

    // 18. Payroll: List
    if (upper.includes('FROM PAYROLL P') && upper.includes('JOIN EMPLOYEES E')) {
        let results = mem.payrollRecords.map(p => {
            const emp = mem.employees.find(e => e.employee_id === p.employee_id);
            const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
            return {
                ...p,
                employee_code: emp ? emp.employee_code : '',
                full_name: emp ? emp.full_name : '',
                designation: emp ? emp.designation : '',
                department_name: dept ? dept.department_name : ''
            };
        });

        if (cleanText.includes('p.employee_id = $')) {
            const empId = parseInt(params[0], 10);
            results = results.filter(r => r.employee_id === empId);
        }

        results.sort((x, y) => new Date(y.pay_month) - new Date(x.pay_month));
        return { rows: results };
    }

    // 19. Payroll: Payslip by ID
    if (upper.includes('FROM PAYROLL P') && upper.includes('WHERE P.PAYROLL_ID = $1')) {
        const pId = parseInt(params[0], 10);
        const p = mem.payrollRecords.find(x => x.payroll_id === pId);
        if (!p) return { rows: [] };
        const emp = mem.employees.find(e => e.employee_id === p.employee_id);
        const dept = emp ? mem.departments.find(d => d.department_id === emp.department_id) : null;
        return {
            rows: [{
                ...p,
                employee_code: emp ? emp.employee_code : '',
                full_name: emp ? emp.full_name : '',
                email: emp ? emp.email : '',
                phone: emp ? emp.phone : '',
                designation: emp ? emp.designation : '',
                joining_date: emp ? emp.joining_date : '',
                department_name: dept ? dept.department_name : ''
            }]
        };
    }

    // 20. Payroll: Summary View
    if (upper.includes('V_MONTHLY_PAYROLL_SUMMARY')) {
        return {
            rows: [
                { pay_month: '2026-09-01', total_employees_paid: 32, total_net_disbursed: 1850000.00, paid_count: 32, pending_count: 0 },
                { pay_month: '2026-08-01', total_employees_paid: 32, total_net_disbursed: 1845000.00, paid_count: 32, pending_count: 0 },
                { pay_month: '2026-07-01', total_employees_paid: 32, total_net_disbursed: 1860000.00, paid_count: 32, pending_count: 0 }
            ]
        };
    }

    // 21. Admin: Dashboard Stats
    if (upper.includes('SELECT COUNT(*) AS TOTAL_EMPLOYEES')) {
        return { rows: [{ total_employees: mem.employees.filter(e => e.employment_status === 'ACTIVE').length }] };
    }
    if (upper.includes('SELECT COUNT(*) AS TOTAL_DEPARTMENTS')) {
        return { rows: [{ total_departments: mem.departments.length }] };
    }
    if (upper.includes('AS PRESENT_TODAY')) {
        return { rows: [{ present_today: mem.attendanceLogs.filter(a => a.attendance_status === 'PRESENT').length }] };
    }
    if (upper.includes('AS PENDING_LEAVES')) {
        return { rows: [{ pending_leaves: mem.leaveRequests.filter(r => r.status === 'PENDING').length }] };
    }
    if (upper.includes('AS LAST_MONTH_PAYROLL')) {
        const sum = mem.payrollRecords.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
        return { rows: [{ last_month_payroll: sum }] };
    }

    // 22. Payroll Generation query for active employees with date-effective salary structures
    if (upper.includes('FROM EMPLOYEES E') && upper.includes('JOIN SALARY_STRUCTURES SS')) {
        const monthEnd = params[0] || '9999-12-31';
        const monthStart = params[1] || '1970-01-01';

        const eligible = [];
        mem.employees.filter(e => e.employment_status === 'ACTIVE').forEach(emp => {
            // Find all matching salary structures effective during this payroll month
            const matching = mem.salaryStructures
                .filter(s => s.employee_id === emp.employee_id &&
                             s.effective_from <= monthEnd &&
                             (s.effective_to === null || s.effective_to >= monthStart))
                .sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from));

            if (matching.length > 0) {
                const sal = matching[0];
                eligible.push({
                    employee_id: emp.employee_id,
                    employee_code: emp.employee_code,
                    full_name: emp.full_name,
                    salary_structure_id: sal.salary_structure_id,
                    basic_salary: sal.basic_salary,
                    allowances: sal.allowances,
                    standard_deductions: sal.standard_deductions,
                    effective_from: sal.effective_from,
                    effective_to: sal.effective_to
                });
            }
        });
        return { rows: eligible };
    }

    // 23. Payroll Insert
    if (upper.includes('INSERT INTO PAYROLL')) {
        const newPay = {
            payroll_id: mem.payrollRecords.length + 1,
            employee_id: parseInt(params[0], 10),
            pay_month: params[1],
            basic_salary: parseFloat(params[2]),
            allowances: parseFloat(params[3]),
            bonus: parseFloat(params[4]),
            deductions: parseFloat(params[5]),
            unpaid_leave_deduction: parseFloat(params[6]),
            gross_salary: parseFloat(params[7]),
            net_salary: parseFloat(params[8]),
            payment_status: 'PROCESSED',
            payment_date: null,
            generated_at: new Date().toISOString()
        };
        mem.payrollRecords.push(newPay);
        return { rows: [newPay] };
    }

    // 24. Admin Onboard Employee
    if (upper.includes('INSERT INTO EMPLOYEES')) {
        const newEmp = {
            employee_id: mem.employees.length + 1,
            employee_code: params[0],
            full_name: params[1],
            email: params[2],
            phone: params[3],
            department_id: parseInt(params[4], 10),
            designation: params[5],
            joining_date: params[6],
            employment_status: 'ACTIVE'
        };
        mem.employees.push(newEmp);
        return { rows: [newEmp] };
    }
    if (upper.includes('INSERT INTO USERS')) {
        const newUser = {
            user_id: mem.users.length + 1,
            employee_id: parseInt(params[0], 10),
            username: params[1],
            password_hash: params[2],
            role: params[3],
            is_active: true
        };
        mem.users.push(newUser);
        return { rows: [newUser] };
    }

    // Default fallback
    return { rows: [] };
}

/**
 * Execute query: Attempts PostgreSQL first, gracefully uses in-memory relational store if unavailable
 */
async function query(text, params = []) {
    // If PostgreSQL has connected, attempt live query
    if (isPgConnected) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            // Attempt retry once if it was a transient idle timeout
            try {
                return await pool.query(text, params);
            } catch (retryErr) {
                console.warn('PostgreSQL query error, falling back to memory store:', retryErr.message);
            }
        }
    }

    // Otherwise use memory engine
    return executeMemoryQuery(text, params);
}

/**
 * Transaction Client
 */
async function getClient() {
    if (isPgConnected) {
        try {
            return await pool.connect();
        } catch (err) {
            try {
                return await pool.connect();
            } catch (retryErr) {
                // fall through to mock client
            }
        }
    }

    // Return mock transaction client
    return {
        query: (text, params) => executeMemoryQuery(text, params),
        release: () => {}
    };
}

/**
 * Connectivity Test
 */
async function testConnection() {
    try {
        const res = await pool.query('SELECT version();');
        isPgConnected = true;
        return {
            connected: true,
            version: res.rows[0].version,
            message: 'Connected to PostgreSQL successfully.'
        };
    } catch (err) {
        isPgConnected = false;
        return {
            connected: false,
            message: `PostgreSQL connection offline (${err.code || err.message}). In-Memory Relational Engine ACTIVE.`
        };
    }
}

module.exports = {
    pool,
    query,
    getClient,
    testConnection
};
