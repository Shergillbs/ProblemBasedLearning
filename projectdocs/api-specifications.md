# API Specifications
**Version:** 1.0  
**Date:** August 24, 2025  
**Project:** Evidence-Based PBL Platform

---

## Overview

This document defines the RESTful API specifications for the Evidence-Based PBL Platform, focusing on individual assessment endpoints, educator facilitation APIs, and AI coaching integration.

## API Design Principles

1. **RESTful Architecture**: Standard HTTP methods and status codes
2. **Individual Assessment Focus**: No team-based grading endpoints
3. **FERPA Compliance**: All student data access logged
4. **Real-time Capabilities**: WebSocket support for live updates
5. **Academic Integrity**: AI usage transparency and tracking

---

## Authentication

### Authentication Method
- **Primary**: Supabase Auth with magic link authentication
- **Authorization**: Bearer token in `Authorization` header
- **Session Management**: JWT tokens with automatic refresh

```typescript
// Authentication header format
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Role-Based Access Control
```typescript
interface UserContext {
  userId: string;
  role: 'student' | 'educator' | 'admin' | 'community_partner';
  courseIds: string[]; // Courses user has access to
  permissions: string[];
}
```

---

## Core API Structure

### Base URL
```
Development: http://localhost:3000/api
Production: https://pbl-platform.vercel.app/api
```

### Standard Response Format
```typescript
// Success Response
interface APIResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationInfo;
  };
}

// Error Response
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId: string;
  };
}

// Pagination
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

---

## Individual Assessment API (REQ-1.1.*)

### Learning Objectives Endpoints

#### Create Individual Learning Objective
```http
POST /api/objectives
```

**Request Body:**
```typescript
interface CreateObjectiveRequest {
  projectId: string;
  description: string; // Min 10 characters
  competencyLevel: 1 | 2 | 3 | 4 | 5;
  evidenceArtifacts?: EvidenceArtifact[];
}

interface EvidenceArtifact {
  type: 'document' | 'presentation' | 'code' | 'reflection' | 'video' | 'image';
  title: string;
  description?: string;
  filePath?: string;
  externalUrl?: string;
}
```

**Response:**
```typescript
interface LearningObjectiveResponse {
  id: string;
  studentId: string;
  projectId: string;
  description: string;
  competencyLevel: number;
  evidenceArtifacts: EvidenceArtifact[];
  progressStatus: 'draft' | 'active' | 'completed' | 'revised';
  createdAt: string;
  updatedAt: string;
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (description too short, invalid competency level)
- `403` - Not authorized for this project
- `422` - Business rule violation (minimum 3 objectives required)

#### Get Individual Learning Objectives
```http
GET /api/objectives?projectId={projectId}&studentId={studentId}
```

**Query Parameters:**
- `projectId` (required): Project UUID
- `studentId` (optional): Student UUID (educators only)
- `status` (optional): Filter by progress status

**Response:**
```typescript
interface ObjectivesListResponse {
  objectives: LearningObjectiveResponse[];
  summary: {
    totalObjectives: number;
    completedObjectives: number;
    averageCompetencyLevel: number;
  };
}
```

#### Update Learning Objective
```http
PUT /api/objectives/{objectiveId}
```

**Request Body:** Same as create, excluding `projectId`

**Status Codes:**
- `200` - Updated successfully
- `404` - Objective not found
- `403` - Not authorized to modify this objective

### Individual Assessment Endpoints

#### Submit Individual Assessment
```http
POST /api/assessments
```

**Request Body:**
```typescript
interface CreateAssessmentRequest {
  studentId?: string; // Optional, defaults to authenticated user
  projectId: string;
  learningObjectiveId: string;
  competencyFramework: CompetencyFramework;
  evidencePortfolio: EvidenceArtifact[];
}

interface CompetencyFramework {
  competencyAreas: CompetencyArea[];
  assessmentCriteria: AssessmentCriteria[];
  rubricData: RubricData;
}

interface CompetencyArea {
  name: string;
  description: string;
  targetLevel: number;
  evidenceRequired: string[];
}
```

**Response:**
```typescript
interface AssessmentResponse {
  id: string;
  studentId: string;
  projectId: string;
  learningObjectiveId: string;
  competencyFramework: CompetencyFramework;
  evidencePortfolio: EvidenceArtifact[];
  assessmentScore?: number; // Set by educator
  competencyAchievement?: number;
  educatorFeedback?: string;
  assessmentDate: string;
  status: 'submitted' | 'under_review' | 'completed';
}
```

#### Grade Individual Assessment (Educators Only)
```http
PUT /api/assessments/{assessmentId}/grade
```

**Request Body:**
```typescript
interface GradeAssessmentRequest {
  assessmentScore: number; // 0-100
  competencyAchievement: number; // 1-5
  educatorFeedback: string;
  competencyBreakdown: CompetencyScoreBreakdown[];
}

