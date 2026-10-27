const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const csrfProtection = require('./middleware/csrf');

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');
const payrollRoutes = require('./routes/payroll.routes');
const adminRoutes = require('./routes/admin.routes');
const dbViewerRoutes = require('./routes/db-viewer.routes');

const app = express();

// Security Headers with Helmet (CSP disabled in dev to allow CDNs and inline demo handlers)
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'dbms_employee_management_system_default_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// CSRF Protection
app.use(csrfProtection);

// Serve Frontend Static Assets
app.use(express.static(path.join(__dirname, '../Frontend')));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/db-viewer', dbViewerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'An unexpected internal server error occurred.'
    });
});

module.exports = app;

