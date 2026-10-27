const fs = require('fs');
const path = require('path');
const db = require('../db');

async function resetDatabase() {
    console.log('===========================================================');
    console.log(' Rebuilding & Resetting employee_management_db to Sample State');
    console.log('===========================================================');
    try {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const viewsPath = path.join(__dirname, '../../database/views.sql');
        const seedPath = path.join(__dirname, '../../database/sample_data.sql');

        console.log('1. Recreating Tables and Constraints...');
        await db.query(fs.readFileSync(schemaPath, 'utf8'));

        console.log('2. Creating Analytical Views...');
        await db.query(fs.readFileSync(viewsPath, 'utf8'));

        console.log('3. Populating Comprehensive Seed Data...');
        await db.query(fs.readFileSync(seedPath, 'utf8'));

        console.log('✔ Complete Database Re-seed Successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Reset Failed:', err.message);
        process.exit(1);
    }
}

resetDatabase();

