# Testing Strategy  
**Version:** 1.0  
**Date:** August 24, 2025  
**Project:** Evidence-Based PBL Platform

---

## Overview

This document outlines the comprehensive testing strategy for the Evidence-Based PBL Platform MVP, ensuring individual assessment integrity, educator facilitation effectiveness, and complete system reliability with rollback capabilities.

## Testing Philosophy

1. **Test-Driven Development**: Tests written before implementation
2. **MVP Focus**: Priority testing for critical requirements (REQ-1.1.*, REQ-1.2.*, REQ-2.1.*)
3. **Individual Assessment Integrity**: Prevent team grading at all costs
4. **FERPA Compliance**: Data privacy and security validation
5. **Rollback Confidence**: Tests ensure safe rollback procedures

---

## Testing Pyramid Strategy

### Unit Tests (70% of test coverage)
- **Focus**: Individual functions, components, and business logic
- **Tools**: Jest, React Testing Library, Vitest
- **Coverage Target**: >90% for core business logic

### Integration Tests (20% of test coverage)
- **Focus**: API endpoints, database interactions, service integration
- **Tools**: Playwright, Supertest, Docker Compose test environment
- **Coverage Target**: >80% for critical user workflows

### End-to-End Tests (10% of test coverage)
- **Focus**: Complete user journeys, cross-browser compatibility
- **Tools**: Playwright, real database environment
- **Coverage Target**: 100% of MVP user stories

---

## Phase-by-Phase Testing Requirements

## Phase 1: Foundation Setup Testing

### Database Schema Testing
```typescript
// tests/database/schema.test.ts
describe('Database Schema Integrity', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  test('individual assessment tables prevent team grading', async () => {
    // Attempt to insert team grade - should fail
    const teamGradeAttempt = {
      student_id: 'uuid',
      project_id: 'uuid',
      competency_framework: { team_grade: 85 }, // This should be blocked
      evidence_portfolio: []
    };

    await expect(
      supabase.from('individual_assessments').insert(teamGradeAttempt)
    ).rejects.toThrow('individual_only constraint violation');
  });

  test('RLS policies enforce data isolation', async () => {
    const student1 = await createTestUser('student');
    const student2 = await createTestUser('student');
    
    await createLearningObjective(student1.id, 'Learn React');
    
    // Student 2 should not see student 1's objectives
    const { data } = await supabaseClient
      .from('individual_learning_objectives')
      .select('*')
      .auth(student2.token);
    
    expect(data).toHaveLength(0);
  });

  test('minimum learning objectives constraint', async () => {
    const student = await createTestUser('student');
    const project = await createTestProject();
    
    // Try to complete project with only 2 objectives - should fail
    await createLearningObjective(student.id, project.id, 'Objective 1');
    await createLearningObjective(student.id, project.id, 'Objective 2');
    
    await expect(
      supabase.from('individual_learning_objectives')
        .update({ progress_status: 'completed' })
        .eq('student_id', student.id)
        .eq('project_id', project.id)
    ).rejects.toThrow('minimum 3 learning objectives required');
  });
});
```

### Authentication Testing
```typescript
// tests/auth/authentication.test.ts
describe('Authentication System', () => {
  test('magic link authentication flow', async () => {
    const email = 'test@example.com';
    
    // Request magic link
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    expect(error).toBeNull();
    expect(data.session).toBeNull(); // No immediate session
    
    // Simulate magic link click (test environment)
    const magicToken = await getMagicLinkToken(email);
    const { data: sessionData } = await supabase.auth.verifyOtp({
      email,
      token: magicToken,
      type: 'magiclink'
    });
    
    expect(sessionData.session).toBeTruthy();
    expect(sessionData.user.email).toBe(email);
  });

  test('role-based access control', async () => {
    const educator = await createTestUser('educator');
    const student = await createTestUser('student');
    
    // Student cannot access educator endpoints
    const response = await apiRequest('/api/educator/interventions', student.token);
    expect(response.status).toBe(403);
    
    // Educator can access educator endpoints
    const educatorResponse = await apiRequest('/api/educator/interventions', educator.token);
    expect(educatorResponse.status).toBe(200);
  });
});
```

---

## Phase 2: Individual Assessment Testing

