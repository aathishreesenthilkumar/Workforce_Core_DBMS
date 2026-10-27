/**
 * In-Memory PostgreSQL-Compatible Fallback Store
 * Pre-seeded with the complete 32-employee dataset from sample_data.sql.
 * Used when PostgreSQL service is not yet running, ensuring 100% application functionality.
 */

const bcrypt = require('bcryptjs');

// 1. Departments
const departments = [
    { department_id: 1, department_name: 'Information Technology', description: 'Software development, infrastructure, database engineering, and security.' },
    { department_id: 2, department_name: 'Human Resources', description: 'Talent acquisition, employee welfare, relations, and HR administration.' },
    { department_id: 3, department_name: 'Finance & Accounts', description: 'Payroll administration, corporate accounting, audits, and taxation.' },
    { department_id: 4, department_name: 'Operations & Logistics', description: 'Day-to-day corporate operations, facilities, and supply coordination.' },
    { department_id: 5, department_name: 'Marketing & Sales', description: 'Product marketing, branding, client relations, and business expansion.' }
];

// 2. Employees (32 Employees)
const employees = [
    { employee_id: 1, employee_code: 'EMP001', full_name: 'Alexander Wright', email: 'alexander.wright@company.org', phone: '9876543210', department_id: 1, designation: 'Chief Technology Officer', joining_date: '2021-01-15', employment_status: 'ACTIVE' },
    { employee_id: 2, employee_code: 'EMP002', full_name: 'Brianne Walker', email: 'brianne.walker@company.org', phone: '9876543211', department_id: 1, designation: 'Senior Database Architect', joining_date: '2021-03-01', employment_status: 'ACTIVE' },
    { employee_id: 3, employee_code: 'EMP003', full_name: 'Carlos Mendez', email: 'carlos.mendez@company.org', phone: '9876543212', department_id: 1, designation: 'Lead Full Stack Engineer', joining_date: '2021-06-20', employment_status: 'ACTIVE' },
    { employee_id: 4, employee_code: 'EMP004', full_name: 'Divya Sharma', email: 'divya.sharma@company.org', phone: '9876543213', department_id: 1, designation: 'Senior Backend Engineer', joining_date: '2022-01-10', employment_status: 'ACTIVE' },
    { employee_id: 5, employee_code: 'EMP005', full_name: 'Ethan Hunt', email: 'ethan.hunt@company.org', phone: '9876543214', department_id: 1, designation: 'Cloud DevOps Engineer', joining_date: '2022-04-15', employment_status: 'ACTIVE' },
    { employee_id: 6, employee_code: 'EMP006', full_name: 'Fatima Zahra', email: 'fatima.zahra@company.org', phone: '9876543215', department_id: 1, designation: 'Frontend UI/UX Developer', joining_date: '2022-08-01', employment_status: 'ACTIVE' },
    { employee_id: 7, employee_code: 'EMP007', full_name: 'Gautam Menon', email: 'gautam.menon@company.org', phone: '9876543216', department_id: 1, designation: 'QA Automation Lead', joining_date: '2023-02-12', employment_status: 'ACTIVE' },
    { employee_id: 8, employee_code: 'EMP008', full_name: 'Hannah Abbott', email: 'hannah.abbott@company.org', phone: '9876543217', department_id: 1, designation: 'Junior Software Engineer', joining_date: '2023-07-01', employment_status: 'ACTIVE' },
    { employee_id: 9, employee_code: 'EMP009', full_name: 'Isabella Rossi', email: 'isabella.rossi@company.org', phone: '9876543218', department_id: 2, designation: 'Head of Human Resources', joining_date: '2020-11-01', employment_status: 'ACTIVE' },
    { employee_id: 10, employee_code: 'EMP010', full_name: 'James Wilson', email: 'james.wilson@company.org', phone: '9876543219', department_id: 2, designation: 'HR Operations Manager', joining_date: '2021-05-18', employment_status: 'ACTIVE' },
    { employee_id: 11, employee_code: 'EMP011', full_name: 'Kavita Krishnan', email: 'kavita.krishnan@company.org', phone: '9876543220', department_id: 2, designation: 'Talent Acquisition Specialist', joining_date: '2022-03-01', employment_status: 'ACTIVE' },
    { employee_id: 12, employee_code: 'EMP012', full_name: 'Lucas Garcia', email: 'lucas.garcia@company.org', phone: '9876543221', department_id: 2, designation: 'Employee Relations Officer', joining_date: '2022-09-15', employment_status: 'ACTIVE' },
    { employee_id: 13, employee_code: 'EMP013', full_name: 'Meera Nair', email: 'meera.nair@company.org', phone: '9876543222', department_id: 2, designation: 'HR Generalist', joining_date: '2023-04-10', employment_status: 'ACTIVE' },
    { employee_id: 14, employee_code: 'EMP014', full_name: 'Nathan Drake', email: 'nathan.drake@company.org', phone: '9876543223', department_id: 2, designation: 'Recruitment Coordinator', joining_date: '2023-11-01', employment_status: 'ACTIVE' },
    { employee_id: 15, employee_code: 'EMP015', full_name: 'Olivia Benson', email: 'olivia.benson@company.org', phone: '9876543224', department_id: 3, designation: 'Chief Financial Officer', joining_date: '2020-09-01', employment_status: 'ACTIVE' },
    { employee_id: 16, employee_code: 'EMP016', full_name: 'Pradeep Kumar', email: 'pradeep.kumar@company.org', phone: '9876543225', department_id: 3, designation: 'Payroll Manager', joining_date: '2021-02-01', employment_status: 'ACTIVE' },
    { employee_id: 17, employee_code: 'EMP017', full_name: 'Quinn Fabray', email: 'quinn.fabray@company.org', phone: '9876543226', department_id: 3, designation: 'Senior Financial Analyst', joining_date: '2021-10-15', employment_status: 'ACTIVE' },
    { employee_id: 18, employee_code: 'EMP018', full_name: 'Rahul Verma', email: 'rahul.verma@company.org', phone: '9876543227', department_id: 3, designation: 'Corporate Tax Accountant', joining_date: '2022-05-20', employment_status: 'ACTIVE' },
    { employee_id: 19, employee_code: 'EMP019', full_name: 'Sophia Loren', email: 'sophia.loren@company.org', phone: '9876543228', department_id: 3, designation: 'Accounts Payable Executive', joining_date: '2023-01-05', employment_status: 'ACTIVE' },
    { employee_id: 20, employee_code: 'EMP020', full_name: 'Thomas Anderson', email: 'thomas.anderson@company.org', phone: '9876543229', department_id: 3, designation: 'Billing & Audit Specialist', joining_date: '2023-06-15', employment_status: 'ACTIVE' },
    { employee_id: 21, employee_code: 'EMP021', full_name: 'Uma Thurman', email: 'uma.thurman@company.org', phone: '9876543230', department_id: 4, designation: 'Operations Director', joining_date: '2021-04-01', employment_status: 'ACTIVE' },
    { employee_id: 22, employee_code: 'EMP022', full_name: 'Victor Stone', email: 'victor.stone@company.org', phone: '9876543231', department_id: 4, designation: 'Facilities Lead', joining_date: '2021-11-10', employment_status: 'ACTIVE' },
    { employee_id: 23, employee_code: 'EMP023', full_name: 'Wendy Darling', email: 'wendy.darling@company.org', phone: '9876543232', department_id: 4, designation: 'Supply Chain Coordinator', joining_date: '2022-06-01', employment_status: 'ACTIVE' },
    { employee_id: 24, employee_code: 'EMP024', full_name: 'Xavier Woods', email: 'xavier.woods@company.org', phone: '9876543233', department_id: 4, designation: 'Procurement Analyst', joining_date: '2023-03-15', employment_status: 'ACTIVE' },
    { employee_id: 25, employee_code: 'EMP025', full_name: 'Yash Gupta', email: 'yash.gupta@company.org', phone: '9876543234', department_id: 4, designation: 'Logistics Officer', joining_date: '2023-09-01', employment_status: 'ACTIVE' },
    { employee_id: 26, employee_code: 'EMP026', full_name: 'Zoe Saldana', email: 'zoe.saldana@company.org', phone: '9876543235', department_id: 4, designation: 'Administrative Executive', joining_date: '2024-01-10', employment_status: 'ACTIVE' },
    { employee_id: 27, employee_code: 'EMP027', full_name: 'Aarav Patel', email: 'aarav.patel@company.org', phone: '9876543236', department_id: 5, designation: 'VP of Marketing & Sales', joining_date: '2021-08-01', employment_status: 'ACTIVE' },
    { employee_id: 28, employee_code: 'EMP028', full_name: 'Bella Thorne', email: 'bella.thorne@company.org', phone: '9876543237', department_id: 5, designation: 'Brand Strategy Lead', joining_date: '2022-02-15', employment_status: 'ACTIVE' },
    { employee_id: 29, employee_code: 'EMP029', full_name: 'Chetan Bhagat', email: 'chetan.bhagat@company.org', phone: '9876543238', department_id: 5, designation: 'Senior Digital Campaigner', joining_date: '2022-07-20', employment_status: 'ACTIVE' },
    { employee_id: 30, employee_code: 'EMP030', full_name: 'Daisy Ridley', email: 'daisy.ridley@company.org', phone: '9876543239', department_id: 5, designation: 'Client Relationship Manager', joining_date: '2023-05-01', employment_status: 'ACTIVE' },
    { employee_id: 31, employee_code: 'EMP031', full_name: 'Elijah Wood', email: 'elijah.wood@company.org', phone: '9876543240', department_id: 5, designation: 'Content & SEO Strategist', joining_date: '2023-10-15', employment_status: 'ACTIVE' },
    { employee_id: 32, employee_code: 'EMP032', full_name: 'Farhan Akhtar', email: 'farhan.akhtar@company.org', phone: '9876543241', department_id: 5, designation: 'Sales Executive', joining_date: '2024-02-01', employment_status: 'ACTIVE' }
];

