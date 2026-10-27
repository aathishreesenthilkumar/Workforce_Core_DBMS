const fs = require('fs');
const path = require('path');
const db = require('../db');

async function seedDatabase() {
    console.log('--- Seeding Sample Dataset into employee_management_db ---');
    try {
        const seedPath = path.join(__dirname, '../../database/sample_data.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Executing sample_data.sql...');
        await db.query(seedSql);
        console.log('✔ Fictional sample records (32 employees, attendance, leaves, payroll) inserted.');

        console.log('✔ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Seeding Failed:', err.message);
        process.exit(1);
    }
}

seedDatabase();

