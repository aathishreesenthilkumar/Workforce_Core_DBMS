-- ============================================================================
-- EMPLOYEE ATTENDANCE, PAYROLL AND LEAVE MANAGEMENT SYSTEM
-- Comprehensive PostgreSQL Query Catalog for Viva & Project Evaluation
-- Database Name: employee_management_db
-- ============================================================================

-- ============================================================================
-- SECTION A: CORE BUSINESS & REPORTING QUERIES (18 QUERIES)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Employee details with department names (INNER JOIN)
-- Explanation: Fetches full employee roster along with their designated department.
-- Concepts: SELECT, INNER JOIN, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    e.email,
    e.designation,
    d.department_name,
    e.joining_date,
    e.employment_status
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
ORDER BY e.employee_code ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Attendance history for a specific employee
-- Explanation: Retrieves chronological check-in and check-out logs for EMP001.
-- Concepts: SELECT, WHERE, Parameterized Filtering, ORDER BY DESC
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    a.attendance_date,
    a.check_in,
    a.check_out,
    a.attendance_status,
    a.remarks
FROM attendance a
JOIN employees e ON a.employee_id = e.employee_id
WHERE e.employee_code = 'EMP001'
ORDER BY a.attendance_date DESC;

-- ----------------------------------------------------------------------------
-- QUERY 3: Daily attendance summary for a given date
-- Explanation: Aggregates total employees, present, absent, and on-leave counts.
-- Concepts: COUNT, FILTER clause, Aggregate functions
-- ----------------------------------------------------------------------------
SELECT 
    attendance_date,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE attendance_status = 'PRESENT') AS present_count,
    COUNT(*) FILTER (WHERE attendance_status = 'ABSENT') AS absent_count,
    COUNT(*) FILTER (WHERE attendance_status = 'HALF_DAY') AS half_day_count,
    COUNT(*) FILTER (WHERE attendance_status = 'ON_LEAVE') AS on_leave_count
FROM attendance
WHERE attendance_date = '2026-10-20'
GROUP BY attendance_date;

-- ----------------------------------------------------------------------------
-- QUERY 4: Employees with NO attendance record for a selected date
-- Explanation: Finds active employees who forgot to punch in or have missing logs.
-- Concepts: LEFT JOIN, IS NULL, Filtering missing records
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    d.department_name,
    e.email
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN attendance a ON e.employee_id = a.employee_id AND a.attendance_date = '2026-10-20'
WHERE e.employment_status = 'ACTIVE' AND a.attendance_id IS NULL
ORDER BY e.employee_code ASC;

-- ----------------------------------------------------------------------------
-- QUERY 5: Monthly attendance statistics per employee
-- Explanation: Calculates days present, days absent, and attendance rate for October.
-- Concepts: DATE_TRUNC, EXTRACT, GROUP BY, Aggregate expressions
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    COUNT(a.attendance_id) AS recorded_days,
    COUNT(*) FILTER (WHERE a.attendance_status = 'PRESENT') AS days_present,
    COUNT(*) FILTER (WHERE a.attendance_status = 'HALF_DAY') AS days_half_day,
    COUNT(*) FILTER (WHERE a.attendance_status = 'ABSENT') AS days_absent,
    ROUND((COUNT(*) FILTER (WHERE a.attendance_status = 'PRESENT')::NUMERIC / 
        NULLIF(COUNT(a.attendance_id), 0)::NUMERIC) * 100, 2) AS attendance_rate_pct
FROM employees e
JOIN attendance a ON e.employee_id = a.employee_id
WHERE a.attendance_date >= '2026-10-01' AND a.attendance_date <= '2026-10-31'
GROUP BY e.employee_code, e.full_name
ORDER BY attendance_rate_pct DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: Pending leave applications for HR review
-- Explanation: Lists all submitted leave requests requiring approval.
-- Concepts: Multi-table JOIN, WHERE clause, ORDER BY ASC
-- ----------------------------------------------------------------------------
SELECT 
    lr.leave_id,
    e.employee_code,
    e.full_name,
    d.department_name,
    lt.leave_type_name,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.applied_at
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.employee_id
JOIN departments d ON e.department_id = d.department_id
JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
WHERE lr.status = 'PENDING'
ORDER BY lr.applied_at ASC;

-- ----------------------------------------------------------------------------
-- QUERY 7: Approved leave requests by employee
-- Explanation: Shows all granted leaves along with reviewer remarks.
-- Concepts: JOIN with self-referencing reviewer relation
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    lt.leave_type_name,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    rev.full_name AS approved_by,
    lr.reviewed_at,
    lr.review_comments
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.employee_id
JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
LEFT JOIN employees rev ON lr.reviewed_by = rev.employee_id
WHERE lr.status = 'APPROVED'
ORDER BY lr.start_date DESC;