// 3. Users with password hashes
const adminHash = '$2a$10$0ftI0SucwvFOaRb36KjYMOiFzbOfyKHN6AhYVTiQMsyKX3BwXEqeC'; // admin123
const managerHash = '$2a$10$t/boJJLgs4afRJ9.nXc3feEskqelJ6rePfRrde7.92oXkX.Ww4PK.'; // manager123
const empHash = '$2a$10$kXvAYhr55fHzhcbTGggeveWtOQokmI9s4dBMSb0hMJ.AKc1dL56Je'; // emp123

const users = [
    { user_id: 1, employee_id: 1, username: 'admin', password_hash: adminHash, role: 'ADMIN', is_active: true },
    { user_id: 2, employee_id: 9, username: 'isabella_hr', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 3, employee_id: 10, username: 'james_hr', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 4, employee_id: 15, username: 'olivia_fin', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 5, employee_id: 16, username: 'pradeep_pay', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 6, employee_id: 21, username: 'uma_ops', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 7, employee_id: 27, username: 'aarav_mkt', password_hash: managerHash, role: 'MANAGER', is_active: true },
    { user_id: 8, employee_id: 2, username: 'brianne_db', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 9, employee_id: 3, username: 'carlos_fs', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 10, employee_id: 4, username: 'divya_dev', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 11, employee_id: 5, username: 'ethan_ops', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 12, employee_id: 6, username: 'fatima_ui', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 13, employee_id: 7, username: 'gautam_qa', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 14, employee_id: 8, username: 'hannah_jr', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 15, employee_id: 11, username: 'kavita_hr', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 16, employee_id: 12, username: 'lucas_hr', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 17, employee_id: 13, username: 'meera_hr', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 18, employee_id: 14, username: 'nathan_hr', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 19, employee_id: 17, username: 'quinn_fin', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 20, employee_id: 18, username: 'rahul_tax', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 21, employee_id: 19, username: 'sophia_acc', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 22, employee_id: 20, username: 'thomas_fin', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 23, employee_id: 22, username: 'victor_fac', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 24, employee_id: 23, username: 'wendy_scm', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 25, employee_id: 24, username: 'xavier_ops', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 26, employee_id: 25, username: 'yash_ops', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 27, employee_id: 26, username: 'zoe_ops', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 28, employee_id: 28, username: 'bella_brand', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 29, employee_id: 29, username: 'chetan_mkt', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 30, employee_id: 30, username: 'daisy_sales', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 31, employee_id: 31, username: 'elijah_mkt', password_hash: empHash, role: 'EMPLOYEE', is_active: true },
    { user_id: 32, employee_id: 32, username: 'farhan_mkt', password_hash: empHash, role: 'EMPLOYEE', is_active: true }
];

