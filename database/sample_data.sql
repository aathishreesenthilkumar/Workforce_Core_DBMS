-- ============================================================================
-- EMPLOYEE ATTENDANCE, PAYROLL AND LEAVE MANAGEMENT SYSTEM
-- PostgreSQL Sample Dataset (Fictional Records for Testing and Demonstration)
-- Database Name: employee_management_db
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INSERT DEPARTMENTS (5 Departments)
-- ----------------------------------------------------------------------------
INSERT INTO departments (department_name, description) VALUES
('Information Technology', 'Software development, infrastructure, database engineering, and security.'),
('Human Resources', 'Talent acquisition, employee welfare, relations, and HR administration.'),
('Finance & Accounts', 'Payroll administration, corporate accounting, audits, and taxation.'),
('Operations & Logistics', 'Day-to-day corporate operations, facilities, and supply coordination.'),
('Marketing & Sales', 'Product marketing, branding, client relations, and business expansion.');

-- ----------------------------------------------------------------------------
-- 2. INSERT EMPLOYEES (32 Fictional Employees)
-- ----------------------------------------------------------------------------
INSERT INTO employees (employee_code, full_name, email, phone, department_id, designation, joining_date, employment_status) VALUES
-- IT Department
('EMP001', 'Alexander Wright', 'alexander.wright@company.org', '9876543210', 1, 'Chief Technology Officer', '2021-01-15', 'ACTIVE'),
('EMP002', 'Brianne Walker', 'brianne.walker@company.org', '9876543211', 1, 'Senior Database Architect', '2021-03-01', 'ACTIVE'),
('EMP003', 'Carlos Mendez', 'carlos.mendez@company.org', '9876543212', 1, 'Lead Full Stack Engineer', '2021-06-20', 'ACTIVE'),
('EMP004', 'Divya Sharma', 'divya.sharma@company.org', '9876543213', 1, 'Senior Backend Engineer', '2022-01-10', 'ACTIVE'),
('EMP005', 'Ethan Hunt', 'ethan.hunt@company.org', '9876543214', 1, 'Cloud DevOps Engineer', '2022-04-15', 'ACTIVE'),
('EMP006', 'Fatima Zahra', 'fatima.zahra@company.org', '9876543215', 1, 'Frontend UI/UX Developer', '2022-08-01', 'ACTIVE'),
('EMP007', 'Gautam Menon', 'gautam.menon@company.org', '9876543216', 1, 'QA Automation Lead', '2023-02-12', 'ACTIVE'),
('EMP008', 'Hannah Abbott', 'hannah.abbott@company.org', '9876543217', 1, 'Junior Software Engineer', '2023-07-01', 'ACTIVE'),

-- Human Resources
('EMP009', 'Isabella Rossi', 'isabella.rossi@company.org', '9876543218', 2, 'Head of Human Resources', '2020-11-01', 'ACTIVE'),
('EMP010', 'James Wilson', 'james.wilson@company.org', '9876543219', 2, 'HR Operations Manager', '2021-05-18', 'ACTIVE'),
('EMP011', 'Kavita Krishnan', 'kavita.krishnan@company.org', '9876543220', 2, 'Talent Acquisition Specialist', '2022-03-01', 'ACTIVE'),
('EMP012', 'Lucas Garcia', 'lucas.garcia@company.org', '9876543221', 2, 'Employee Relations Officer', '2022-09-15', 'ACTIVE'),
('EMP013', 'Meera Nair', 'meera.nair@company.org', '9876543222', 2, 'HR Generalist', '2023-04-10', 'ACTIVE'),
('EMP014', 'Nathan Drake', 'nathan.drake@company.org', '9876543223', 2, 'Recruitment Coordinator', '2023-11-01', 'ACTIVE'),

