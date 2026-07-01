const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function applySchema() {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const statements = schemaSql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            await db.query(statement);
            console.log('Executed:', statement.trim().substring(0, 50) + '...');
        }
        console.log('Schema applied successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to apply schema:', error);
        process.exit(1);
    }
}

applySchema();