// 4. Leave Types
const leaveTypes = [
    { leave_type_id: 1, leave_type_name: 'Casual Leave', is_paid: true, default_allowance: 12, description: 'Short-term personal or domestic leave.' },
    { leave_type_id: 2, leave_type_name: 'Sick Leave', is_paid: true, default_allowance: 10, description: 'Medical absence.' },
    { leave_type_id: 3, leave_type_name: 'Earned Leave', is_paid: true, default_allowance: 15, description: 'Annual paid vacation.' },
    { leave_type_id: 4, leave_type_name: 'Unpaid Leave', is_paid: false, default_allowance: 0, description: 'Leave without pay (LWP).' }
];

// 5. Leave Balances for 2026
let leaveBalances = [];
let balanceIdSeq = 1;
employees.forEach(emp => {
    leaveTypes.forEach(lt => {
        let used = 0;
        if (lt.leave_type_name === 'Casual Leave') used = emp.employee_id % 4;
        if (lt.leave_type_name === 'Sick Leave') used = emp.employee_id % 3;
        if (lt.leave_type_name === 'Earned Leave') used = emp.employee_id % 5;
        leaveBalances.push({
            leave_balance_id: balanceIdSeq++,
            employee_id: emp.employee_id,
            leave_type_id: lt.leave_type_id,
            leave_year: 2026,
            allocated_days: lt.default_allowance,
            used_days: used
        });
    });
});

