import postgres from 'postgres';

const sql = postgres(process.env.SUPABASE_DATABASE_URL!);

async function runMigration() {
  try {
    console.log('Running migration 005_fix_conversation_rls.sql...');
    
    // Drop the existing policy
    await sql`DROP POLICY IF EXISTS "Users can create conversations" ON conversations`;
    console.log('Dropped old conversations insert policy');
    
    // Create a more permissive policy
    await sql`
      CREATE POLICY "Users can create conversations" ON conversations
      FOR INSERT TO authenticated
      WITH CHECK (true)
    `;
    console.log('Created new conversations insert policy');
    
    // Fix conversation_participants policy
    await sql`DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants`;
    console.log('Dropped old conversation_participants insert policy');
    
    await sql`
      CREATE POLICY "Users can insert conversation participants" ON conversation_participants
      FOR INSERT TO authenticated
      WITH CHECK (true)
    `;
    console.log('Created new conversation_participants insert policy');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