-- Finance & Accounts
('EMP015', 'Olivia Benson', 'olivia.benson@company.org', '9876543224', 3, 'Chief Financial Officer', '2020-09-01', 'ACTIVE'),
('EMP016', 'Pradeep Kumar', 'pradeep.kumar@company.org', '9876543225', 3, 'Payroll Manager', '2021-02-01', 'ACTIVE'),
('EMP017', 'Quinn Fabray', 'quinn.fabray@company.org', '9876543226', 3, 'Senior Financial Analyst', '2021-10-15', 'ACTIVE'),
('EMP018', 'Rahul Verma', 'rahul.verma@company.org', '9876543227', 3, 'Corporate Tax Accountant', '2022-05-20', 'ACTIVE'),
('EMP019', 'Sophia Loren', 'sophia.loren@company.org', '9876543228', 3, 'Accounts Payable Executive', '2023-01-05', 'ACTIVE'),
('EMP020', 'Thomas Anderson', 'thomas.anderson@company.org', '9876543229', 3, 'Billing & Audit Specialist', '2023-06-15', 'ACTIVE'),

-- Operations & Logistics
('EMP021', 'Uma Thurman', 'uma.thurman@company.org', '9876543230', 4, 'Operations Director', '2021-04-01', 'ACTIVE'),
('EMP022', 'Victor Stone', 'victor.stone@company.org', '9876543231', 4, 'Facilities Lead', '2021-11-10', 'ACTIVE'),
('EMP023', 'Wendy Darling', 'wendy.darling@company.org', '9876543232', 4, 'Supply Chain Coordinator', '2022-06-01', 'ACTIVE'),
('EMP024', 'Xavier Woods', 'xavier.woods@company.org', '9876543233', 4, 'Procurement Analyst', '2023-03-15', 'ACTIVE'),
('EMP025', 'Yash Gupta', 'yash.gupta@company.org', '9876543234', 4, 'Logistics Officer', '2023-09-01', 'ACTIVE'),
('EMP026', 'Zoe Saldana', 'zoe.saldana@company.org', '9876543235', 4, 'Administrative Executive', '2024-01-10', 'ACTIVE'),

