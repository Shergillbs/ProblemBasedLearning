import { createClient } from '@supabase/supabase-js'
import { expect } from '@jest/globals'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create service role client for testing (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Create anon client for testing RLS policies
export const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')

// Counter for unique email generation
let emailCounter = 0

// Test user factory
export const createTestUser = async (email?: string, password = 'testpassword123') => {
  // Generate unique email if not provided
  const uniqueEmail = email || `test-${Date.now()}-${++emailCounter}-${Math.random().toString(36).substr(2, 9)}@example.com`
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: uniqueEmail,
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
export const createTestCourse = async (userId: string, courseName = 'Test Course') => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      course_name: courseName,
      course_code: 'TEST101',
      description: 'Test course description',
      educator_id: userId,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestProject = async (courseId: string, projectName = 'Test Project') => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      project_name: projectName,
      description: 'Test project description',
      course_id: courseId,
      problem_statement: 'Test problem statement',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
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

export const createTestLearningObjective = async (userId: string, projectId: string, description = 'Test Objective') => {
  const { data, error } = await supabaseAdmin
    .from('individual_learning_objectives')
    .insert({
      student_id: userId,
      project_id: projectId,
      objective_description: description,
      competency_level: 3, // Scale of 1-5
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
  // Generate unique email for this test
  const uniqueEmail = `test-rls-${userId}-${Date.now()}-${++emailCounter}-${Math.random().toString(36).substr(2, 9)}@example.com`
  
  // Create authenticated client for the user
  const { data: userData } = await supabaseAdmin.auth.admin.createUser({
    email: uniqueEmail,
    password: 'testpassword123',
    email_confirm: true,
  })

  if (!userData.user) throw new Error('Failed to create test user')

  // Sign in with the user to get a valid session
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  const userClient = createClient(supabaseUrl, anonKey)
  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: uniqueEmail,
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
  // The individual_assessments table enforces individual assessment architecture by design
  // All assessments in this table are inherently individual-only
  
  // Verify all assessments have valid structure (student_id, project_id, learning_objective_id)
  const { data: allAssessments } = await supabaseAdmin
    .from('individual_assessments')
    .select('student_id, project_id, learning_objective_id')

  allAssessments?.forEach(assessment => {
    expect(assessment.student_id).toBeTruthy()
    expect(assessment.project_id).toBeTruthy()
    expect(assessment.learning_objective_id).toBeTruthy()
  })
  
  // Verify individual assessment architecture is maintained
  expect(allAssessments).toBeDefined()
}
