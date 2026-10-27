-- ============================================================================
-- EMPLOYEE ATTENDANCE, PAYROLL AND LEAVE MANAGEMENT SYSTEM
-- Master Database Reset & Re-seeding Script
-- Database Name: employee_management_db
-- ============================================================================

\echo '---------------------------------------------------'
\echo 'Resetting employee_management_db to fresh state...'
\echo '---------------------------------------------------'

\i schema.sql
\i views.sql
\i sample_data.sql

\echo 'Database successfully reset and re-seeded with demo records!'

