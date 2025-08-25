import { createClient } from '@supabase/supabase-js'
import { expect } from '@jest/globals'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create service role client for testing (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Create anon client for testing RLS policies
export const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

// Test user factory
export const createTestUser = async (email = 'test@example.com', password = 'testpassword123') => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  
  if (error) throw error
  return data.user
}

// Clean up test data
export const cleanupTestData = async () => {
  // Clean up in reverse dependency order
  await supabaseAdmin.from('individual_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('evidence_artifacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('individual_learning_objectives').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('team_members').delete().neq('team_id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

// Test data factories
export const createTestCourse = async (userId: string, title = 'Test Course') => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      title,
      description: 'Test course description',
      educator_id: userId,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestProject = async (courseId: string, title = 'Test Project') => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      title,
      description: 'Test project description',
      course_id: courseId,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestUserProfile = async (userId: string, role: 'student' | 'educator' = 'student') => {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: userId,
      email: `test-${userId}@example.com`,
      full_name: 'Test User',
      role,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestLearningObjective = async (userId: string, projectId: string, title = 'Test Objective') => {
  const { data, error } = await supabaseAdmin
    .from('individual_learning_objectives')
    .insert({
      student_id: userId,
      project_id: projectId,
      title,
      description: 'Test learning objective description',
      competency_framework: { skills: ['analysis', 'synthesis'] },
      target_proficiency_level: 'intermediate',
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// RLS policy testing helpers
export const testRLSPolicy = async (
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  testData: any,
  userId: string,
  shouldSucceed = true
) => {
  // Create authenticated client for the user
  const { data: userData } = await supabaseAdmin.auth.admin.createUser({
    email: `test-rls-${userId}@example.com`,
    password: 'testpassword123',
    email_confirm: true,
  })

  if (!userData.user) throw new Error('Failed to create test user')

  // Sign in with the user to get a valid session
  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: `test-rls-${userId}@example.com`,
    password: 'testpassword123',
  })

  if (signInError) throw signInError

  let result
  let error

  try {
    switch (operation) {
      case 'select':
        result = await userClient.from(tableName).select()
        break
      case 'insert':
        result = await userClient.from(tableName).insert(testData)
        break
      case 'update':
        result = await userClient.from(tableName).update(testData).eq('id', testData.id)
        break
      case 'delete':
        result = await userClient.from(tableName).delete().eq('id', testData.id)
        break
    }
    error = result.error
  } catch (e) {
    error = e
  }

  if (shouldSucceed) {
    expect(error).toBeNull()
  } else {
    expect(error).toBeTruthy()
  }

  return { result, error }
}

// Assessment integrity validation
export const validateIndividualAssessmentIntegrity = async () => {
  // Verify no team-based assessments exist
  const { data: teamAssessments } = await supabaseAdmin
    .from('individual_assessments')
    .select()
    .eq('graded_entity_type', 'team')

  expect(teamAssessments).toHaveLength(0)

  // Verify all assessments are individual
  const { data: allAssessments } = await supabaseAdmin
    .from('individual_assessments')
    .select()

  allAssessments?.forEach(assessment => {
    expect(assessment.graded_entity_type).toBe('individual')
  })
}
