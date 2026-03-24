import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Status\n')

  // Check tables
  const tables = ['profiles', 'conversations', 'conversation_participants', 'messages', 'groups', 'message_status', 'contacts', 'message_reactions', 'group_admins']

  console.log('📊 Tables:')
  for (const table of tables) {
    const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`)
    } else {
      console.log(`  ✅ ${table}: ${count} rows`)
    }
  }

  // Check if RLS is enabled by trying to query as anon user
  console.log('\n🔐 Testing RLS (as anon user):')
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: rlsError } = await anonClient.from('profiles').select('*').limit(1)
  if (rlsError) {
    console.log(`  ⚠️  ${rlsError.message}`)
  } else {
    console.log('  ✅ Profiles readable')
  }

  // Test creating a user and conversation
  console.log('\n🧪 Testing conversation creation flow:')

  // First, check if we can list existing users
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(5)
  if (profileError) {
    console.log('  ❌ Cannot fetch profiles:', profileError.message)
  } else {
    console.log(`  ✅ Found ${profiles?.length || 0} profiles`)
    profiles?.forEach(p => {
      console.log(`     - ${p.display_name || 'No name'} (${p.id})`)
    })
  }

  // Check policies via SQL (if possible)
  console.log('\n📋 RLS Policies check:')
  console.log('  Run this in Supabase SQL Editor to see policies:')
  console.log('  SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = \'public\';')
}

checkDatabase().catch(console.error)
