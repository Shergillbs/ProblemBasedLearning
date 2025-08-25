const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testServiceRole() {
  console.log('Testing service role bypass...')
  
  try {
    // First create an auth user with service role
    console.log('Creating auth user...')
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'test-service@example.com',
      password: 'testpassword123',
      email_confirm: true,
    })
    
    if (authError) {
      console.error('Auth user creation failed:', authError)
      return
    }
    
    console.log('Auth user created:', authUser.user.id)
    
    // Now try to insert a user profile with service role (should bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: 'test-service@example.com',
        full_name: 'Service Test User',
        role: 'student',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Service role failed (RLS not bypassed):', error)
    } else {
      console.log('Service role success (RLS bypassed):', data)
    }
    
    // Clean up
    await supabaseAdmin.from('user_profiles').delete().eq('id', authUser.user.id)
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    console.log('Cleanup completed')
    
  } catch (e) {
    console.error('Exception:', e)
  }
}

testServiceRole()