-- ----------------------------------------------------------------------------
-- QUERY 8: Employees with remaining leave balances
-- Explanation: Computes remaining balance (allocated - used) for each active employee.
-- Concepts: Arithmetic projection, JOIN, Filter
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    lt.leave_type_name,
    lb.leave_year,
    lb.allocated_days,
    lb.used_days,
    (lb.allocated_days - lb.used_days) AS remaining_days
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.employee_id
JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
WHERE lb.leave_year = 2026 AND (lb.allocated_days - lb.used_days) > 0
ORDER BY e.employee_code, lt.leave_type_name;

-- ----------------------------------------------------------------------------
-- QUERY 9: Monthly payroll details for a given pay month
-- Explanation: Breaks down earnings, deductions, and net payouts for September 2026.
-- Concepts: Monetary formatting, Multiple table join, WHERE
-- ----------------------------------------------------------------------------
SELECT 
    p.payroll_id,
    e.employee_code,
    e.full_name,
    d.department_name,
    p.basic_salary,
    p.allowances,
    p.bonus,
    p.deductions,
    p.unpaid_leave_deduction,
    p.gross_salary,
    p.net_salary,
    p.payment_status
FROM payroll p
JOIN employees e ON p.employee_id = e.employee_id
JOIN departments d ON e.department_id = d.department_id
WHERE p.pay_month = '2026-09-01'
ORDER BY p.net_salary DESC;

-- ----------------------------------------------------------------------------
-- QUERY 10: Total salary expenditure by month
-- Explanation: Aggregates organization-wide salary costs across all processed months.
-- Concepts: SUM, GROUP BY, ORDER BY, Financial summaries
-- ----------------------------------------------------------------------------
SELECT 
    pay_month,
    COUNT(payroll_id) AS total_employees,
    SUM(basic_salary) AS total_basic,
    SUM(allowances) AS total_allowances,
    SUM(bonus) AS total_bonuses,
    SUM(deductions) AS total_standard_deductions,
    SUM(unpaid_leave_deduction) AS total_unpaid_deductions,
    SUM(gross_salary) AS total_gross_cost,
    SUM(net_salary) AS total_net_disbursed
FROM payroll
GROUP BY pay_month
ORDER BY pay_month DESC;

-- ----------------------------------------------------------------------------
-- QUERY 11: Average salary by department
-- Explanation: Calculates the mean base and gross remuneration per department.
-- Concepts: AVG, GROUP BY, ROUND, COALESCE
-- ----------------------------------------------------------------------------
SELECT 
    d.department_name,
    COUNT(e.employee_id) AS active_headcount,
    ROUND(AVG(ss.basic_salary), 2) AS avg_base_salary,
    ROUND(AVG(ss.basic_salary + ss.allowances), 2) AS avg_gross_salary
FROM departments d
JOIN employees e ON d.department_id = e.department_id
JOIN salary_structures ss ON e.employee_id = ss.employee_id
WHERE ss.effective_to IS NULL
GROUP BY d.department_name
ORDER BY avg_gross_salary DESC;

-- ----------------------------------------------------------------------------
-- QUERY 12: Employees earning above the company average (Subquery)
-- Explanation: Identifies top earners whose base salary exceeds company mean.
-- Concepts: Subquery in WHERE, AVG aggregate
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    d.department_name,
    e.designation,
    ss.basic_salary
FROM employees e
JOIN departments d ON e.department_id = d.department_id
JOIN salary_structures ss ON e.employee_id = ss.employee_id
WHERE ss.effective_to IS NULL
  AND ss.basic_salary > (
      SELECT AVG(basic_salary) 
      FROM salary_structures 
      WHERE effective_to IS NULL
  )
ORDER BY ss.basic_salary DESC;

-- ----------------------------------------------------------------------------
-- QUERY 13: Employees who have NEVER applied for leave (Subquery with NOT IN)
-- Explanation: Detects employees with zero leave records.
-- Concepts: Subquery, NOT IN / NOT EXISTS
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    d.department_name,
    e.joining_date
FROM employees e
JOIN departments d ON e.department_id = d.department_id
WHERE e.employee_id NOT IN (
    SELECT DISTINCT employee_id FROM leave_requests
)
ORDER BY e.joining_date ASC;

-- ----------------------------------------------------------------------------
-- QUERY 14: Complete payroll history for a selected employee
-- Explanation: Displays historical payslips for EMP001 across all generated months.
-- Concepts: Chronological audit, parameterized retrieval
-- ----------------------------------------------------------------------------
SELECT 
    p.pay_month,
    p.basic_salary,
    p.allowances,
    p.bonus,
    p.deductions,
    p.unpaid_leave_deduction,
    p.gross_salary,
    p.net_salary,
    p.payment_status,
    p.payment_date
FROM payroll p
JOIN employees e ON p.employee_id = e.employee_id
WHERE e.employee_code = 'EMP001'
ORDER BY p.pay_month DESC;

