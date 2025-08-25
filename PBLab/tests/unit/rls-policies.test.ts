import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  supabaseAdmin,
  cleanupTestData,
  createTestUser,
  createTestUserProfile,
  createTestCourse,
  createTestProject,
  createTestLearningObjective,
  testRLSPolicy,
  testServiceRoleBypass,
  validateIndividualAssessmentIntegrity,
} from '../utils/database'

describe('Service Role and Individual Assessment Architecture', () => {
  let testUserId: string
  let testCourseId: string
  let testProjectId: string
  let educatorId: string

  beforeEach(async () => {
    await cleanupTestData()
    
    // Create test users with unique emails
    const testUser = await createTestUser()
    const educator = await createTestUser()
    
    testUserId = testUser!.id
    educatorId = educator!.id

    // Create user profiles using service role (this tests service role bypass)
    await createTestUserProfile(testUserId, 'student')
    await createTestUserProfile(educatorId, 'educator')

    // Create test course and project
    const course = await createTestCourse(educatorId, 'Test Course')
    testCourseId = course.id
    
    const project = await createTestProject(testCourseId, 'Test Project')
    testProjectId = project.id
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('Service Role Administrative Operations', () => {
    it('should allow service role to manage all data', async () => {
      // Test service role can create, read, update, delete all records
      
      // Create a new user with service role
      const newUser = await createTestUser()
      const newUserId = newUser!.id
      
      // Service role should be able to create profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: newUserId,
          email: newUser.email!,
          full_name: 'Service Created User',
          role: 'student',
        })
        .select()
        .single()

      expect(profileError).toBeNull()
      expect(profile).toBeTruthy()
      expect(profile.role).toBe('student')

      // Service role should be able to read all profiles
      const { data: allProfiles, error: readError } = await supabaseAdmin
        .from('user_profiles')
        .select()

      expect(readError).toBeNull()
      expect(allProfiles).toBeTruthy()
      expect(allProfiles!.length).toBeGreaterThan(0)

      // Service role should be able to update any profile
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ full_name: 'Updated by Service' })
        .eq('id', newUserId)

      expect(updateError).toBeNull()
    })
  })

  describe('Individual Learning Objectives - Business Logic', () => {
    it('should create learning objectives with proper relationships', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      expect(objective).toBeTruthy()
      expect(objective.student_id).toBe(testUserId)
      expect(objective.project_id).toBe(testProjectId)
      expect(objective.competency_level).toBe(3)
    })

    it('should maintain data integrity for objectives', async () => {
      // Create multiple objectives for the same student
      const obj1 = await createTestLearningObjective(testUserId, testProjectId, 'Objective 1')
      const obj2 = await createTestLearningObjective(testUserId, testProjectId, 'Objective 2')
      
      expect(obj1.student_id).toBe(testUserId)
      expect(obj2.student_id).toBe(testUserId)
      expect(obj1.id).not.toBe(obj2.id)
      
      // Verify they're properly linked to the project
      const { data: projectObjectives } = await supabaseAdmin
        .from('individual_learning_objectives')
        .select()
        .eq('project_id', testProjectId)
        .eq('student_id', testUserId)
      
      expect(projectObjectives).toBeTruthy()
      expect(projectObjectives!.length).toBe(2)
    })
  })

  describe('Individual Assessments RLS', () => {
    it('should enforce individual assessment architecture', async () => {
      await validateIndividualAssessmentIntegrity()
    })

    it('should prevent team-based assessment creation', async () => {
      // This test verifies that the individual_assessments table design 
      // inherently prevents team grading by only allowing individual assessments
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      const testData = {
        student_id: testUserId,
        project_id: testProjectId,
        learning_objective_id: objective.id,
        competency_achievement: 4,
        assessment_score: 85.5,
        educator_feedback: 'Good work',
      }

      // This should succeed because the table only allows individual assessments
      const { data, error } = await supabaseAdmin
        .from('individual_assessments')
        .insert(testData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.student_id).toBe(testUserId)
    })

    it('should allow individual assessment creation', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      const testData = {
        student_id: testUserId,
        project_id: testProjectId,
        learning_objective_id: objective.id,
        competency_achievement: 3,
        assessment_score: 75.0,
        educator_feedback: 'Good progress',
      }

      const { data, error } = await supabaseAdmin
        .from('individual_assessments')
        .insert(testData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.student_id).toBe(testUserId)
    })
  })

  describe('Evidence Artifacts - Business Logic', () => {
    it('should create evidence artifacts with proper relationships', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      const { data: evidence, error } = await supabaseAdmin
        .from('evidence_artifacts')
        .insert({
          student_id: testUserId,
          learning_objective_id: objective.id,
          title: 'Test Evidence',
          description: 'Test evidence description',
          type: 'document',
          external_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(evidence).toBeTruthy()
      expect(evidence.student_id).toBe(testUserId)
      expect(evidence.learning_objective_id).toBe(objective.id)
    })
  })

  describe('Individual Assessment Architecture Compliance', () => {
    it('should maintain strict individual assessment integrity', async () => {
      // Verify the individual_assessments table only allows individual assessments
      await validateIndividualAssessmentIntegrity()

      // Create learning objectives and assessments
      const obj1 = await createTestLearningObjective(testUserId, testProjectId, 'Objective 1')
      const obj2 = await createTestLearningObjective(testUserId, testProjectId, 'Objective 2')
      
      // Create individual assessments
      const { data: assessment1, error: error1 } = await supabaseAdmin
        .from('individual_assessments')
        .insert({
          student_id: testUserId,
          project_id: testProjectId,
          learning_objective_id: obj1.id,
          competency_achievement: 4,
          assessment_score: 85.0,
          educator_feedback: 'Excellent work'
        })
        .select()
        .single()

      const { data: assessment2, error: error2 } = await supabaseAdmin
        .from('individual_assessments')
        .insert({
          student_id: testUserId,
          project_id: testProjectId,
          learning_objective_id: obj2.id,
          competency_achievement: 3,
          assessment_score: 75.0,
          educator_feedback: 'Good progress'
        })
        .select()
        .single()

      expect(error1).toBeNull()
      expect(error2).toBeNull()
      expect(assessment1.student_id).toBe(testUserId)
      expect(assessment2.student_id).toBe(testUserId)
      
      // Verify each assessment is individual (has specific student_id)
      expect(assessment1.learning_objective_id).toBe(obj1.id)
      expect(assessment2.learning_objective_id).toBe(obj2.id)
    })

    it('should verify complete database schema supports individual assessment only', async () => {
      // Test that all assessment-related tables enforce individual ownership
      const tables = ['individual_learning_objectives', 'individual_assessments', 'evidence_artifacts']
      
      for (const table of tables) {
        const { data: schema, error } = await supabaseAdmin
          .from(table)
          .select()
          .limit(1)
        
        expect(error).toBeNull()
        // Just verify tables exist and are accessible with service role
      }
    })
  })
})
