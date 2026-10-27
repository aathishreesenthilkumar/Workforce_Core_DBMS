const fs = require('fs');
const path = require('path');
const db = require('../db');

async function initDatabase() {
    console.log('--- Initializing PostgreSQL Schema & Views ---');
    try {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const viewsPath = path.join(__dirname, '../../database/views.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const viewsSql = fs.readFileSync(viewsPath, 'utf8');

        console.log('Executing schema.sql...');
        await db.query(schemaSql);
        console.log('✔ Schema tables and indexes created.');

        console.log('Executing views.sql...');
        await db.query(viewsSql);
        console.log('✔ Reporting views created successfully.');

        console.log('✔ Database initialization complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Initialization Failed:', err.message);
        process.exit(1);
    }
}

initDatabase();