-- ----------------------------------------------------------------------------
-- QUERY 15: Department-wise employee count with HAVING clause
-- Explanation: Counts active employees and filters departments with >= 5 staff.
-- Concepts: GROUP BY, COUNT, HAVING filter
-- ----------------------------------------------------------------------------
SELECT 
    d.department_name,
    COUNT(e.employee_id) AS total_employees
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'ACTIVE'
GROUP BY d.department_name
HAVING COUNT(e.employee_id) >= 5
ORDER BY total_employees DESC;

-- ----------------------------------------------------------------------------
-- QUERY 16: Leave statistics by leave type
-- Explanation: Summarizes total days requested and approval distribution per type.
-- Concepts: Aggregate sums, CASE/FILTER statements, JOIN
-- ----------------------------------------------------------------------------
SELECT 
    lt.leave_type_name,
    COUNT(lr.leave_id) AS total_applications,
    COALESCE(SUM(lr.total_days), 0) AS total_days_applied,
    COUNT(*) FILTER (WHERE lr.status = 'APPROVED') AS approved_count,
    COUNT(*) FILTER (WHERE lr.status = 'REJECTED') AS rejected_count,
    COUNT(*) FILTER (WHERE lr.status = 'PENDING') AS pending_count
FROM leave_types lt
LEFT JOIN leave_requests lr ON lt.leave_type_id = lr.leave_type_id
GROUP BY lt.leave_type_name
ORDER BY total_applications DESC;

-- ----------------------------------------------------------------------------
-- QUERY 17: Employees with NO payroll record for a selected month
-- Explanation: Identifies employees yet to have payroll generated for Sept 2026.
-- Concepts: LEFT JOIN, IS NULL check for missing payroll
-- ----------------------------------------------------------------------------
SELECT 
    e.employee_code,
    e.full_name,
    d.department_name,
    e.employment_status
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN payroll p ON e.employee_id = p.employee_id AND p.pay_month = '2026-09-01'
WHERE e.employment_status = 'ACTIVE' AND p.payroll_id IS NULL
ORDER BY e.employee_code ASC;

-- ----------------------------------------------------------------------------
-- QUERY 18: Comprehensive report combining employee, department & payroll
-- Explanation: Comprehensive analytical query joining 3 tables with aggregations.
-- Concepts: Multi-table JOIN, Window function / aggregated reporting
-- ----------------------------------------------------------------------------
SELECT 
    d.department_name,
    e.employee_code,
    e.full_name,
    e.designation,
    COALESCE(p.net_salary, 0.00) AS latest_net_salary,
    p.pay_month,
    p.payment_status
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN payroll p ON e.employee_id = p.employee_id AND p.pay_month = '2026-09-01'
WHERE e.employment_status = 'ACTIVE'
ORDER BY d.department_name ASC, latest_net_salary DESC;


-- ============================================================================
-- SECTION B: DDL, DML & TRANSACTION DEMONSTRATIONS (VIVA CONCEPTS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DDL DEMONSTRATION (CREATE, ALTER, DROP in safe sandbox)
-- ----------------------------------------------------------------------------
-- 1. Create temporary audit log table
CREATE TABLE demo_audit_log (
    log_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Alter table to add column
ALTER TABLE demo_audit_log ADD COLUMN remarks VARCHAR(255);

-- 3. Drop table safely
DROP TABLE demo_audit_log;

-- ----------------------------------------------------------------------------
-- DML DEMONSTRATION (INSERT, UPDATE, DELETE)
-- ----------------------------------------------------------------------------
-- 1. Insert a demo department
INSERT INTO departments (department_name, description) 
VALUES ('Research & Innovation', 'Experimental R&D division.');

-- 2. Update description
UPDATE departments 
SET description = 'Advanced Artificial Intelligence and Systems R&D.' 
WHERE department_name = 'Research & Innovation';

-- 3. Delete demo department
DELETE FROM departments 
WHERE department_name = 'Research & Innovation';

-- ----------------------------------------------------------------------------
-- TRANSACTION DEMONSTRATION (ACID - Atomicity, Consistency, Isolation, Durability)
-- Demonstrating how leave approval deducts balance inside a single safe transaction:
-- ----------------------------------------------------------------------------
BEGIN;

-- Step 1: Update leave request status to 'APPROVED'
UPDATE leave_requests
SET status = 'APPROVED',
    reviewed_by = 1,
    reviewed_at = CURRENT_TIMESTAMP,
    review_comments = 'Verified and approved by Administrator.'
WHERE leave_id = 4 AND status = 'PENDING';

-- Step 2: Deduct used days from employee leave balance
UPDATE leave_balances
SET used_days = used_days + (SELECT total_days FROM leave_requests WHERE leave_id = 4)
WHERE employee_id = (SELECT employee_id FROM leave_requests WHERE leave_id = 4)
  AND leave_type_id = (SELECT leave_type_id FROM leave_requests WHERE leave_id = 4)
  AND leave_year = 2026;

-- If any step fails or violates constraint (e.g. used_days > allocated_days), ROLLBACK:
-- ROLLBACK;

-- If all checks succeed, commit atomically:
COMMIT;

