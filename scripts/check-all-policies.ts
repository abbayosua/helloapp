import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkPolicies() {
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('🔍 Checking ALL policies on conversations table\n')

  // Check if RLS is enabled
  const { data: rlsStatus, error: rlsError } = await client
    .rpc('query', {
      query: `
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname = 'conversations';
      `
    })

  console.log('Run this SQL in Supabase Dashboard to check:')
  console.log(`
-- Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'conversations';

-- Check ALL policies (including RESTRICTIVE)
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'conversations';

-- Check for any RESTRICTIVE policies
SELECT
  policyname,
  permissive
FROM pg_policies
WHERE tablename = 'conversations'
AND permissive = 'RESTRICTIVE';

-- Check what auth.uid() returns
SELECT auth.uid();
`)
}

checkPolicies().catch(console.error)
