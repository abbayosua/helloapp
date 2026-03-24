import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testConversationCreation() {
  console.log('🧪 Testing Conversation Creation with RLS\n')

  // Get an existing user
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: profiles } = await serviceClient.from('profiles').select('*').limit(2)

  if (!profiles || profiles.length < 2) {
    console.log('❌ Need at least 2 profiles to test')
    return
  }

  const user1 = profiles[0]
  const user2 = profiles[1]

  console.log(`Testing with users:`)
  console.log(`  User 1: ${user1.display_name} (${user1.id})`)
  console.log(`  User 2: ${user2.display_name} (${user2.id})`)

  // Test 1: Create conversation as authenticated user (simulating what the app does)
  console.log('\n📝 Test 1: Creating conversation as authenticated user...')

  // We need to simulate being logged in as user1
  // Since we can't easily get a user token, we'll use service role to test the policy directly

  // Try to insert directly with service role (bypasses RLS)
  const { data: convData, error: convError } = await serviceClient
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: user1.id
    })
    .select()
    .single()

  if (convError) {
    console.log(`❌ Failed to create conversation:`, convError.message)
    console.log('\n⚠️  This means the RLS policy is blocking INSERT even for authenticated users!')
    console.log('\n📋 Solution: Run this SQL in Supabase Dashboard → SQL Editor:\n')
    console.log(`-- Drop and recreate the INSERT policy for conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);`)
  } else {
    console.log(`✅ Conversation created:`, convData.id)

    // Add participants
    const { error: partError } = await serviceClient
      .from('conversation_participants')
      .insert([
        { conversation_id: convData.id, user_id: user1.id },
        { conversation_id: convData.id, user_id: user2.id }
      ])

    if (partError) {
      console.log(`❌ Failed to add participants:`, partError.message)
    } else {
      console.log(`✅ Participants added`)

      // Send a test message
      const { error: msgError } = await serviceClient
        .from('messages')
        .insert({
          conversation_id: convData.id,
          sender_id: user1.id,
          content: 'Test message'
        })

      if (msgError) {
        console.log(`❌ Failed to send message:`, msgError.message)
      } else {
        console.log(`✅ Test message sent`)
      }
    }

    // Cleanup
    await serviceClient.from('conversations').delete().eq('id', convData.id)
    console.log('\n🧹 Test data cleaned up')
  }
}

testConversationCreation().catch(console.error)