// 6. Leave Requests
let leaveRequests = [
    { leave_id: 1, employee_id: 2, leave_type_id: 1, start_date: '2026-10-10', end_date: '2026-10-11', total_days: 2.0, reason: 'Family celebration at home town.', status: 'APPROVED', applied_at: '2026-10-05 09:30:00', reviewed_by: 1, reviewed_at: '2026-10-06 11:00:00', review_comments: 'Approved. Please hand over schema updates.' },
    { leave_id: 2, employee_id: 3, leave_type_id: 2, start_date: '2026-10-14', end_date: '2026-10-15', total_days: 2.0, reason: 'Seasonal viral infection and fever.', status: 'APPROVED', applied_at: '2026-10-14 08:15:00', reviewed_by: 1, reviewed_at: '2026-10-14 10:00:00', review_comments: 'Get well soon.' },
    { leave_id: 3, employee_id: 4, leave_type_id: 3, start_date: '2026-10-20', end_date: '2026-10-24', total_days: 5.0, reason: 'Annual trekking trip in Himachal.', status: 'APPROVED', applied_at: '2026-10-01 14:20:00', reviewed_by: 1, reviewed_at: '2026-10-03 16:00:00', review_comments: 'Enjoy your vacation.' },
    { leave_id: 4, employee_id: 6, leave_type_id: 1, start_date: '2026-10-28', end_date: '2026-10-29', total_days: 2.0, reason: 'Personal errand and passport appointment.', status: 'PENDING', applied_at: '2026-10-26 15:45:00', reviewed_by: null, reviewed_at: null, review_comments: null },
    { leave_id: 5, employee_id: 7, leave_type_id: 2, start_date: '2026-10-27', end_date: '2026-10-27', total_days: 1.0, reason: 'Severe migraine.', status: 'PENDING', applied_at: '2026-10-27 08:30:00', reviewed_by: null, reviewed_at: null, review_comments: null },
    { leave_id: 6, employee_id: 8, leave_type_id: 1, start_date: '2026-10-18', end_date: '2026-10-19', total_days: 2.0, reason: 'College convocation ceremony.', status: 'APPROVED', applied_at: '2026-10-10 10:00:00', reviewed_by: 1, reviewed_at: '2026-10-11 11:30:00', review_comments: 'Congratulations!' },
    { leave_id: 7, employee_id: 11, leave_type_id: 4, start_date: '2026-09-15', end_date: '2026-09-16', total_days: 2.0, reason: 'Urgent personal matters outside paid quota.', status: 'APPROVED', applied_at: '2026-09-10 12:00:00', reviewed_by: 9, reviewed_at: '2026-09-11 14:00:00', review_comments: 'Approved with unpaid leave deduction.' },
    { leave_id: 8, employee_id: 12, leave_type_id: 1, start_date: '2026-10-29', end_date: '2026-10-30', total_days: 2.0, reason: 'Attending family wedding.', status: 'PENDING', applied_at: '2026-10-25 11:15:00', reviewed_by: null, reviewed_at: null, review_comments: null },
    { leave_id: 9, employee_id: 18, leave_type_id: 1, start_date: '2026-10-12', end_date: '2026-10-12', total_days: 1.0, reason: 'Home maintenance visit.', status: 'REJECTED', applied_at: '2026-10-11 18:00:00', reviewed_by: 15, reviewed_at: '2026-10-12 08:45:00', review_comments: 'Critical audit deadline today. Please reschedule.' }
];