### Learning Objectives API Testing
```typescript
// tests/api/objectives.test.ts
describe('Individual Learning Objectives API', () => {
  let student: TestUser;
  let educator: TestUser;
  let project: TestProject;

  beforeEach(async () => {
    student = await createTestUser('student');
    educator = await createTestUser('educator');
    project = await createTestProject(educator.id);
    await enrollStudentInProject(student.id, project.id);
  });

  test('student can create learning objectives', async () => {
    const objectiveData = {
      projectId: project.id,
      description: 'Learn advanced React patterns including hooks and context',
      competencyLevel: 3,
      evidenceArtifacts: [
        {
          type: 'code',
          title: 'React Hook Implementation',
          description: 'Custom hook for data fetching'
        }
      ]
    };

    const response = await apiRequest('/api/objectives', student.token, {
      method: 'POST',
      body: objectiveData
    });

    expect(response.status).toBe(201);
    expect(response.data.description).toBe(objectiveData.description);
    expect(response.data.studentId).toBe(student.id);
    expect(response.data.progressStatus).toBe('draft');
  });

  test('learning objective validation', async () => {
    const invalidObjective = {
      projectId: project.id,
      description: 'Short', // Too short
      competencyLevel: 6 // Invalid level
    };

    const response = await apiRequest('/api/objectives', student.token, {
      method: 'POST',
      body: invalidObjective
    });

    expect(response.status).toBe(400);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.details).toMatchObject({
      description: 'Must be at least 10 characters',
      competencyLevel: 'Must be between 1 and 5'
    });
  });
});
```

### Assessment Integrity Testing
```typescript
// tests/assessment/integrity.test.ts
describe('Assessment System Integrity', () => {
  test('prevents team-based grading attempts', async () => {
    const student = await createTestUser('student');
    const project = await createTestProject();
    const objective = await createLearningObjective(student.id, project.id);

    // Attempt to create assessment with team grading
    const teamGradeAssessment = {
      studentId: student.id,
      projectId: project.id,
      learningObjectiveId: objective.id,
      competencyFramework: {
        teamGrade: 90, // Should be rejected
        competencyAreas: []
      },
      evidencePortfolio: []
    };

    const response = await apiRequest('/api/assessments', student.token, {
      method: 'POST',
      body: teamGradeAssessment
    });

    expect(response.status).toBe(422);
    expect(response.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(response.error.message).toContain('team grading not allowed');
  });

  test('enforces individual evidence portfolio requirements', async () => {
    const student = await createTestUser('student');
    const project = await createTestProject();
    const objective = await createLearningObjective(student.id, project.id);

    // Assessment without evidence portfolio should fail
    const assessmentWithoutEvidence = {
      studentId: student.id,
      projectId: project.id,
      learningObjectiveId: objective.id,
      competencyFramework: {
        competencyAreas: [
          { name: 'Problem Solving', targetLevel: 3 }
        ]
      },
      evidencePortfolio: [] // Empty portfolio should fail
    };

    const response = await apiRequest('/api/assessments', student.token, {
      method: 'POST',
      body: assessmentWithoutEvidence
    });

    expect(response.status).toBe(422);
    expect(response.error.message).toContain('minimum evidence required');
  });
});
```

---

## Phase 3: Educator Dashboard Testing

### Intervention Detection Testing
```typescript
// tests/educator/interventions.test.ts
describe('Team Intervention System', () => {
  let educator: TestUser;
  let project: TestProject;
  let team: TestTeam;

  beforeEach(async () => {
    educator = await createTestUser('educator');
    project = await createTestProject(educator.id);
    team = await createTestTeam(project.id, 4); // 4 members
  });

  test('detects team stalling behavior', async () => {
    // Simulate no activity for 3 days
    await setTeamLastActivity(team.id, daysAgo(3));

    // Run intervention analysis
    await runInterventionAnalysis();

    // Check for stalling alert
    const alerts = await getInterventionAlerts(team.id);
    expect(alerts).toContainEqual(
      expect.objectContaining({
        triggerType: 'stalling',
        confidenceScore: expect.any(Number)
      })
    );
  });

  test('detects free rider behavior', async () => {
    const freeRider = team.members[0];
    const activeMembers = team.members.slice(1);

    // Simulate free rider: no contributions
    await setMemberActivity(freeRider.id, []);
    
    // Simulate active members: regular contributions
    for (const member of activeMembers) {
      await setMemberActivity(member.id, generateRecentActivities(10));
    }

    await runInterventionAnalysis();

    const alerts = await getInterventionAlerts(team.id);
    expect(alerts).toContainEqual(
      expect.objectContaining({
        triggerType: 'free_rider',
        evidenceData: expect.objectContaining({
          lowEngagementMembers: expect.arrayContaining([freeRider.id])
        })
      })
    );
  });

  test('real-time intervention alerts via WebSocket', async () => {
    const ws = await connectWebSocket(educator.token);
    const alertPromise = waitForWebSocketMessage(ws, 'team-interventions');

    // Subscribe to team intervention alerts
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'team-interventions',
      data: { courseId: project.courseId }
    }));

    // Trigger intervention
    await triggerTeamIntervention(team.id, 'conflict');

    // Verify real-time alert received
    const alert = await alertPromise;
    expect(alert.data).toMatchObject({
      alertType: 'new_intervention',
      teamId: team.id,
      triggerType: 'conflict'
    });
  });
});
```

