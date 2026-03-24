import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRLSInsert() {
  console.log('🧪 Testing RLS INSERT Policy\n')

  // 1. Check current policies via service role
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 2. Get an existing user to test with
  const { data: profiles } = await serviceClient.from('profiles').select('*').limit(1)
  const testUser = profiles?.[0]

  if (!testUser) {
    console.log('❌ No users found in profiles')
    return
  }

  console.log(`Testing with user: ${testUser.display_name} (${testUser.id})`)

  // 3. Create a test user session (simulate being logged in)
  // We need to use the anon key and set the user context

  // First, let's try to insert with service role (bypasses RLS)
  console.log('\n1️⃣ Testing with SERVICE ROLE (should bypass RLS):')
  const { data: serviceConv, error: serviceError } = await serviceClient
    .from('conversations')
    .insert({ type: 'direct', created_by: testUser.id })
    .select()
    .single()

  if (serviceError) {
    console.log('  ❌ Service role failed:', serviceError.message)
  } else {
    console.log('  ✅ Service role works! Created:', serviceConv.id)
    // Clean up
    await serviceClient.from('conversations').delete().eq('id', serviceConv.id)
    console.log('  🧹 Cleaned up')
  }

  // 4. Test with anon key (authenticated user context)
  console.log('\n2️⃣ Testing with ANON KEY (authenticated user):')

  // Sign in as the test user
  const { data: authData, error: authError } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'test@example.com'
  })

  // Create a client with user context
  const anonClient = createClient(supabaseUrl, anonKey)

  // Try to insert as anonymous user (should fail if RLS is working)
  console.log('\n3️⃣ Testing ANONYMOUS user (should fail):')
  const { data: anonConv, error: anonError } = await anonClient
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single()

  if (anonError) {
    console.log('  ✅ RLS working - anonymous blocked:', anonError.message)
  } else {
    console.log('  ❌ RLS NOT working - anonymous could insert!')
    await serviceClient.from('conversations').delete().eq('id', anonConv.id)
  }

  // 5. Check the actual policies in the database
  console.log('\n📋 Checking current RLS policies...')
  console.log('   Run this in Supabase SQL Editor to verify:')
  console.log(`
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, cmd;`)
}

testRLSInsert().catch(console.error)