-- Marketing & Sales
('EMP027', 'Aarav Patel', 'aarav.patel@company.org', '9876543236', 5, 'VP of Marketing & Sales', '2021-08-01', 'ACTIVE'),
('EMP028', 'Bella Thorne', 'bella.thorne@company.org', '9876543237', 5, 'Brand Strategy Lead', '2022-02-15', 'ACTIVE'),
('EMP029', 'Chetan Bhagat', 'chetan.bhagat@company.org', '9876543238', 5, 'Senior Digital Campaigner', '2022-07-20', 'ACTIVE'),
('EMP030', 'Daisy Ridley', 'daisy.ridley@company.org', '9876543239', 5, 'Client Relationship Manager', '2023-05-01', 'ACTIVE'),
('EMP031', 'Elijah Wood', 'elijah.wood@company.org', '9876543240', 5, 'Content & SEO Strategist', '2023-10-15', 'ACTIVE'),
('EMP032', 'Farhan Akhtar', 'farhan.akhtar@company.org', '9876543241', 5, 'Sales Executive', '2024-02-01', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 3. INSERT USER ACCOUNTS WITH SECURE BCRYPT HASHES
-- Passwords:
-- Admin accounts: 'admin123'
-- Manager accounts: 'manager123'
-- Employee accounts: 'emp123'
-- ----------------------------------------------------------------------------
INSERT INTO users (employee_id, username, password_hash, role, is_active) VALUES
-- System Administrator: Alexander Wright (CTO)
(1, 'admin', '$2a$10$0ftI0SucwvFOaRb36KjYMOiFzbOfyKHN6AhYVTiQMsyKX3BwXEqeC', 'ADMIN', TRUE),
-- Department Managers
(9, 'isabella_hr', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
(10, 'james_hr', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
(15, 'olivia_fin', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
(16, 'pradeep_pay', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
(21, 'uma_ops', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
(27, 'aarav_mkt', '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.', 'MANAGER', TRUE),
-- Staff / Employees
(2, 'brianne_db', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(3, 'carlos_fs', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(4, 'divya_dev', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(5, 'ethan_ops', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(6, 'fatima_ui', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(7, 'gautam_qa', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(8, 'hannah_jr', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(11, 'kavita_hr', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(12, 'lucas_hr', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(13, 'meera_hr', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(14, 'nathan_hr', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(17, 'quinn_fin', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(18, 'rahul_tax', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(19, 'sophia_acc', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(20, 'thomas_fin', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(22, 'victor_fac', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(23, 'wendy_scm', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(24, 'xavier_ops', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(25, 'yash_ops', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(26, 'zoe_ops', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(28, 'bella_brand', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(29, 'chetan_mkt', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(30, 'daisy_sales', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(31, 'elijah_mkt', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE),
(32, 'farhan_mkt', '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je', 'EMPLOYEE', TRUE);

-- ----------------------------------------------------------------------------
-- 4. INSERT LEAVE TYPES
-- ----------------------------------------------------------------------------
INSERT INTO leave_types (leave_type_name, is_paid, default_allowance, description) VALUES
('Casual Leave', TRUE, 12, 'Short-term personal, domestic, or urgent leave.'),
('Sick Leave', TRUE, 10, 'Medical absence supported by recovery/prescription.'),
('Earned Leave', TRUE, 15, 'Annual paid vacation leave accumulated with service.'),
('Unpaid Leave', FALSE, 0, 'Leave without pay (LWP), deducts per-day rate from payroll.');

-- ----------------------------------------------------------------------------
-- 5. INSERT LEAVE BALANCES (Current Year: 2026 for all 32 employees)
-- ----------------------------------------------------------------------------
INSERT INTO leave_balances (employee_id, leave_type_id, leave_year, allocated_days, used_days)
SELECT 
    e.employee_id,
    lt.leave_type_id,
    2026,
    lt.default_allowance,
    CASE 
        WHEN lt.leave_type_name = 'Casual Leave' THEN (e.employee_id % 4)::NUMERIC
        WHEN lt.leave_type_name = 'Sick Leave' THEN (e.employee_id % 3)::NUMERIC
        WHEN lt.leave_type_name = 'Earned Leave' THEN (e.employee_id % 5)::NUMERIC
        ELSE 0.0
    END
FROM employees e
CROSS JOIN leave_types lt;

-- ----------------------------------------------------------------------------
-- 6. INSERT LEAVE REQUESTS
-- ----------------------------------------------------------------------------
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, applied_at, reviewed_by, reviewed_at, review_comments) VALUES
(2, 1, '2026-10-10', '2026-10-11', 2.0, 'Family celebration at home town.', 'APPROVED', '2026-10-05 09:30:00+05:30', 1, '2026-10-06 11:00:00+05:30', 'Approved. Please hand over schema updates.'),
(3, 2, '2026-10-14', '2026-10-15', 2.0, 'Seasonal viral infection and fever.', 'APPROVED', '2026-10-14 08:15:00+05:30', 1, '2026-10-14 10:00:00+05:30', 'Get well soon. Medical certificate acknowledged.'),
(4, 3, '2026-10-20', '2026-10-24', 5.0, 'Annual trekking trip in Himachal.', 'APPROVED', '2026-10-01 14:20:00+05:30', 1, '2026-10-03 16:00:00+05:30', 'Enjoy your vacation.'),
(6, 1, '2026-10-28', '2026-10-29', 2.0, 'Personal errand and passport appointment.', 'PENDING', '2026-10-26 15:45:00+05:30', NULL, NULL, NULL),
(7, 2, '2026-10-27', '2026-10-27', 1.0, 'Severe migraine.', 'PENDING', '2026-10-27 08:30:00+05:30', NULL, NULL, NULL),
(8, 1, '2026-10-18', '2026-10-19', 2.0, 'College convocation ceremony.', 'APPROVED', '2026-10-10 10:00:00+05:30', 1, '2026-10-11 11:30:00+05:30', 'Approved. Congratulations!'),
(11, 4, '2026-09-15', '2026-09-16', 2.0, 'Urgent personal matters outside paid quota.', 'APPROVED', '2026-09-10 12:00:00+05:30', 9, '2026-09-11 14:00:00+05:30', 'Approved with unpaid leave deduction applied to September payroll.'),
(12, 1, '2026-10-29', '2026-10-30', 2.0, 'Attending family wedding.', 'PENDING', '2026-10-25 11:15:00+05:30', NULL, NULL, NULL),
(17, 3, '2026-08-10', '2026-08-14', 5.0, 'Summer vacation.', 'APPROVED', '2026-07-28 17:00:00+05:30', 15, '2026-07-30 09:30:00+05:30', 'Approved by CFO.'),
(18, 1, '2026-10-12', '2026-10-12', 1.0, 'Home maintenance visit.', 'REJECTED', '2026-10-11 18:00:00+05:30', 15, '2026-10-12 08:45:00+05:30', 'Critical tax audit deadline today. Please reschedule.'),
(22, 2, '2026-10-22', '2026-10-23', 2.0, 'Doctor appointment and blood tests.', 'APPROVED', '2026-10-21 16:30:00+05:30', 21, '2026-10-21 17:15:00+05:30', 'Approved.'),
(28, 1, '2026-10-28', '2026-10-28', 1.0, 'Family obligation.', 'PENDING', '2026-10-26 14:00:00+05:30', NULL, NULL, NULL);

-- ----------------------------------------------------------------------------
-- 7. INSERT SALARY STRUCTURES (Current active packages)
-- ----------------------------------------------------------------------------
INSERT INTO salary_structures (employee_id, basic_salary, allowances, standard_deductions, effective_from, effective_to) VALUES
-- Executives / Heads
(1, 120000.00, 35000.00, 12000.00, '2021-01-15', NULL),
(9, 95000.00, 25000.00, 9500.00, '2020-11-01', NULL),
(15, 115000.00, 30000.00, 11500.00, '2020-09-01', NULL),
(21, 90000.00, 22000.00, 9000.00, '2021-04-01', NULL),
(27, 98000.00, 24000.00, 9800.00, '2021-08-01', NULL),

-- Senior Leads & Specialists
(2, 85000.00, 20000.00, 8500.00, '2021-03-01', NULL),
(3, 80000.00, 18000.00, 8000.00, '2021-06-20', NULL),
(4, 75000.00, 16000.00, 7500.00, '2022-01-10', NULL),
(5, 72000.00, 15000.00, 7200.00, '2022-04-15', NULL),
(6, 65000.00, 14000.00, 6500.00, '2022-08-01', NULL),
(7, 68000.00, 15000.00, 6800.00, '2023-02-12', NULL),
(10, 70000.00, 15000.00, 7000.00, '2021-05-18', NULL),
(16, 75000.00, 16000.00, 7500.00, '2021-02-01', NULL),
(17, 68000.00, 14000.00, 6800.00, '2021-10-15', NULL),
(18, 62000.00, 12000.00, 6200.00, '2022-05-20', NULL),
(22, 58000.00, 11000.00, 5800.00, '2021-11-10', NULL),
(28, 65000.00, 13000.00, 6500.00, '2022-02-15', NULL),
(29, 60000.00, 12000.00, 6000.00, '2022-07-20', NULL),

-- Mid & Associate Levels
(8, 42000.00, 9000.00, 4200.00, '2023-07-01', NULL),
(11, 48000.00, 10000.00, 4800.00, '2022-03-01', NULL),
(12, 45000.00, 9500.00, 4500.00, '2022-09-15', NULL),
(13, 44000.00, 9000.00, 4400.00, '2023-04-10', NULL),
(14, 38000.00, 8000.00, 3800.00, '2023-11-01', NULL),
(19, 46000.00, 9500.00, 4600.00, '2023-01-05', NULL),
(20, 44000.00, 9000.00, 4400.00, '2023-06-15', NULL),
(23, 47000.00, 9800.00, 4700.00, '2022-06-01', NULL),
(24, 45000.00, 9200.00, 4500.00, '2023-03-15', NULL),
(25, 42000.00, 8800.00, 4200.00, '2023-09-01', NULL),
(26, 36000.00, 7500.00, 3600.00, '2024-01-10', NULL),
(30, 52000.00, 11000.00, 5200.00, '2023-05-01', NULL),
(31, 46000.00, 9500.00, 4600.00, '2023-10-15', NULL),
(32, 40000.00, 8500.00, 4000.00, '2024-02-01', NULL);

-- ----------------------------------------------------------------------------
-- 8. INSERT ATTENDANCE RECORDS (Past business days in October 2026)
-- Dates: 2026-10-20 to 2026-10-26 (Monday through Friday, plus weekend/holidays)
-- ----------------------------------------------------------------------------
-- 2026-10-20 (Tuesday)
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, attendance_status, remarks) VALUES
(1, '2026-10-20', '09:02:00', '18:15:00', 'PRESENT', 'On time'),
(2, '2026-10-20', '09:14:00', '18:05:00', 'PRESENT', 'On time'),
(3, '2026-10-20', '09:28:00', '18:30:00', 'PRESENT', 'On time'),
(4, '2026-10-20', NULL, NULL, 'ON_LEAVE', 'Approved Earned Leave'),
(5, '2026-10-20', '08:55:00', '17:45:00', 'PRESENT', 'Early check-in'),
(6, '2026-10-20', '09:30:00', '13:30:00', 'HALF_DAY', 'Half-day doctor visit'),
(7, '2026-10-20', '09:10:00', '18:00:00', 'PRESENT', 'On time'),
(8, '2026-10-20', '09:05:00', '18:10:00', 'PRESENT', 'On time'),
(9, '2026-10-20', '08:50:00', '17:50:00', 'PRESENT', 'On time'),
(10, '2026-10-20', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(11, '2026-10-20', '09:12:00', '18:15:00', 'PRESENT', 'On time'),
(12, '2026-10-20', '09:20:00', '18:20:00', 'PRESENT', 'On time'),
(15, '2026-10-20', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(16, '2026-10-20', '09:15:00', '18:10:00', 'PRESENT', 'On time'),
(17, '2026-10-20', '09:08:00', '18:05:00', 'PRESENT', 'On time'),
(21, '2026-10-20', '08:45:00', '17:30:00', 'PRESENT', 'On time'),
(22, '2026-10-20', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(27, '2026-10-20', '09:10:00', '18:15:00', 'PRESENT', 'On time');

-- 2026-10-21 (Wednesday)
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, attendance_status, remarks) VALUES
(1, '2026-10-21', '08:58:00', '18:20:00', 'PRESENT', 'On time'),
(2, '2026-10-21', '09:10:00', '18:10:00', 'PRESENT', 'On time'),
(3, '2026-10-21', '09:15:00', '18:05:00', 'PRESENT', 'On time'),
(4, '2026-10-21', NULL, NULL, 'ON_LEAVE', 'Approved Earned Leave'),
(5, '2026-10-21', '09:01:00', '18:00:00', 'PRESENT', 'On time'),
(6, '2026-10-21', '09:25:00', '18:25:00', 'PRESENT', 'On time'),
(7, '2026-10-21', '09:05:00', '18:10:00', 'PRESENT', 'On time'),
(8, '2026-10-21', '09:12:00', '18:15:00', 'PRESENT', 'On time'),
(9, '2026-10-21', '08:55:00', '17:55:00', 'PRESENT', 'On time'),
(10, '2026-10-21', '09:05:00', '18:05:00', 'PRESENT', 'On time'),
(15, '2026-10-21', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(16, '2026-10-21', '09:10:00', '18:00:00', 'PRESENT', 'On time'),
(21, '2026-10-21', '08:50:00', '17:40:00', 'PRESENT', 'On time'),
(22, '2026-10-21', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(27, '2026-10-21', '09:15:00', '18:30:00', 'PRESENT', 'On time');

-- 2026-10-22 (Thursday)
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, attendance_status, remarks) VALUES
(1, '2026-10-22', '09:05:00', '18:15:00', 'PRESENT', 'On time'),
(2, '2026-10-22', '09:15:00', '18:05:00', 'PRESENT', 'On time'),
(3, '2026-10-22', '09:12:00', '18:00:00', 'PRESENT', 'On time'),
(4, '2026-10-22', NULL, NULL, 'ON_LEAVE', 'Approved Earned Leave'),
(5, '2026-10-22', '08:50:00', '17:55:00', 'PRESENT', 'On time'),
(6, '2026-10-22', '09:30:00', '18:30:00', 'PRESENT', 'On time'),
(7, '2026-10-22', '09:10:00', '18:10:00', 'PRESENT', 'On time'),
(8, '2026-10-22', '09:00:00', '18:00:00', 'PRESENT', 'On time'),
(22, '2026-10-22', NULL, NULL, 'ON_LEAVE', 'Approved Sick Leave'),
(23, '2026-10-22', NULL, NULL, 'ABSENT', 'Unexcused absence');

-- ----------------------------------------------------------------------------
-- 9. INSERT HISTORICAL PAYROLL RECORDS
-- Months: 2026-07-01, 2026-08-01, 2026-09-01
-- Formula: Gross = Basic + Allowances + Bonus
--          Net = Gross - Deductions - Unpaid Leave Deduction
-- ----------------------------------------------------------------------------
-- July 2026 Payroll
INSERT INTO payroll (employee_id, pay_month, basic_salary, allowances, bonus, deductions, unpaid_leave_deduction, gross_salary, net_salary, payment_status, payment_date, generated_at) VALUES
(1, '2026-07-01', 120000.00, 35000.00, 5000.00, 12000.00, 0.00, 160000.00, 148000.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(2, '2026-07-01', 85000.00, 20000.00, 2500.00, 8500.00, 0.00, 107500.00, 99000.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(3, '2026-07-01', 80000.00, 18000.00, 2000.00, 8000.00, 0.00, 100000.00, 92000.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(4, '2026-07-01', 75000.00, 16000.00, 1500.00, 7500.00, 0.00, 92500.00, 85000.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(9, '2026-07-01', 95000.00, 25000.00, 3000.00, 9500.00, 0.00, 123000.00, 113500.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(15, '2026-07-01', 115000.00, 30000.00, 4000.00, 11500.00, 0.00, 149000.00, 137500.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30'),
(16, '2026-07-01', 75000.00, 16000.00, 2000.00, 7500.00, 0.00, 93000.00, 85500.00, 'PAID', '2026-07-31', '2026-07-28 10:00:00+05:30');

-- August 2026 Payroll
INSERT INTO payroll (employee_id, pay_month, basic_salary, allowances, bonus, deductions, unpaid_leave_deduction, gross_salary, net_salary, payment_status, payment_date, generated_at) VALUES
(1, '2026-08-01', 120000.00, 35000.00, 0.00, 12000.00, 0.00, 155000.00, 143000.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30'),
(2, '2026-08-01', 85000.00, 20000.00, 0.00, 8500.00, 0.00, 105000.00, 96500.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30'),
(3, '2026-08-01', 80000.00, 18000.00, 0.00, 8000.00, 0.00, 98000.00, 90000.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30'),
(4, '2026-08-01', 75000.00, 16000.00, 0.00, 7500.00, 0.00, 91000.00, 83500.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30'),
(9, '2026-08-01', 95000.00, 25000.00, 0.00, 9500.00, 0.00, 120000.00, 110500.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30'),
(15, '2026-08-01', 115000.00, 30000.00, 0.00, 11500.00, 0.00, 145000.00, 133500.00, 'PAID', '2026-08-31', '2026-08-28 10:00:00+05:30');

-- September 2026 Payroll (Shows employee 11 with 2 days Unpaid Leave Deduction: 48000 / 30 * 2 = 3200.00)
INSERT INTO payroll (employee_id, pay_month, basic_salary, allowances, bonus, deductions, unpaid_leave_deduction, gross_salary, net_salary, payment_status, payment_date, generated_at) VALUES
(1, '2026-09-01', 120000.00, 35000.00, 0.00, 12000.00, 0.00, 155000.00, 143000.00, 'PAID', '2026-09-30', '2026-09-28 10:00:00+05:30'),
(2, '2026-09-01', 85000.00, 20000.00, 1000.00, 8500.00, 0.00, 106000.00, 97500.00, 'PAID', '2026-09-30', '2026-09-28 10:00:00+05:30'),
(3, '2026-09-01', 80000.00, 18000.00, 1000.00, 8000.00, 0.00, 99000.00, 91000.00, 'PAID', '2026-09-30', '2026-09-28 10:00:00+05:30'),
(4, '2026-09-01', 75000.00, 16000.00, 0.00, 7500.00, 0.00, 91000.00, 83500.00, 'PAID', '2026-09-30', '2026-09-28 10:00:00+05:30'),
(11, '2026-09-01', 48000.00, 10000.00, 0.00, 4800.00, 3200.00, 58000.00, 50000.00, 'PAID', '2026-09-30', '2026-09-28 10:00:00+05:30');

