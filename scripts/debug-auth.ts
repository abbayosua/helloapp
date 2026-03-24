import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function debugAuth() {
  console.log('🔍 Debugging Supabase Auth Context\n')

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Get a test user
  const { data: users } = await serviceClient.auth.admin.listUsers()
  const testUser = users.users[0]

  if (!testUser) {
    console.log('❌ No users found')
    return
  }

  console.log('Test user:', testUser.email, testUser.id)

  // 2. Create a test conversation using SERVICE ROLE (bypasses RLS)
  console.log('\n1️⃣ Creating conversation with SERVICE ROLE:')
  const { data: conv1, error: err1 } = await serviceClient
    .from('conversations')
    .insert({ type: 'direct', created_by: testUser.id })
    .select()
    .single()

  if (err1) {
    console.log('  ❌ Failed:', err1.message)
  } else {
    console.log('  ✅ Success! ID:', conv1.id)
    await serviceClient.from('conversations').delete().eq('id', conv1.id)
  }

  // 3. Check if auth.uid() works in SQL context
  console.log('\n2️⃣ Checking auth context in database:')

  // Test if RLS is even being applied
  const { data: rlsCheck, error: rlsError } = await serviceClient
    .rpc('exec_sql', {
      query: "SELECT current_user, session_user, auth.uid() as auth_uid"
    })

  if (rlsError) {
    console.log('  Note: Cannot run SQL RPC, that\'s expected')
  }

  // 4. The REAL test: Use a client that simulates an authenticated session
  console.log('\n3️⃣ Testing with user context simulation:')

  // Get a valid access token for the user
  const { data: session, error: sessionError } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: testUser.email!
  })

  if (sessionError) {
    console.log('  Could not generate link:', sessionError.message)
  } else {
    console.log('  Generated magic link (hashed_token available)')
  }

  // 5. Check what auth.jwt() returns
  console.log('\n4️⃣ Checking if RLS uses auth.uid() correctly:')
  console.log('  The policy shows: with_check = true')
  console.log('  This means ANY authenticated user should be able to insert')
  console.log('  roles = {authenticated}')

  // 6. Check if there are any DENY policies
  console.log('\n5️⃣ Checking for DENY policies:')
  console.log('  Run this in Supabase SQL Editor:')
  console.log(`
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'conversations'
AND permissive = 'RESTRICTIVE';`)

  console.log('\n📋 Summary:')
  console.log('  - The INSERT policy appears correct (PERMISSIVE, authenticated, with_check=true)')
  console.log('  - If it still fails, the issue might be:')
  console.log('    1. The user session is not being recognized as "authenticated"')
  console.log('    2. There might be a RESTRICTIVE policy blocking it')
  console.log('    3. The Supabase SSR client might not be passing the JWT correctly')
}

debugAuth().catch(console.error)
