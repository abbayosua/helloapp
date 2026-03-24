import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkPolicies() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('📋 Current RLS Policies on conversations table:\n')

  // Query pg_policies to see what policies exist
  const { data, error } = await supabase.rpc('query_policies')

  if (error) {
    // The RPC doesn't exist, so we need to create it or use a different approach
    console.log('❌ Cannot query policies directly via RPC')
    console.log('\n📋 Run this SQL in Supabase Dashboard to see policies:\n')
    console.log(`SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations';`)
    return
  }

  console.log(data)
}

checkPolicies().catch(console.error)