---

## Phase 4: PBL Process Engine Testing

### Phase Transition Testing
```typescript
// tests/pbl/phase-transitions.test.ts
describe('PBL Phase Management', () => {
  test('enforces phase completion criteria', async () => {
    const team = await createTestTeam();
    const members = await getTeamMembers(team.id);

    // Try to advance without all reflections complete
    const advanceRequest = {
      fromPhase: 'problem_identification',
      toPhase: 'learning_objectives',
      completionEvidence: {
        criteriaMet: ['problem_statement_defined'],
        individualReflectionsComplete: false, // Missing reflections
        deliverableLinks: []
      }
    };

    const response = await apiRequest(
      `/api/teams/${team.id}/advance-phase`,
      members[0].token,
      {
        method: 'POST',
        body: advanceRequest
      }
    );

    expect(response.status).toBe(422);
    expect(response.error.message).toContain('individual reflections required');
  });

  test('successful phase transition', async () => {
    const team = await createTestTeam();
    const members = await getTeamMembers(team.id);

    // Complete all reflections
    for (const member of members) {
      await submitReflection(member.id, team.projectId, 'problem_identification');
    }

    const advanceRequest = {
      fromPhase: 'problem_identification',
      toPhase: 'learning_objectives',
      completionEvidence: {
        criteriaMet: ['problem_statement_defined'],
        individualReflectionsComplete: true,
        deliverableLinks: ['https://example.com/problem-statement']
      }
    };

    const response = await apiRequest(
      `/api/teams/${team.id}/advance-phase`,
      members[0].token,
      {
        method: 'POST',
        body: advanceRequest
      }
    );

    expect(response.status).toBe(200);

    // Verify phase transition recorded
    const phaseStatus = await getTeamPhaseStatus(team.id);
    expect(phaseStatus.currentPhase.name).toBe('learning_objectives');
  });
});
```

---

## Phase 5: AI Coaching Testing

### AI Integration Testing
```typescript
// tests/ai/coaching.test.ts
describe('AI Coaching System', () => {
  test('prevents direct answer provision', async () => {
    const student = await createTestUser('student');
    const project = await createTestProject();

    const directAnswerRequest = {
      projectId: project.id,
      contextType: 'problem_analysis',
      currentPhase: 'analysis',
      studentQuestion: 'What is the solution to climate change?', // Direct answer request
      sessionContext: {
        recentActivities: [],
        currentChallenges: ['need solution'],
        learningObjectives: ['understand climate issues']
      }
    };

    const response = await apiRequest('/api/ai/coaching', student.token, {
      method: 'POST',
      body: directAnswerRequest
    });

    expect(response.status).toBe(200);
    expect(response.data.coachingGuidance).not.toContain('the solution is');
    expect(response.data.coachingType).toBe('process_question');
    expect(response.data.coachingGuidance).toContain('What factors might');
  });

  test('academic integrity logging', async () => {
    const student = await createTestUser('student');
    const educator = await createTestUser('educator');
    
    // Make AI coaching request
    const coachingResponse = await makeAICoachingRequest(student, {
      question: 'How do I approach this problem?',
      context: 'analysis_phase'
    });

    expect(coachingResponse.status).toBe(200);

    // Verify educator can see AI usage
    const usageResponse = await apiRequest(
      `/api/ai/usage/${student.id}`,
      educator.token
    );

    expect(usageResponse.status).toBe(200);
    expect(usageResponse.data.usageHistory).toContainEqual(
      expect.objectContaining({
        studentId: student.id,
        interactionType: 'coaching_request',
        academicIntegrityFlags: expect.any(Array)
      })
    );
  });

  test('AI usage rate limiting', async () => {
    const student = await createTestUser('student');

    // Make maximum allowed requests (10 per hour)
    for (let i = 0; i < 10; i++) {
      const response = await makeAICoachingRequest(student, {
        question: `Question ${i}`,
        context: 'learning'
      });
      expect(response.status).toBe(200);
    }

    // 11th request should be rate limited
    const rateLimitedResponse = await makeAICoachingRequest(student, {
      question: 'One too many',
      context: 'learning'
    });

    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.error.message).toContain('rate limit exceeded');
  });
});
```

---

## End-to-End Testing

