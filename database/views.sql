-- ============================================================================
-- EMPLOYEE ATTENDANCE, PAYROLL AND LEAVE MANAGEMENT SYSTEM
-- PostgreSQL Reporting & Analytical Views
-- Database Name: employee_management_db
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VIEW: v_employee_details
-- Combines employee demographics, department details, and user account status.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_employee_details AS
SELECT 
    e.employee_id,
    e.employee_code,
    e.full_name,
    e.email,
    e.phone,
    d.department_id,
    d.department_name,
    e.designation,
    e.joining_date,
    e.employment_status,
    u.user_id,
    u.username,
    u.role,
    u.is_active AS user_active,
    e.created_at
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN users u ON e.employee_id = u.employee_id;

-- ----------------------------------------------------------------------------
-- 2. VIEW: v_daily_attendance_summary
-- Summarizes overall attendance counts by date.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_attendance_summary AS
SELECT 
    a.attendance_date,
    COUNT(*) AS total_recorded,
    COUNT(*) FILTER (WHERE a.attendance_status = 'PRESENT') AS present_count,
    COUNT(*) FILTER (WHERE a.attendance_status = 'ABSENT') AS absent_count,
    COUNT(*) FILTER (WHERE a.attendance_status = 'HALF_DAY') AS half_day_count,
    COUNT(*) FILTER (WHERE a.attendance_status = 'ON_LEAVE') AS on_leave_count,
    ROUND((COUNT(*) FILTER (WHERE a.attendance_status IN ('PRESENT', 'HALF_DAY'))::NUMERIC / 
        NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2) AS attendance_percentage
FROM attendance a
GROUP BY a.attendance_date;

-- ----------------------------------------------------------------------------
-- 3. VIEW: v_leave_balance_status
-- Calculates remaining leave allowance per employee and leave type.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_leave_balance_status AS
SELECT 
    lb.leave_balance_id,
    e.employee_id,
    e.employee_code,
    e.full_name,
    d.department_name,
    lt.leave_type_id,
    lt.leave_type_name,
    lt.is_paid,
    lb.leave_year,
    lb.allocated_days,
    lb.used_days,
    (lb.allocated_days - lb.used_days) AS remaining_days
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.employee_id
JOIN departments d ON e.department_id = d.department_id
JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id;

-- ----------------------------------------------------------------------------
-- 4. VIEW: v_pending_leave_requests
-- Enriches pending leave applications with applicant and department metadata.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_pending_leave_requests AS
SELECT 
    lr.leave_id,
    lr.employee_id,
    e.employee_code,
    e.full_name,
    e.email,
    d.department_name,
    e.designation,
    lt.leave_type_name,
    lt.is_paid,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.status,
    lr.applied_at
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.employee_id
JOIN departments d ON e.department_id = d.department_id
JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
WHERE lr.status = 'PENDING';

-- ----------------------------------------------------------------------------
-- 5. VIEW: v_monthly_payroll_summary
-- Aggregates monthly company expenditures on salaries, bonuses, and deductions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_monthly_payroll_summary AS
SELECT 
    p.pay_month,
    COUNT(p.payroll_id) AS total_employees_paid,
    SUM(p.basic_salary) AS total_basic_salary,
    SUM(p.allowances) AS total_allowances,
    SUM(p.bonus) AS total_bonus,
    SUM(p.deductions) AS total_deductions,
    SUM(p.unpaid_leave_deduction) AS total_unpaid_deductions,
    SUM(p.gross_salary) AS total_gross_expenditure,
    SUM(p.net_salary) AS total_net_disbursed,
    COUNT(*) FILTER (WHERE p.payment_status = 'PAID') AS paid_count,
    COUNT(*) FILTER (WHERE p.payment_status = 'PENDING') AS pending_count
FROM payroll p
GROUP BY p.pay_month;

-- ----------------------------------------------------------------------------
-- 6. VIEW: v_department_salary_summary
-- Department-wise employee headcount, salary spend, and averages.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_department_salary_summary AS
SELECT 
    d.department_id,
    d.department_name,
    COUNT(DISTINCT e.employee_id) AS employee_count,
    COALESCE(ROUND(AVG(ss.basic_salary), 2), 0.00) AS avg_basic_salary,
    COALESCE(ROUND(AVG(ss.basic_salary + ss.allowances), 2), 0.00) AS avg_gross_salary,
    COALESCE(SUM(ss.basic_salary + ss.allowances), 0.00) AS total_monthly_budget
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id AND e.employment_status = 'ACTIVE'
LEFT JOIN salary_structures ss ON e.employee_id = ss.employee_id AND ss.effective_to IS NULL
GROUP BY d.department_id, d.department_name;

