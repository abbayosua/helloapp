import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(filePath: string) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`)
  console.log('─'.repeat(50))

  const sql = fs.readFileSync(filePath, 'utf-8')

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let success = 0
  let failed = 0

  for (const statement of statements) {
    if (!statement.trim()) continue

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      // If the RPC doesn't exist, we need to use a different approach
      if (error && error.message.includes('Could not find the function')) {
        console.log('⚠️  exec_sql RPC not found. Using direct query approach...')
        // We can't execute DDL via the JS client directly
        // Need to use the REST API or provide manual instructions
        console.log('\n❌ Cannot execute DDL statements via Supabase JS client.')
        console.log('   You need to run the migrations manually in Supabase Dashboard.')
        return false
      }

      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ⏭️  Already exists, skipping...`)
        } else {
          console.error(`  ❌ Error: ${error.message}`)
          failed++
        }
      } else {
        success++
      }
    } catch (err) {
      console.error(`  ❌ Exception: ${err}`)
      failed++
    }
  }

  console.log(`\n✅ Success: ${success}, ❌ Failed: ${failed}`)
  return failed === 0
}

async function main() {
  console.log('🚀 HelloApp Database Migration')
  console.log('=' .repeat(50))
  console.log(`Supabase URL: ${supabaseUrl}`)

  // Check connection
  const { error: connError } = await supabase.from('profiles').select('id').limit(1)

  if (connError && !connError.message.includes('does not exist')) {
    console.error('❌ Connection failed:', connError.message)
    process.exit(1)
  }

  console.log('✅ Connected to Supabase')

  // Check if tables exist
  const { error: tableCheck } = await supabase.from('profiles').select('id').limit(1)

  if (tableCheck && tableCheck.message.includes('does not exist')) {
    console.log('\n⚠️  Tables do not exist. You need to run migrations manually.')
    console.log('\n📋 Instructions:')
    console.log('1. Go to: https://supabase.com/dashboard/project/rmdckjnnoipgwvqpinpx/sql/new')
    console.log('2. Copy the contents of supabase/migrations/001_initial_schema.sql')
    console.log('3. Paste and click "Run"')
    console.log('4. Then run supabase/migrations/005_fix_conversation_rls.sql')
    process.exit(1)
  }

  console.log('✅ Tables already exist')
}

main().catch(console.error)
