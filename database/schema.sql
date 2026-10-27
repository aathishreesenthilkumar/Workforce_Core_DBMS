-- ============================================================================
-- EMPLOYEE ATTENDANCE, PAYROLL AND LEAVE MANAGEMENT SYSTEM
-- PostgreSQL Relational Database Schema
-- Database Name: employee_management_db
-- ============================================================================

-- NOTE FOR EXECUTION IN PSQL / PGADMIN:
-- In PostgreSQL, CREATE DATABASE cannot run inside a multi-command transaction block.
-- To create the database initially, execute the following command separately in psql:
--   CREATE DATABASE employee_management_db;
-- Then connect to it:
--   \c employee_management_db
-- Or in pgAdmin 4: Right-click 'Databases' -> Create -> Database -> 'employee_management_db'.

-- ----------------------------------------------------------------------------
-- 1. CLEANUP / DROP EXISTING TABLES (In reverse dependency order)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ----------------------------------------------------------------------------
-- 2. TABLE: departments
-- Stores organizational departments within the company.
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. TABLE: employees
-- Core master table storing employee personal, contact, and employment data.
-- ----------------------------------------------------------------------------
CREATE TABLE employees (
    employee_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department_id INT NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    designation VARCHAR(80) NOT NULL,
    joining_date DATE NOT NULL,
    employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TABLE: users
-- Application user credentials, authentication details, and authorization roles.
-- Roles: 'ADMIN', 'MANAGER', 'EMPLOYEE'
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE REFERENCES employees(employee_id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE' 
        CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. TABLE: attendance
-- Daily attendance logs for each employee, tracking check-in, check-out, status.
-- ----------------------------------------------------------------------------
CREATE TABLE attendance (
    attendance_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    attendance_status VARCHAR(20) NOT NULL 
        CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY')),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- ----------------------------------------------------------------------------
-- 6. TABLE: leave_types
-- Catalog of permitted leave categories (e.g. Casual, Sick, Earned, Unpaid).
-- ----------------------------------------------------------------------------
CREATE TABLE leave_types (
    leave_type_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    leave_type_name VARCHAR(50) NOT NULL UNIQUE,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    default_allowance INT NOT NULL DEFAULT 12 CHECK (default_allowance >= 0),
    description TEXT
);

-- ----------------------------------------------------------------------------
-- 7. TABLE: leave_balances
-- Tracks annual leave allocation and consumed days per employee per leave type.
-- ----------------------------------------------------------------------------
CREATE TABLE leave_balances (
    leave_balance_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type_id INT NOT NULL REFERENCES leave_types(leave_type_id) ON DELETE RESTRICT,
    leave_year INT NOT NULL CHECK (leave_year >= 2000),
    allocated_days NUMERIC(4,1) NOT NULL DEFAULT 0.0 CHECK (allocated_days >= 0),
    used_days NUMERIC(4,1) NOT NULL DEFAULT 0.0 CHECK (used_days >= 0),
    CONSTRAINT uq_emp_leave_year UNIQUE (employee_id, leave_type_id, leave_year),
    CONSTRAINT chk_balances_limit CHECK (used_days <= allocated_days OR allocated_days = 0)
);

-- ----------------------------------------------------------------------------
-- 8. TABLE: leave_requests
-- Leave applications submitted by employees, awaiting manager review.
-- ----------------------------------------------------------------------------
CREATE TABLE leave_requests (
    leave_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type_id INT NOT NULL REFERENCES leave_types(leave_type_id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT REFERENCES employees(employee_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- ----------------------------------------------------------------------------
-- 9. TABLE: salary_structures
-- Employee remuneration configuration defining monthly base salary & allowances.
-- ----------------------------------------------------------------------------
CREATE TABLE salary_structures (
    salary_structure_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    basic_salary NUMERIC(12,2) NOT NULL CHECK (basic_salary >= 0),
    allowances NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (allowances >= 0),
    standard_deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (standard_deductions >= 0),
    effective_from DATE NOT NULL,
    effective_to DATE,
    CONSTRAINT chk_salary_effective_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- ----------------------------------------------------------------------------
-- 10. TABLE: payroll
-- Monthly generated payslips preserving immutable historical financial snapshots.
-- Gross Salary = Basic Salary + Allowances + Bonus
-- Net Salary = Gross Salary - Deductions - Unpaid Leave Deduction
-- ----------------------------------------------------------------------------
CREATE TABLE payroll (
    payroll_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    pay_month DATE NOT NULL, -- Canonical first day of payroll month (e.g., '2026-09-01')
    basic_salary NUMERIC(12,2) NOT NULL CHECK (basic_salary >= 0),
    allowances NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (allowances >= 0),
    bonus NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (bonus >= 0),
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (deductions >= 0),
    unpaid_leave_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unpaid_leave_deduction >= 0),
    gross_salary NUMERIC(12,2) NOT NULL CHECK (gross_salary >= 0),
    net_salary NUMERIC(12,2) NOT NULL CHECK (net_salary >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (payment_status IN ('PENDING', 'PROCESSED', 'PAID')),
    payment_date DATE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_pay_month UNIQUE (employee_id, pay_month)
);

-- ----------------------------------------------------------------------------
-- 11. INDEXES FOR QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_attendance_emp_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(attendance_status);
CREATE INDEX idx_leave_requests_emp ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payroll_emp_month ON payroll(employee_id, pay_month);
CREATE INDEX idx_payroll_pay_month ON payroll(pay_month);
CREATE INDEX idx_salary_structures_emp ON salary_structures(employee_id);

-- ----------------------------------------------------------------------------
-- 12. AUTOMATIC TIMESTAMP TRIGGER FOR UPDATING `updated_at`
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