interface CompetencyScoreBreakdown {
  competencyArea: string;
  achievementLevel: number;
  feedback: string;
  improvementSuggestions: string[];
}
```

---

## Educator Dashboard API (REQ-1.2.*)

### Intervention Dashboard Endpoints

#### Get Team Intervention Alerts
```http
GET /api/educator/interventions?courseId={courseId}&active=true
```

**Response:**
```typescript
interface InterventionAlertsResponse {
  alerts: TeamInterventionAlert[];
  summary: {
    totalActiveAlerts: number;
    criticalAlerts: number;
    averageResponseTime: number; // hours
    resolutionRate: number; // percentage
  };
}

interface TeamInterventionAlert {
  id: string;
  teamId: string;
  teamName: string;
  projectId: string;
  triggerType: 'stalling' | 'conflict' | 'free_rider' | 'off_track' | 'low_engagement';
  confidenceScore: number; // 0-1
  evidenceData: {
    daysSinceActivity: number;
    memberEngagementScores: MemberEngagement[];
    communicationPatterns: CommunicationMetric[];
    phaseProgressStatus: string;
  };
  triggeredAt: string;
  recommendedActions: string[];
  coachingPrompts: string[];
}
```

#### Get Individual Student Progress (Within Teams)
```http
GET /api/educator/students/{studentId}/progress?projectId={projectId}
```

**Response:**
```typescript
interface StudentProgressResponse {
  student: {
    id: string;
    name: string;
    teamId: string;
    teamName: string;
  };
  individualProgress: {
    learningObjectives: LearningObjectiveResponse[];
    assessments: AssessmentResponse[];
    reflections: ReflectionResponse[];
    aiUsage: AIUsageSummary;
  };
  teamContributions: {
    activityLevel: 'low' | 'medium' | 'high';
    contributionScore: number;
    collaborationQuality: number;
    recentActivities: TeamActivity[];
  };
  interventionRecommendations: string[];
}
```

### Coaching Prompt System

#### Get Context-Aware Coaching Prompts
```http
GET /api/educator/coaching-prompts?teamId={teamId}&triggerType={triggerType}
```

**Response:**
```typescript
interface CoachingPromptsResponse {
  prompts: CoachingPrompt[];
  context: {
    teamPhase: string;
    teamDynamics: TeamDynamicsAnalysis;
    recommendedApproach: string;
  };
}

interface CoachingPrompt {
  id: string;
  promptText: string;
  coachingType: 'question' | 'framework' | 'activity' | 'reflection';
  expectedOutcome: string;
  researchBasis: string;
  effectivenessRating: number;
}
```

#### Record Coaching Intervention
```http
POST /api/educator/interventions/{interventionId}/response
```

**Request Body:**
```typescript
interface InterventionResponseRequest {
  interventionType: 'direct_coaching' | 'prompt_delivery' | 'team_restructure' | 'individual_meeting';
  actionsTaken: string[];
  coachingPromptsUsed: string[];
  outcomeNotes: string;
  effectivenessRating: number; // 1-10
  followUpRequired: boolean;
  followUpDate?: string;
}
```

---

## PBL Process Engine API (REQ-2.1.*)

### Phase Management Endpoints

#### Get Team Phase Status
```http
GET /api/teams/{teamId}/phase
```

**Response:**
```typescript
interface TeamPhaseResponse {
  teamId: string;
  projectId: string;
  currentPhase: PBLPhase;
  phaseHistory: PhaseTransition[];
  completionStatus: {
    overallProgress: number; // 0-100
    individualReflectionStatus: ReflectionStatus[];
    phaseDeliverables: Deliverable[];
  };
}

interface PBLPhase {
  name: 'problem_identification' | 'learning_objectives' | 'research' | 'analysis' | 'synthesis' | 'evaluation' | 'reflection';
  startDate: string;
  targetEndDate: string;
  completionDate?: string;
  criteriaStatus: CriteriaStatus[];
}

