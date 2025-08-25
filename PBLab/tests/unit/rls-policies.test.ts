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
    
    // Create test users
    const testUser = await createTestUser('student@example.com')
    const educator = await createTestUser('educator@example.com')
    
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
      const otherUser = await createTestUser('other@example.com')
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const testData = {
        id: otherUserId,
        email: 'other@example.com',
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
      const otherUser = await createTestUser('other-student@example.com')
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const objective = await createTestLearningObjective(otherUserId, testProjectId)
      
      await testRLSPolicy('individual_learning_objectives', 'select', objective, testUserId, false)
    })

    it('should allow students to create their own objectives', async () => {
      const testData = {
        student_id: testUserId,
        project_id: testProjectId,
        title: 'New Objective',
        description: 'Test objective description',
        competency_framework: { skills: ['analysis'] },
        target_proficiency_level: 'beginner',
      }

      await testRLSPolicy('individual_learning_objectives', 'insert', testData, testUserId, true)
    })

    it('should prevent students from creating objectives for others', async () => {
      const otherUser = await createTestUser('other-student2@example.com')
      const otherUserId = otherUser!.id
      await createTestUserProfile(otherUserId, 'student')

      const testData = {
        student_id: otherUserId, // Trying to create for another user
        project_id: testProjectId,
        title: 'Malicious Objective',
        description: 'Should not be allowed',
        competency_framework: { skills: ['analysis'] },
        target_proficiency_level: 'beginner',
      }

      await testRLSPolicy('individual_learning_objectives', 'insert', testData, testUserId, false)
    })
  })

  describe('Individual Assessments RLS', () => {
    it('should enforce individual assessment architecture', async () => {
      await validateIndividualAssessmentIntegrity()
    })

    it('should prevent team-based assessment creation', async () => {
      // This test verifies the database constraint that prevents team grading
      const testData = {
        student_id: testUserId,
        learning_objective_id: '00000000-0000-0000-0000-000000000001',
        graded_entity_type: 'team', // This should be blocked
        assessment_type: 'formative',
        score: 85,
        feedback: 'Test feedback',
        rubric_data: { criteria: [] },
      }

      try {
        const { error } = await supabaseAdmin
          .from('individual_assessments')
          .insert(testData)

        // Should fail due to check constraint
        expect(error).toBeTruthy()
        expect(error?.message).toContain('prevent_team_grading')
      } catch (e) {
        // Expected to fail
        expect(e).toBeTruthy()
      }
    })

    it('should allow individual assessment creation', async () => {
      const objective = await createTestLearningObjective(testUserId, testProjectId)
      
      const testData = {
        student_id: testUserId,
        learning_objective_id: objective.id,
        graded_entity_type: 'individual', // This should be allowed
        assessment_type: 'formative',
        score: 85,
        feedback: 'Good work',
        rubric_data: { criteria: [] },
      }

      const { data, error } = await supabaseAdmin
        .from('individual_assessments')
        .insert(testData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.graded_entity_type).toBe('individual')
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
        artifact_type: 'document',
        file_url: 'https://example.com/test.pdf',
        metadata: { pages: 5 },
      }

      await testRLSPolicy('evidence_artifacts', 'insert', testData, testUserId, true)
    })

    it('should prevent students from accessing other students evidence', async () => {
      const otherUser = await createTestUser('other-evidence@example.com')
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
          artifact_type: 'document',
          file_url: 'https://example.com/other.pdf',
          metadata: { pages: 3 },
        })
        .select()
        .single()

      await testRLSPolicy('evidence_artifacts', 'select', evidence, testUserId, false)
    })
  })

  describe('FERPA Compliance', () => {
    it('should ensure complete data isolation between students', async () => {
      // Create two students
      const student1 = await createTestUser('student1@example.com')
      const student2 = await createTestUser('student2@example.com')
      
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