// 7. Salary Structures
const salaryStructures = [
    { salary_structure_id: 1, employee_id: 1, basic_salary: 120000.00, allowances: 35000.00, standard_deductions: 12000.00, effective_from: '2021-01-15', effective_to: null },
    { salary_structure_id: 2, employee_id: 2, basic_salary: 85000.00, allowances: 20000.00, standard_deductions: 8500.00, effective_from: '2021-03-01', effective_to: null },
    { salary_structure_id: 3, employee_id: 3, basic_salary: 80000.00, allowances: 18000.00, standard_deductions: 8000.00, effective_from: '2021-06-20', effective_to: null },
    { salary_structure_id: 4, employee_id: 4, basic_salary: 75000.00, allowances: 16000.00, standard_deductions: 7500.00, effective_from: '2022-01-10', effective_to: null },
    { salary_structure_id: 5, employee_id: 5, basic_salary: 72000.00, allowances: 15000.00, standard_deductions: 7200.00, effective_from: '2022-04-15', effective_to: null },
    { salary_structure_id: 6, employee_id: 6, basic_salary: 65000.00, allowances: 14000.00, standard_deductions: 6500.00, effective_from: '2022-08-01', effective_to: null },
    { salary_structure_id: 7, employee_id: 7, basic_salary: 68000.00, allowances: 15000.00, standard_deductions: 6800.00, effective_from: '2023-02-12', effective_to: null },
    { salary_structure_id: 8, employee_id: 8, basic_salary: 42000.00, allowances: 9000.00, standard_deductions: 4200.00, effective_from: '2023-07-01', effective_to: null },
    { salary_structure_id: 9, employee_id: 9, basic_salary: 95000.00, allowances: 25000.00, standard_deductions: 9500.00, effective_from: '2020-11-01', effective_to: null },
    { salary_structure_id: 10, employee_id: 10, basic_salary: 70000.00, allowances: 15000.00, standard_deductions: 7000.00, effective_from: '2021-05-18', effective_to: null },
    { salary_structure_id: 11, employee_id: 11, basic_salary: 48000.00, allowances: 10000.00, standard_deductions: 4800.00, effective_from: '2022-03-01', effective_to: null },
    { salary_structure_id: 12, employee_id: 12, basic_salary: 45000.00, allowances: 9500.00, standard_deductions: 4500.00, effective_from: '2022-09-15', effective_to: null },
    { salary_structure_id: 15, employee_id: 15, basic_salary: 115000.00, allowances: 30000.00, standard_deductions: 11500.00, effective_from: '2020-09-01', effective_to: null },
    { salary_structure_id: 16, employee_id: 16, basic_salary: 75000.00, allowances: 16000.00, standard_deductions: 7500.00, effective_from: '2021-02-01', effective_to: null },
    { salary_structure_id: 21, employee_id: 21, basic_salary: 90000.00, allowances: 22000.00, standard_deductions: 9000.00, effective_from: '2021-04-01', effective_to: null },
    { salary_structure_id: 27, employee_id: 27, basic_salary: 98000.00, allowances: 24000.00, standard_deductions: 9800.00, effective_from: '2021-08-01', effective_to: null }
];

// Add default salary structures for remaining employees
employees.forEach(emp => {
    if (!salaryStructures.find(s => s.employee_id === emp.employee_id)) {
        salaryStructures.push({
            salary_structure_id: salaryStructures.length + 1,
            employee_id: emp.employee_id,
            basic_salary: 45000.00,
            allowances: 9000.00,
            standard_deductions: 4500.00,
            effective_from: emp.joining_date,
            effective_to: null
        });
    }
});