### Complete User Journey Testing
```typescript
// tests/e2e/student-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Student PBL Journey', () => {
  test('student completes full PBL cycle', async ({ page }) => {
    // Authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'student@example.com');
    await page.click('[data-testid="magic-link-button"]');
    
    // Simulate magic link login
    await simulateMagicLinkLogin('student@example.com');
    await page.reload();

    // Project assignment
    await expect(page.locator('[data-testid="project-dashboard"]')).toBeVisible();
    await page.click('[data-testid="active-project"]');

    // Phase 1: Create learning objectives
    await page.click('[data-testid="learning-objectives-tab"]');
    await page.click('[data-testid="add-objective-button"]');
    
    await page.fill('[data-testid="objective-description"]', 
      'Understand the principles of sustainable urban planning and their application in reducing carbon emissions');
    await page.selectOption('[data-testid="competency-level"]', '3');
    await page.click('[data-testid="save-objective"]');

    // Verify objective saved
    await expect(page.locator('[data-testid="objective-list"] li')).toHaveCount(1);

    // Create minimum 3 objectives
    await createAdditionalObjectives(page, 2);

    // Submit phase reflection
    await page.click('[data-testid="phase-reflection-tab"]');
    await page.fill('[data-testid="reflection-content"]',
      'In this initial phase, I identified the core problem of urban sustainability...');
    await page.click('[data-testid="submit-reflection"]');

    // Phase transition
    await page.click('[data-testid="advance-phase-button"]');
    await expect(page.locator('[data-testid="current-phase"]')).toHaveText('Learning Objectives');

    // Continue through remaining phases...
    await completeAllPBLPhases(page);

    // Final assessment submission
    await page.click('[data-testid="assessment-tab"]');
    await uploadEvidencePortfolio(page);
    await page.click('[data-testid="submit-assessment"]');

    // Verify completion
    await expect(page.locator('[data-testid="project-status"]')).toHaveText('Completed');
  });
});
```

---

## Security Testing

### FERPA Compliance Testing
```typescript
// tests/security/ferpa-compliance.test.ts
describe('FERPA Compliance', () => {
  test('all student data access is logged', async () => {
    const student = await createTestUser('student');
    const educator = await createTestUser('educator');
    
    // Educator views student objectives
    await apiRequest(`/api/objectives?studentId=${student.id}`, educator.token);
    
    // Verify audit log entry
    const auditLogs = await getAuditLogs();
    expect(auditLogs).toContainEqual(
      expect.objectContaining({
        user_id: educator.id,
        action: 'SELECT',
        resource_type: 'individual_learning_objectives',
        student_data_accessed: [student.id],
        educational_justification: expect.any(String)
      })
    );
  });

  test('unauthorized data access is prevented', async () => {
    const student1 = await createTestUser('student');
    const student2 = await createTestUser('student');
    
    // Create data for student1
    await createLearningObjective(student1.id, 'test-project', 'Test objective');
    
    // Student2 tries to access student1's data
    const response = await apiRequest(
      `/api/objectives?studentId=${student1.id}`,
      student2.token
    );
    
    expect(response.status).toBe(403);
    expect(response.error.code).toBe('AUTHORIZATION_DENIED');
  });
});
```

---

## Performance Testing

### Load Testing
```typescript
// tests/performance/load.test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.02'],    // Less than 2% failures
  },
};

export default function() {
  const baseUrl = 'http://localhost:3000';
  
  // Test critical endpoints
  const responses = http.batch([
    ['GET', `${baseUrl}/api/objectives?projectId=test-project`],
    ['GET', `${baseUrl}/api/educator/interventions?courseId=test-course`],
    ['POST', `${baseUrl}/api/ai/coaching`, JSON.stringify({
      projectId: 'test-project',
      studentQuestion: 'How should I approach this problem?',
      contextType: 'problem_analysis'
    })],
  ]);

  responses.forEach(response => {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
  });
}
```

---

## Continuous Integration Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30
      
      - name: Run integration tests  
        run: npm run test:integration
      
      - name: Run database tests
        run: npm run test:database

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-results
          path: test-results/

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: |
          npm audit --audit-level high
          npm run test:security
```

---

## Test Coverage Requirements

### Coverage Targets
- **Unit Tests**: >90% statement coverage for business logic
- **Integration Tests**: >80% API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage
- **Security Tests**: 100% authentication and authorization paths

### Coverage Reporting
```bash
# Generate comprehensive coverage report
npm run test:coverage

# Coverage breakdown by module
npm run test:coverage -- --by-module

# Minimum coverage enforcement
npm run test:coverage -- --check-coverage \
  --statements 90 \
  --branches 80 \
  --functions 90 \
  --lines 90
```

---

*This testing strategy ensures MVP reliability, individual assessment integrity, and complete rollback confidence while maintaining focus on critical PBL requirements.*