interface CriteriaStatus {
  criterion: string;
  required: boolean;
  completed: boolean;
  completedBy?: string[];
}
```

#### Advance Team to Next Phase
```http
POST /api/teams/{teamId}/advance-phase
```

**Request Body:**
```typescript
interface AdvancePhaseRequest {
  fromPhase: string;
  toPhase: string;
  completionEvidence: {
    criteriaMet: string[];
    individualReflectionsComplete: boolean;
    deliverableLinks: string[];
  };
  override?: boolean; // Educator override for special circumstances
  overrideReason?: string;
}
```

**Status Codes:**
- `200` - Phase advanced successfully
- `400` - Completion criteria not met
- `403` - Not authorized to advance phase
- `422` - Individual reflections incomplete

### Individual Reflection System

#### Submit Individual Reflection
```http
POST /api/reflections
```

**Request Body:**
```typescript
interface CreateReflectionRequest {
  projectId: string;
  teamId: string;
  pblPhase: string;
  reflectionPrompt: string;
  reflectionContent: string; // Min 50 characters
  learningInsights: string[];
  nextSteps: string;
}
```

**Response:**
```typescript
interface ReflectionResponse {
  id: string;
  studentId: string;
  projectId: string;
  teamId: string;
  pblPhase: string;
  reflectionPrompt: string;
  reflectionContent: string;
  qualityScore: number; // 1-10, auto-calculated
  depthIndicators: string[];
  learningInsights: string[];
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## AI Coaching Integration API (REQ-3.1.*)

### AI Coaching Endpoints

#### Request AI Coaching
```http
POST /api/ai/coaching
```

**Request Body:**
```typescript
interface AICoachingRequest {
  projectId: string;
  teamId?: string;
  contextType: 'individual_learning' | 'team_collaboration' | 'problem_analysis' | 'reflection_support';
  currentPhase: string;
  studentQuestion: string;
  sessionContext: {
    recentActivities: string[];
    currentChallenges: string[];
    learningObjectives: string[];
  };
}
```

**Response:**
```typescript
interface AICoachingResponse {
  sessionId: string;
  coachingGuidance: string;
  coachingType: 'process_question' | 'framework_suggestion' | 'reflection_prompt' | 'resource_recommendation';
  followUpQuestions: string[];
  learningResources: Resource[];
  academicIntegrityNote: string;
}

interface Resource {
  type: 'article' | 'video' | 'tool' | 'framework';
  title: string;
  url: string;
  description: string;
}
```

**Status Codes:**
- `200` - Coaching provided successfully
- `429` - Rate limit exceeded (max 10 requests per hour per student)
- `400` - Question flagged as seeking direct answers
- `503` - AI service unavailable

#### Get AI Usage History (Transparency)
```http
GET /api/ai/usage/{studentId}?projectId={projectId}
```

**Authorization:** Educator or student themselves only

**Response:**
```typescript
interface AIUsageHistoryResponse {
  usageHistory: AIUsageRecord[];
  summary: {
    totalInteractions: number;
    averageHelpfulnessRating: number;
    coachingEffectivenessScore: number;
    academicIntegrityFlags: number;
  };
}

interface AIUsageRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  interactionType: string;
  projectContext: {
    projectId: string;
    phase: string;
    teamContext?: string;
  };
  promptSummary: string; // Sanitized version of prompt
  responseType: string;
  helpfulnessRating?: number;
  academicIntegrityFlags: string[];
  educatorNotes?: string;
}
```

---

## Real-Time WebSocket API

### WebSocket Connection
```
Development: ws://localhost:3000/api/ws
Production: wss://pbl-platform.vercel.app/api/ws
```

### Authentication
```typescript
// Connection with JWT token
const ws = new WebSocket('ws://localhost:3000/api/ws?token=<jwt_token>');
```

### Message Format
```typescript
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'notification' | 'update';
  channel: string;
  data: any;
  timestamp: string;
}
```

### Subscription Channels

#### Team Intervention Alerts (Educators)
```typescript
// Subscribe to intervention alerts
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'team-interventions',
  data: { courseId: 'uuid' }
}));

// Receive alert notifications
{
  type: 'notification',
  channel: 'team-interventions',
  data: {
    alertType: 'new_intervention',
    teamId: 'uuid',
    triggerType: 'stalling',
    confidenceScore: 0.85
  }
}
```

#### Team Progress Updates (Students)
```typescript
// Subscribe to team updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'team-progress',
  data: { teamId: 'uuid' }
}));

// Receive progress updates
{
  type: 'update',
  channel: 'team-progress',
  data: {
    updateType: 'phase_transition',
    fromPhase: 'research',
    toPhase: 'analysis',
    triggeredBy: 'uuid'
  }
}
```

---

## Error Handling

### Standard Error Codes
```typescript
enum APIErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}
```

### Error Response Examples
```typescript
// Validation Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Learning objective description must be at least 10 characters',
    details: {
      field: 'description',
      value: 'Short',
      constraint: 'minLength',
      minimum: 10
    },
    requestId: 'req_123456'
  }
}

// Business Rule Violation
{
  success: false,
  error: {
    code: 'BUSINESS_RULE_VIOLATION',
    message: 'Students must have minimum 3 learning objectives before assessment',
    details: {
      currentObjectives: 2,
      minimumRequired: 3,
      studentId: 'uuid',
      projectId: 'uuid'
    },
    requestId: 'req_123457'
  }
}
```

---

## Rate Limiting

### Rate Limit Configuration
```typescript
const rateLimits = {
  // AI coaching: expensive, limit strictly
  'POST /api/ai/coaching': {
    window: '1h',
    max: 10,
    message: 'AI coaching limited to 10 requests per hour'
  },
  
  // General API: moderate usage
  'default': {
    window: '15m',
    max: 100,
    message: 'General API limit: 100 requests per 15 minutes'
  },
  
  // Real-time updates: high frequency
  'WebSocket': {
    connectionsPerUser: 3,
    messagesPerMinute: 60
  }
};
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

---

## Testing Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'online' | 'offline';
    ai_service: 'online' | 'offline';
    websocket: 'online' | 'offline';
  };
  responseTime: number; // ms
}
```

### API Documentation
```http
GET /api/docs
```

Returns OpenAPI 3.0 specification for the complete API.

---

*This API specification ensures individual assessment integrity, educator facilitation support, and complete academic transparency while maintaining high performance and security standards.*
