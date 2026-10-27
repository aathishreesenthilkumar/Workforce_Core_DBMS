# ⚡ Workforce Core DBMS

> **An enterprise-grade Employee Attendance, Payroll, and Leave Management System engineered with an ACID-compliant 3NF relational schema, transactional authorization, and a modern, high-contrast dark aesthetic.**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%7C%2018-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Automated Tests](https://img.shields.io/badge/Tests-32%20Passing%20(28%20Assertions)-brightgreen?logo=checkmarx&logoColor=white)](#automated-testing-suite)
[![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20MVC-blueviolet)](#system-architecture)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## 📋 Overview

**Workforce Core DBMS** is a full-stack corporate human resource and database administration platform. Many organizations struggle with fragmented spreadsheets that introduce data redundancy, payroll calculation inaccuracies, race conditions during simultaneous leave applications, and lack of department-level authorization.

This project resolves these challenges through:
1. **Third Normal Form (3NF) Database Design:** A 9-table schema enforced with primary keys, foreign keys with cascading actions, and check constraints to eliminate insertion, update, and deletion anomalies.
2. **Dual-Mode Database Architecture:** Native production support for **PostgreSQL 16 / 18** via connection pooling (`pg.Pool`), paired with a built-in **in-memory JavaScript relational store** (`Backend/memory-db.js`) for zero-configuration developer onboarding and offline evaluation.
3. **Transactional ACID Workflows:** Concurrency control with row-level locking (`SELECT ... FOR UPDATE`) during atomic multi-table leave approvals and payroll disbursements.
4. **Department-Level Authorization:** Multi-tier Role-Based Access Control (RBAC) ensuring Managers can only review leave applications for employees in their own department, while Admins hold organization-wide authority.
5. **Accurate Date-Effective Calculations:** Mathematical date-overlap logic for multi-month unpaid leave deductions, date-effective salary structure resolution, and strict calendar-year quota partitioning.
6. **Modern Portfolio Interface:** Inspired by Marco Madonna's award-winning portfolio, featuring an obsidian canvas (`#050505`), radial dot matrix background, electric violet glowing accents (`#8b5cf6`), and clean typography.
7. **Comprehensive Automated Verification:** 28 distinct test assertions across 4 test suites passing with a 100% pass rate.

---

## 🏛️ System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          Client Browser (User)          │
                       │    8 Modern Responsive Dashboards       │
                       └──────────────────┬──────────────────────┘
                                          │ HTTP / HTTPS (REST API)
                                          ▼
                       ┌─────────────────────────────────────────┐
                       │           Node.js & Express API         │
                       │ ─────────────────────────────────────── │
                       │  • Helmet Security Headers              │
                       │  • CSRF Protection Middleware           │
                       │  • express-session (Role-Based RBAC)    │
                       │  • bcrypt Password Hashing (10 Rounds)  │
                       │  • Centralized Error & Exception Filter │
                       └──────────────────┬──────────────────────┘
                                          │ Parameterized Queries (Safe from SQLi)
                                          ▼
        ┌─────────────────────────────────┴─────────────────────────────────┐
        │                                                                   │
        ▼ (Default / Production)                                            ▼ (Fallback / Offline Demo)
┌─────────────────────────────────────────┐               ┌─────────────────────────────────────┐
│             PostgreSQL 18               │               │   In-Memory Relational Mock Engine  │
│ ─────────────────────────────────────── │               │ ─────────────────────────────────── │
│  • 9 Normalized Tables (3NF Schema)     │               │  • memory-db.js in-memory store     │
│  • 6 Analytical SQL Views               │               │  • Pre-seeded with 32 employees     │
│  • 1 Timestamp Trigger & Function       │               │  • Emulates PostgreSQL query API    │
│  • Row-Level Locking (ACID Control)     │               │  • Zero configuration required      │
└─────────────────────────────────────────┘               └─────────────────────────────────────┘
```

---

## ✨ Key Features & Modules

| Module | Route / File | Description |
| :--- | :--- | :--- |
| **Authentication Portal** | [`login.html`](Frontend/login.html) | Locked single-screen view (`100vh`) with quick-fill demo buttons for Admin, Manager, and Employee roles. |
| **Executive Dashboard** | [`dashboard.html`](Frontend/dashboard.html) | Live organizational KPI metrics: monthly attendance rate, present days, available leaves, and latest net salary. |
| **Attendance Tracker** | [`attendance.html`](Frontend/attendance.html) | Daily punch-in/out logging, real-time work duration calculator, status tags (Present, Late, Half-Day), and monthly overview. |
| **Leave Management** | [`leave.html`](Frontend/leave.html) | Quota usage progress bars (Casual, Sick, Earned), interactive application modal, and approval status tracking. |
| **Payroll Engine** | [`payroll.html`](Frontend/payroll.html) | Automated salary calculation factoring basic pay, allowances, bonuses, and unpaid leave (LWP) deductions with printable payslips. |
| **Employee Directory** | [`employees.html`](Frontend/employees.html) | Searchable personnel directory filterable by department, designation, and status with employee profile dialogs. |
| **Database Inspector** | [`database-viewer.html`](Frontend/database-viewer.html) | Direct browser-based relational ledger showing the active 9 tables, live schema tree, and SQL query execution console. |
| **Admin Console** | [`admin.html`](Frontend/admin.html) | Pending leave approvals queue, batch monthly payroll processor, employee onboarding form, and audit trail ledger. |

---

## 🗄️ Database Design (3NF Relational Schema)

The database schema is defined in [`database/schema.sql`](database/schema.sql) and consists of **9 normalized tables**:

```
                       ┌───────────────┐
                       │  departments  │
                       └───────┬───────┘
                               │ 1:N
                               ▼
                        ┌───────────────┐
                        │   employees   │
                        └───────┬───────┘
                                │
        ┌───────────────┬───────┴───────┬───────────────┬───────────────┐
        │ 1:1           │ 1:N           │ 1:N           │ 1:N           │ 1:N
        ▼               ▼               ▼               ▼               ▼
 ┌─────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐
 │    users    │ │ attendance │ │leave_balances│ │salary_struct.│ │ payroll │
 └─────────────┘ └────────────┘ └──────┬───────┘ └──────────────┘ └─────────┘
                                       │ N:1
                                       ▼
                                ┌──────────────┐
                                │ leave_types  │◄──┐
                                └──────┬───────┘   │ N:1
                                       │ 1:N       │
                                       ▼           │
                                ┌──────────────┐   │
                                │leave_requests├───┘
                                └──────────────┘
```

### Relational Tables Summary

1. **`departments`**: Organizational units (`department_id`, `department_name`, `description`, `created_at`).
2. **`employees`**: Master workforce profiles (`employee_id`, `employee_code`, `full_name`, `email`, `phone`, `department_id`, `designation`, `joining_date`, `employment_status`, `created_at`, `updated_at`).
3. **`users`**: Authentication credentials & permissions (`user_id`, `employee_id`, `username`, `password_hash`, `role` [ADMIN/MANAGER/EMPLOYEE], `is_active`, `last_login`, `created_at`).
4. **`attendance`**: Daily punch logs (`attendance_id`, `employee_id`, `attendance_date`, `check_in`, `check_out`, `attendance_status`, `remarks`, `created_at`).
5. **`leave_types`**: Leave classification rules (`leave_type_id`, `leave_type_name`, `is_paid`, `default_allowance`, `description`).
6. **`leave_balances`**: Annual employee leave quota tracking (`leave_balance_id`, `employee_id`, `leave_type_id`, `leave_year`, `allocated_days`, `used_days`, `updated_at`).
7. **`leave_requests`**: Employee leave petitions (`leave_id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `applied_at`, `reviewed_by`, `reviewed_at`, `review_comments`).
8. **`salary_structures`**: Historical & active compensation structures (`salary_structure_id`, `employee_id`, `basic_salary`, `allowances`, `standard_deductions`, `effective_from`, `effective_to`, `created_at`).
9. **`payroll`**: Generated monthly compensation records (`payroll_id`, `employee_id`, `pay_month`, `basic_salary`, `allowances`, `bonus`, `deductions`, `unpaid_leave_deduction`, `gross_salary`, `net_salary`, `payment_status`, `payment_date`, `generated_at`).

### 6 Analytical Views (defined in `database/views.sql`)
- **`v_employee_details`**: Comprehensive employee overview with department and role.
- **`v_daily_attendance_summary`**: Daily departmental attendance counts and present rates.
- **`v_leave_balance_status`**: Current remaining leave quotas per employee and leave type.
- **`v_pending_leave_requests`**: Queue of pending leave applications with employee details.
- **`v_monthly_payroll_summary`**: Aggregate monthly payroll expenditures.
- **`v_department_salary_summary`**: Departmental headcount and total salary breakdown.

### Triggers & Automation
- **`trg_employees_updated_at`**: Trigger executing `update_timestamp_column()` on `employees` updates.

---

## 🧮 Business Rules & Formulas

### 1. Payroll Calculation Model
$$\text{Gross Salary} = \text{Basic Salary} + \text{Allowances} + \text{Bonus}$$

$$\text{Per-Day Salary Rate} = \frac{\text{Basic Salary}}{30.0}$$

$$\text{Unpaid Leave Deduction} = \text{Per-Day Salary Rate} \times \text{Overlapping Unpaid Leave Days in Month}$$

$$\text{Total Deductions} = \text{Standard Tax / PF} + \text{Unpaid Leave Deduction}$$

$$\text{Net Salary} = \max\left(0, \; \text{Gross Salary} - \text{Total Deductions}\right)$$

### 2. Multi-Month Unpaid Leave Overlap Resolution
When an approved unpaid leave crosses month boundaries (e.g. October 30 to November 2 = 4 days total), the system calculates the exact intersection for each calendar month:
- **October (Month 10):** Overlap is October 30 to October 31 = **2 days**.
- **November (Month 11):** Overlap is November 1 to November 2 = **2 days**.
- **Total Deducted:** 2 + 2 = 4 days (prevents over-deduction).

### 3. Date-Effective Salary Structure Resolution
The payroll engine queries salary structures effective for the targeted payroll month:
$$\text{effective\_from} \le \text{month\_end} \quad \text{AND} \quad (\text{effective\_to IS NULL} \;\lor\; \text{effective\_to} \ge \text{month\_start})$$
Structures are ordered by `effective_from DESC`, ensuring future-dated salary revisions are ignored until their effective month and preventing duplicate employee rows.

### 4. Cross-Year Leave Request Partitioning
Annual leave balances are partitioned on a calendar-year basis (Jan 1 to Dec 31). Leave requests spanning multiple calendar years are rejected with an explicit validation error requiring separate submissions for each year (e.g., Dec 28–Dec 31 against 2026 quota, and Jan 1–Jan 4 against 2027 quota).

### 5. Department-Level Manager Authorization
- **ADMIN:** Organization-wide authority to approve or reject leave requests across any department.
- **MANAGER:** Permitted to approve or reject leave requests **only** for employees within their own department. Cross-department approvals are rejected with `403 Forbidden`.

---

## 🧪 Automated Testing Suite

The project includes an automated test suite executed via the native Node.js test runner (`node --test`), covering **28 distinct test assertions** across 4 test suites (**32 tests reported** including parent suites):

```bash
cd Backend
npm test
```

### Test Case Verification Matrix

| Suite | Test ID | Description | Result |
| :--- | :--- | :--- | :---: |
| **API Integration** | `TC-API-01` | Health check endpoint returns `UP` status | **PASS** |
| | `TC-API-02` | Unauthenticated access to `/api/employees` returns `401 Unauthorized` | **PASS** |
| | `TC-API-03` | Unauthenticated access to `/api/attendance` returns `401 Unauthorized` | **PASS** |
| | `TC-API-04` | Unauthenticated access to `/api/leave` returns `401 Unauthorized` | **PASS** |
| | `TC-API-05` | Unauthenticated access to `/api/payroll` returns `401 Unauthorized` | **PASS** |
| | `TC-API-06` | Login submission with empty payload returns `400 Bad Request` | **PASS** |
| | `TC-API-07` | Static frontend portal assets are delivered with correct MIME types | **PASS** |
| **Leave Validation** | `TC-LEAVE-01` | Calculates calendar days duration inclusively (e.g., Nov 10 to Nov 12 = 3 days) | **PASS** |
| | `TC-LEAVE-02` | Single-day leave correctly calculates as exactly 1.0 day | **PASS** |
| | `TC-LEAVE-03` | Rejects end date prior to start date with validation error | **PASS** |
| | `TC-LEAVE-04` | Accurately detects and blocks insufficient leave balance requests | **PASS** |
| | `TC-LEAVE-05` | Rejects cross-year leave requests spanning multiple calendar years | **PASS** |
| **Payroll Formulas** | `TC-PAY-01` | Accurately calculates gross salary ($80k basic + $18k allowance + $2k bonus = $100k) | **PASS** |
| | `TC-PAY-02` | Computes unpaid leave (LWP) deduction accurately ($60k basic, 3 days = $6k) | **PASS** |
| | `TC-PAY-03` | Computes net salary subtracting standard and unpaid leave deductions | **PASS** |
| | `TC-PAY-04` | Enforces zero floor constraint to prevent negative net salary | **PASS** |
| | `TC-PAY-05` | Accurately computes overlapping unpaid leave across month boundaries | **PASS** |
| | `TC-PAY-06` | Accurately computes overlapping unpaid leave across year boundaries | **PASS** |
| | `TC-PAY-07` | Selects active salary structure by month and ignores future-dated structures | **PASS** |
| **Security & RBAC** | `TC-SEC-01` | Rejects API requests when no active session user exists | **PASS** |
| | `TC-SEC-02` | Rejects Employee role when Admin-only privileges are required | **PASS** |
| | `TC-SEC-03` | Grants access to Admin role on protected administration endpoints | **PASS** |
| | `TC-SEC-04` | Blocks Employee from viewing other employees' confidential salary data | **PASS** |
| | `TC-SEC-05` | Permits Employee to access their own attendance and leave records | **PASS** |
| | `TC-SEC-06` | Permits Department Manager to view departmental employee records | **PASS** |
| | `TC-SEC-07` | Rejects Manager attempting to approve leave for employee in different department | **PASS** |
| | `TC-SEC-08` | Permits Manager to approve leave for employee in their own department | **PASS** |
| | `TC-SEC-09` | Permits Admin to approve leave for employee in any department | **PASS** |

**Summary: 32 Passed, 0 Failed, 0 Skipped (100% Pass Rate)**

To generate an experimental code coverage report:
```bash
npm run test:coverage
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x)
- **Git**
- *(Optional)* **PostgreSQL** (16 or 18) & **pgAdmin 4** (if running against live database)

### 1. Clone the Repository
```bash
git clone https://github.com/aathishreesenthilkumar/Workforce_Core_DBMS.git
cd Workforce_Core_DBMS
```

### 2. Install Backend Dependencies
```bash
cd Backend
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your settings in `.env`:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL Connection String (Optional: in-memory mock engine activates automatically if offline)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/employee_management_db

# Session Secret Key
SESSION_SECRET=dbms_employee_payroll_secure_session_secret_key_2026
```

### 4. Run the Automated Tests
```bash
npm test
```

### 5. Launch the Server
```bash
npm start
```
The server will start on: **`http://localhost:3000`**  
Open your browser and navigate to: **`http://localhost:3000/login.html`**

---

## 🐘 PostgreSQL & pgAdmin Setup (Production Mode)

To run against a local PostgreSQL server with pgAdmin 4:

1. Open **pgAdmin 4** and connect to your PostgreSQL instance.
2. Right-click **Databases** $\to$ **Create** $\to$ **Database...**
3. Set the database name to: **`employee_management_db`** and click **Save**.
4. Right-click `employee_management_db` and select **Query Tool**.
5. Open the master SQL setup script located at:
   ```
   database/SETUP_PGADMIN_DATABASE.sql
   ```
6. Click **Execute / Run (F5)**.
7. This master script sets up:
   - All 9 normalized tables with primary, foreign, unique, and check constraints
   - 6 analytical SQL views
   - 1 timestamp trigger function and trigger
   - Seed data for 5 departments, 32 employees, attendance logs, leave balances, salary structures, and sample payroll runs

---

## 🔑 Demo Login Credentials

The system provides three pre-configured accounts with demo quick-fill buttons on the login portal:

| Role | Username / Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@company.com` | `admin123` | Full access: leave approval, batch payroll disbursal, employee management, and database ledger inspection. |
| **Department Manager** | `manager@company.com` | `manager123` | Departmental access: team attendance tracking, employee directory, departmental leave approvals. |
| **Staff Employee** | `employee@company.com` | `emp123` | Personal self-service: punch-in/out, leave application, personal attendance history, monthly payslips. |

---

## 📡 REST API Reference

| Method | Endpoint | Access Tier | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues session cookie |
| `POST` | `/api/auth/logout` | Authenticated | Destroys session and revokes access |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated session user |
| `GET` | `/api/employees` | Manager / Admin | Retrieves employee records with department filters |
| `GET` | `/api/employees/:id` | Employee (Self) / Admin | Retrieves detailed employee profile |
| `POST` | `/api/attendance/punch` | Employee / Admin | Records timestamped punch-in or punch-out |
| `GET` | `/api/attendance` | Authenticated | Retrieves attendance records for current user or team |
| `POST` | `/api/leave/apply` | Authenticated | Submits new leave petition with inclusive date validation |
| `GET` | `/api/leave` | Authenticated | Retrieves leave request ledger and quota balances |
| `PATCH`| `/api/leave/:id/approve`| Admin / Dept Manager| Transactional approval with row-level lock & dept check |
| `PATCH`| `/api/leave/:id/reject` | Admin / Dept Manager| Transactional rejection with row-level lock & dept check |
| `GET` | `/api/payroll` | Authenticated | Retrieves monthly payroll history and payslip data |
| `POST` | `/api/payroll/generate`| Admin | Executes atomic batch payroll calculation engine |
| `GET` | `/api/db-viewer/tables` | Admin | Schema explorer listing active database tables |
| `POST` | `/api/db-viewer/query` | Admin | Executes raw read-only SQL queries from browser console |
| `GET` | `/api/health` | Public | System health check and uptime probe |

---

## 📂 Project Structure

```
Workforce_Core_DBMS/
├── Backend/
│   ├── middleware/              # Security, CSRF, and RBAC authorization guards
│   │   ├── auth.js
│   │   └── csrf.js
│   ├── routes/                  # Express REST API route definitions
│   │   ├── admin.routes.js
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── db-viewer.routes.js
│   │   ├── employee.routes.js
│   │   ├── leave.routes.js
│   │   └── payroll.routes.js
│   ├── scripts/                 # Database initialization and seed CLI scripts
│   ├── services/                # Core business logic (Payroll, Leave, Attendance)
│   ├── tests/                   # Automated unit & integration tests (28 assertions)
│   │   ├── api.integration.test.js
│   │   ├── leave.unit.test.js
│   │   ├── payroll.unit.test.js
│   │   └── security.test.js
│   ├── app.js                   # Express application setup and middleware chain
│   ├── db.js                    # Dual-mode PostgreSQL connection pool manager
│   ├── memory-db.js             # High-fidelity in-memory mock relational engine
│   ├── server.js                # Application entry point (HTTP listener)
│   ├── package.json             # NPM package manifest
│   ├── package-lock.json        # Deterministic dependency tree
│   └── .env.example             # Template for environment configuration
├── Frontend/
│   ├── css/
│   │   └── style.css            # Dark obsidian styling with electric violet tokens
│   ├── js/
│   │   └── app.js               # Client-side state manager and API bridge
│   ├── admin.html               # Administrative operations and leave approvals
│   ├── attendance.html          # Time logging and punch-in terminal
│   ├── dashboard.html           # Main metric cards and KPI counters
│   ├── database-viewer.html     # Real-time database inspector & query console
│   ├── employees.html           # Searchable corporate directory
│   ├── index.html               # Gateway redirector to login
│   ├── leave.html               # Leave quota tracking and application modal
│   ├── login.html               # Locked single-screen authentication portal
│   └── payroll.html             # Salary history ledger and printable payslip
├── database/
│   ├── SETUP_PGADMIN_DATABASE.sql # All-in-one master setup script for PostgreSQL
│   ├── schema.sql               # Normalized 3NF DDL definitions (9 tables)
│   ├── sample_data.sql          # Realistic seed data (32 employees across 5 depts)
│   ├── views.sql                # 6 analytical SQL views
│   ├── queries.sql              # Complex joins, aggregations, and subqueries
│   └── reset_demo.sql           # Database reset script
├── .gitignore                   # Excludes node_modules, .env, and local temp files
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

## 👤 Author

**RS Aathishree**  
- **GitHub:** [@aathishreesenthilkumar](https://github.com/aathishreesenthilkumar)  
- **Certification:** Oracle AI Database Certified Foundations Associate (`1Z0-1195-26`) | Verification ID: `102656685OCI26DCFA`  
- **Program:** B.Tech Computer Science and Engineering  
- **Institution:** Karunya Institute of Technology and Sciences  

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use and adapt it for learning and corporate workforce projects.