// 8. Attendance Records
let attendanceLogs = [
    { attendance_id: 1, employee_id: 1, attendance_date: '2026-10-20', check_in: '09:02:00', check_out: '18:15:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 2, employee_id: 2, attendance_date: '2026-10-20', check_in: '09:14:00', check_out: '18:05:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 3, employee_id: 3, attendance_date: '2026-10-20', check_in: '09:28:00', check_out: '18:30:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 4, employee_id: 4, attendance_date: '2026-10-20', check_in: null, check_out: null, attendance_status: 'ON_LEAVE', remarks: 'Approved Earned Leave' },
    { attendance_id: 5, employee_id: 5, attendance_date: '2026-10-20', check_in: '08:55:00', check_out: '17:45:00', attendance_status: 'PRESENT', remarks: 'Early check-in' },
    { attendance_id: 6, employee_id: 6, attendance_date: '2026-10-20', check_in: '09:30:00', check_out: '13:30:00', attendance_status: 'HALF_DAY', remarks: 'Half-day doctor visit' },
    { attendance_id: 7, employee_id: 7, attendance_date: '2026-10-20', check_in: '09:10:00', check_out: '18:00:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 8, employee_id: 8, attendance_date: '2026-10-20', check_in: '09:05:00', check_out: '18:10:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 9, employee_id: 2, attendance_date: '2026-10-21', check_in: '09:10:00', check_out: '18:10:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 10, employee_id: 2, attendance_date: '2026-10-22', check_in: '09:15:00', check_out: '18:05:00', attendance_status: 'PRESENT', remarks: 'On time' },
    { attendance_id: 11, employee_id: 2, attendance_date: '2026-10-23', check_in: '09:00:00', check_out: '18:00:00', attendance_status: 'PRESENT', remarks: 'On time' }
];

// 9. Payroll Records
let payrollRecords = [
    { payroll_id: 1, employee_id: 1, pay_month: '2026-07-01', basic_salary: 120000.00, allowances: 35000.00, bonus: 5000.00, deductions: 12000.00, unpaid_leave_deduction: 0.00, gross_salary: 160000.00, net_salary: 148000.00, payment_status: 'PAID', payment_date: '2026-07-31', generated_at: '2026-07-28' },
    { payroll_id: 2, employee_id: 2, pay_month: '2026-07-01', basic_salary: 85000.00, allowances: 20000.00, bonus: 2500.00, deductions: 8500.00, unpaid_leave_deduction: 0.00, gross_salary: 107500.00, net_salary: 99000.00, payment_status: 'PAID', payment_date: '2026-07-31', generated_at: '2026-07-28' },
    { payroll_id: 3, employee_id: 1, pay_month: '2026-08-01', basic_salary: 120000.00, allowances: 35000.00, bonus: 0.00, deductions: 12000.00, unpaid_leave_deduction: 0.00, gross_salary: 155000.00, net_salary: 143000.00, payment_status: 'PAID', payment_date: '2026-08-31', generated_at: '2026-08-28' },
    { payroll_id: 4, employee_id: 2, pay_month: '2026-08-01', basic_salary: 85000.00, allowances: 20000.00, bonus: 0.00, deductions: 8500.00, unpaid_leave_deduction: 0.00, gross_salary: 105000.00, net_salary: 96500.00, payment_status: 'PAID', payment_date: '2026-08-31', generated_at: '2026-08-28' },
    { payroll_id: 5, employee_id: 1, pay_month: '2026-09-01', basic_salary: 120000.00, allowances: 35000.00, bonus: 0.00, deductions: 12000.00, unpaid_leave_deduction: 0.00, gross_salary: 155000.00, net_salary: 143000.00, payment_status: 'PAID', payment_date: '2026-09-30', generated_at: '2026-09-28' },
    { payroll_id: 6, employee_id: 2, pay_month: '2026-09-01', basic_salary: 85000.00, allowances: 20000.00, bonus: 1000.00, deductions: 8500.00, unpaid_leave_deduction: 0.00, gross_salary: 106000.00, net_salary: 97500.00, payment_status: 'PAID', payment_date: '2026-09-30', generated_at: '2026-09-28' },
    { payroll_id: 7, employee_id: 11, pay_month: '2026-09-01', basic_salary: 48000.00, allowances: 10000.00, bonus: 0.00, deductions: 4800.00, unpaid_leave_deduction: 3200.00, gross_salary: 58000.00, net_salary: 50000.00, payment_status: 'PAID', payment_date: '2026-09-30', generated_at: '2026-09-28' }
];

module.exports = {
    departments,
    employees,
    users,
    leaveTypes,
    leaveBalances,
    leaveRequests,
    salaryStructures,
    attendanceLogs,
    payrollRecords
};

