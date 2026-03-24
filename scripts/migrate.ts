import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = 'postgresql://postgres.rmdckjnnoipgwvqpinpx:890iop*()IOP@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 Running HelloApp database migration...\n');
  
  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...\n');

    // Execute the entire migration as one transaction
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('📊 Tables created:');
    tables.forEach((t: { table_name: string }) => {
      console.log(`   - ${t.table_name}`);
    });

    // Check RLS is enabled
    const rlsTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true;
    `;

    console.log(`\n🔒 RLS enabled on ${rlsTables.length} tables`);

    console.log('\n✨ Database is ready for HelloApp!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
