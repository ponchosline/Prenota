const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Supabase direct connection
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://postgres.epzxbdjahgawyzoiqhpz:${process.env.DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('Connecting to Supabase PostgreSQL...');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('Connected!');

    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
      'utf8'
    );

    console.log('Executing migration...');
    await client.query(sql);
    console.log('Migration completed successfully! All tables created.');

    // Verify tables
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nTables created:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
