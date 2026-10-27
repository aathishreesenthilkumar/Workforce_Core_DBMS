require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./db');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
    console.log('====================================================');
    console.log(' Employee Attendance, Payroll & Leave Management System');
    console.log(' Technology Stack: PostgreSQL + Node.js + Bootstrap 5');
    console.log('====================================================');

    // Test PostgreSQL database connectivity
    const dbStatus = await testConnection();
    if (dbStatus.connected) {
        console.log('✔ PostgreSQL Database: CONNECTED');
        console.log(`  Engine: ${dbStatus.version.split(' on ')[0]}`);
    } else {
        console.warn('⚠ PostgreSQL Database: NOT CONNECTED');
        console.warn(`  Reason: ${dbStatus.message}`);
        console.warn('  Ensure PostgreSQL service is running on port 5432 and database exists.');
    }

    const server = app.listen(PORT, () => {
        console.log(`✔ Express Server running on: http://localhost:${PORT}`);
        console.log(`✔ Open your browser at:     http://localhost:${PORT}/login.html`);
        console.log('====================================================');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    });
}

startServer();

