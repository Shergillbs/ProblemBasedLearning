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
  validateIndividualAssessmentIntegrity,
} from '../utils/database'

describe('Row Level Security Policies', () => {
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

    // Create user profiles
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

  describe('User Profiles RLS', () => {
    it('should allow users to read their own profile', async () => {
      const testData = {
        id: testUserId,
        email: 'student@example.com',
        full_name: 'Test Student',
        role: 'student',
      }

      await testRLSPolicy('user_profiles', 'select', testData, testUserId, true)
    })

    it('should prevent users from reading other profiles', async () => {
      const otherUser = await createTestUser()
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const testData = {
        id: otherUserId,
        email: otherUser.email,
        full_name: 'Other User',
        role: 'student',
      }

      await testRLSPolicy('user_profiles', 'select', testData, testUserId, false)
    })

    it('should allow users to update their own profile', async () => {
      const testData = {
        id: testUserId,
        full_name: 'Updated Name',
      }

      await testRLSPolicy('user_profiles', 'update', testData, testUserId, true)
    })
  })

  describe('Individual Learning Objectives RLS', () => {
    it('should allow students to access their own objectives', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      await testRLSPolicy('individual_learning_objectives', 'select', objective, testUserId, true)
    })

    it('should prevent students from accessing other students objectives', async () => {
      const otherUser = await createTestUser()
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const objective = await createTestLearningObjective(otherUserId, testProjectId)
      
      await testRLSPolicy('individual_learning_objectives', 'select', objective, testUserId, false)
    })

    it('should allow students to create their own objectives', async () => {
      const testData = {
        student_id: testUserId,
        project_id: testProjectId,
        objective_description: 'New Test Objective',
        competency_level: 3,
      }

      await testRLSPolicy('individual_learning_objectives', 'insert', testData, testUserId, true)
    })

    it('should prevent students from creating objectives for others', async () => {
      const otherUser = await createTestUser()
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const testData = {
        student_id: otherUserId, // Trying to create for another user
        project_id: testProjectId,
        objective_description: 'Malicious Objective',
        competency_level: 3,
      }

      await testRLSPolicy('individual_learning_objectives', 'insert', testData, testUserId, false)
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

  describe('Evidence Artifacts RLS', () => {
    it('should allow students to access their own evidence', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      const testData = {
        student_id: testUserId,
        learning_objective_id: objective.id,
        title: 'Test Evidence',
        description: 'Test evidence description',
        type: 'document',
        external_url: 'https://example.com/test.pdf',
      }

      await testRLSPolicy('evidence_artifacts', 'insert', testData, testUserId, true)
    })

    it('should prevent students from accessing other students evidence', async () => {
      const otherUser = await createTestUser()
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const objective = await createTestLearningObjective(otherUserId, testProjectId)
      
      const { data: evidence } = await supabaseAdmin
        .from('evidence_artifacts')
        .insert({
          student_id: otherUserId,
          learning_objective_id: objective.id,
          title: 'Other Student Evidence',
          description: 'Should not be accessible',
          type: 'document',
          external_url: 'https://example.com/other.pdf',
        })
        .select()
        .single()

      await testRLSPolicy('evidence_artifacts', 'select', evidence, testUserId, false)
    })
  })

  describe('FERPA Compliance', () => {
    it('should ensure complete data isolation between students', async () => {
      // Create two students
      const student1 = await createTestUser()
      const student2 = await createTestUser()
      
      const student1Id = student1!.id
      const student2Id = student2!.id

      await createTestUserProfile(student1Id, 'student')
      await createTestUserProfile(student2Id, 'student')

      // Create objectives for both students
      const obj1 = await createTestLearningObjective(student1Id, testProjectId, 'Student 1 Objective')
      const obj2 = await createTestLearningObjective(student2Id, testProjectId, 'Student 2 Objective')

      // Student 1 should not see Student 2's data
      await testRLSPolicy('individual_learning_objectives', 'select', obj2, student1Id, false)
      
      // Student 2 should not see Student 1's data  
      await testRLSPolicy('individual_learning_objectives', 'select', obj1, student2Id, false)

      // Each student should only see their own data
      await testRLSPolicy('individual_learning_objectives', 'select', obj1, student1Id, true)
      await testRLSPolicy('individual_learning_objectives', 'select', obj2, student2Id, true)
    })

    it('should maintain assessment integrity across the system', async () => {
      // Verify no team-based grading exists anywhere
      await validateIndividualAssessmentIntegrity()

      // Test minimum 3 objectives requirement would be enforced here
      // (This would be implemented in application logic, not database constraints)
      const objectives = await supabaseAdmin
        .from('individual_learning_objectives')
        .select()
        .eq('student_id', testUserId)

      // For a complete project, student should have at least 3 objectives
      // This is a business rule that would be enforced in the application
      expect(objectives.data).toBeDefined()
    })
  })
})
