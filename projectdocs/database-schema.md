# Database Schema Documentation
**Version:** 1.0  
**Date:** August 24, 2025  
**Project:** Evidence-Based PBL Platform

---

## Overview

This document defines the PostgreSQL database schema for the Evidence-Based PBL Platform, focusing on individual assessment architecture, team collaboration support, and FERPA-compliant data management.

## Core Design Principles

1. **Individual Assessment First**: No team-based grading capabilities
2. **FERPA Compliance**: Row Level Security for data protection
3. **Academic Integrity**: Complete audit trails
4. **Real-time Capabilities**: Support for WebSocket subscriptions
5. **Scalability**: Optimized indexes and partitioning strategy

---

## Authentication & User Management

### Users Table (Supabase Auth)
```sql
-- Extended user profiles (Supabase auth.users extended)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'admin', 'community_partner')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  institution TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- FERPA compliance
  ferpa_consent BOOLEAN DEFAULT FALSE,
  privacy_settings JSONB DEFAULT '{"visibility": "private"}'::jsonb
);

-- RLS Policies for user data
CREATE POLICY "users_own_profile" ON user_profiles
FOR ALL USING (auth.uid() = id);

CREATE POLICY "educators_view_students" ON user_profiles  
FOR SELECT USING (
  role = 'student' AND EXISTS (
    SELECT 1 FROM course_enrollments ce
    WHERE ce.educator_id = auth.uid()
    AND ce.course_id IN (
      SELECT course_id FROM student_enrollments se
      WHERE se.student_id = user_profiles.id
    )
  )
);
```

### Role-Based Access Control
```sql
-- Course management
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  semester TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments (educators)
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  educator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(course_id, educator_id)
);

-- Student enrollments
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(course_id, student_id)
);
```

---

## Individual Assessment Architecture (REQ-1.1.*)

### Individual Learning Objectives (REQ-1.1.1)
```sql
-- Core individual assessment table
CREATE TABLE individual_learning_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  objective_description TEXT NOT NULL CHECK (length(objective_description) >= 10),
  competency_level INTEGER CHECK (competency_level >= 1 AND competency_level <= 5),
  evidence_artifacts JSONB DEFAULT '[]'::jsonb,
  progress_status TEXT DEFAULT 'draft' CHECK (progress_status IN ('draft', 'active', 'completed', 'revised')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure minimum objectives per project
  CONSTRAINT valid_evidence_array CHECK (jsonb_typeof(evidence_artifacts) = 'array')
);

-- RLS: Students access only their own objectives
CREATE POLICY "students_own_objectives" ON individual_learning_objectives
FOR ALL USING (auth.uid() = student_id);

-- RLS: Educators access objectives for their courses
CREATE POLICY "educators_course_objectives" ON individual_learning_objectives
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN projects p ON p.course_id = ce.course_id
    WHERE ce.educator_id = auth.uid() 
    AND p.id = individual_learning_objectives.project_id
  )
);

-- Ensure minimum 3 objectives per student per project
CREATE OR REPLACE FUNCTION enforce_minimum_objectives()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM individual_learning_objectives 
      WHERE student_id = NEW.student_id 
      AND project_id = NEW.project_id 
      AND progress_status != 'draft') >= 3 THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.progress_status = 'draft' AND NEW.progress_status != 'draft' THEN
    IF (SELECT COUNT(*) FROM individual_learning_objectives 
        WHERE student_id = NEW.student_id 
        AND project_id = NEW.project_id 
        AND progress_status != 'draft') < 2 THEN
      RAISE EXCEPTION 'Students must have minimum 3 learning objectives per project';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_min_objectives_trigger
  BEFORE INSERT OR UPDATE ON individual_learning_objectives
  FOR EACH ROW EXECUTE FUNCTION enforce_minimum_objectives();
```

### Individual Competency Assessments (REQ-1.1.2)
```sql
-- Individual assessment records (NO team grades allowed)
CREATE TABLE individual_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  learning_objective_id UUID REFERENCES individual_learning_objectives(id) ON DELETE CASCADE,
  
  -- Competency framework data
  competency_framework JSONB NOT NULL,
  evidence_portfolio JSONB NOT NULL CHECK (jsonb_array_length(evidence_portfolio) >= 1),
  
  -- Individual assessment results
  assessment_score DECIMAL(4,2) CHECK (assessment_score >= 0 AND assessment_score <= 100),
  competency_achievement INTEGER CHECK (competency_achievement >= 1 AND competency_achievement <= 5),
  educator_feedback TEXT,
  
  -- Assessment metadata
  assessed_by UUID REFERENCES auth.users(id),
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent team-based grading
  CONSTRAINT individual_only CHECK (NOT (competency_framework ? 'team_grade')),
  CONSTRAINT no_team_score CHECK (NOT (competency_framework ? 'team_score'))
);

-- RLS: Students see only their own assessments
CREATE POLICY "students_own_assessments" ON individual_assessments
FOR ALL USING (auth.uid() = student_id);

-- RLS: Educators access assessments for their courses
CREATE POLICY "educators_course_assessments" ON individual_assessments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN projects p ON p.course_id = ce.course_id
    WHERE ce.educator_id = auth.uid() 
    AND p.id = individual_assessments.project_id
  )
);
```

---

## Team Collaboration (REQ-1.1.3 - No Grade Dependency)

### Team Structure
```sql
-- Teams for collaboration (NO grading)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_description TEXT,
  max_members INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team membership (collaboration only, no grade implications)
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'coordinator')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (team_id, student_id)
);

-- Team activities (for dynamics analysis, NOT grading)
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('discussion', 'file_share', 'meeting', 'phase_transition')),
  activity_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Educator Dashboard System (REQ-1.2.*)

### Team Intervention Detection (REQ-1.2.1)
```sql
-- Team dynamics analysis and intervention triggers
CREATE TABLE team_intervention_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stalling', 'conflict', 'free_rider', 'off_track', 'low_engagement')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_data JSONB NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  educator_notified BOOLEAN DEFAULT FALSE
);

-- Index for real-time alerts
CREATE INDEX idx_active_interventions ON team_intervention_triggers (team_id, resolved_at) WHERE resolved_at IS NULL;

-- Real-time subscription for educator alerts
CREATE OR REPLACE FUNCTION notify_intervention_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Send real-time notification to educators
  PERFORM pg_notify(
    'intervention_alert',
    json_build_object(
      'team_id', NEW.team_id,
      'trigger_type', NEW.trigger_type,
      'confidence_score', NEW.confidence_score,
      'triggered_at', NEW.triggered_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intervention_notification_trigger
  AFTER INSERT ON team_intervention_triggers
  FOR EACH ROW EXECUTE FUNCTION notify_intervention_trigger();
```

---

## PBL Process Engine (REQ-2.1.*)

### Project Structure
```sql
-- PBL Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT NOT NULL,
  
  -- Real-world problem context (REQ-2.2.*)
  problem_statement TEXT NOT NULL,
  community_partner TEXT,
  authentic_audience BOOLEAN DEFAULT FALSE,
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- PBL Configuration
  pbl_methodology TEXT DEFAULT 'seven_jump' CHECK (pbl_methodology IN ('seven_jump', 'custom')),
  phase_configuration JSONB DEFAULT '[
    {"name": "problem_identification", "duration_days": 2},
    {"name": "learning_objectives", "duration_days": 3},  
    {"name": "research", "duration_days": 7},
    {"name": "analysis", "duration_days": 5},
    {"name": "synthesis", "duration_days": 7},
    {"name": "evaluation", "duration_days": 3},
    {"name": "reflection", "duration_days": 3}
  ]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Individual Reflection System (REQ-2.1.2)
```sql
-- Individual reflections at phase checkpoints
CREATE TABLE individual_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  pbl_phase TEXT NOT NULL CHECK (pbl_phase IN ('problem_identification', 'learning_objectives', 'research', 'analysis', 'synthesis', 'evaluation', 'reflection')),
  
  -- Reflection content
  reflection_prompt TEXT NOT NULL,
  reflection_content TEXT NOT NULL CHECK (length(reflection_content) >= 50),
  
  -- Quality assessment
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  depth_indicators JSONB, -- tracks critical thinking indicators
  
  -- Learning insights
  learning_insights TEXT[],
  next_steps TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One reflection per student per phase per project
  UNIQUE(student_id, project_id, pbl_phase)
);

-- Reflection quality analysis function
CREATE OR REPLACE FUNCTION analyze_reflection_quality()
RETURNS TRIGGER AS $$
DECLARE
  quality_indicators INTEGER := 0;
BEGIN
  -- Simple quality scoring based on content analysis
  IF length(NEW.reflection_content) > 200 THEN quality_indicators := quality_indicators + 2; END IF;
  IF NEW.reflection_content ~* '\b(because|therefore|however|although|despite)\b' THEN quality_indicators := quality_indicators + 2; END IF;
  IF NEW.reflection_content ~* '\b(learned|realized|discovered|understood)\b' THEN quality_indicators := quality_indicators + 2; END IF;
  IF NEW.reflection_content ~* '\b(next|future|improve|apply)\b' THEN quality_indicators := quality_indicators + 2; END IF;
  
  NEW.quality_score := LEAST(10, GREATEST(1, quality_indicators));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reflection_quality_trigger
  BEFORE INSERT OR UPDATE ON individual_reflections
  FOR EACH ROW EXECUTE FUNCTION analyze_reflection_quality();
```

---

## AI Coaching Integration (REQ-3.1.*)

### AI Usage Tracking (REQ-3.1.2)
```sql
-- Complete AI interaction logging for academic integrity
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  
  -- Context information
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('coaching_request', 'process_guidance', 'learning_gap_analysis', 'reflection_support')),
  
  -- AI interaction details
  prompt_context JSONB NOT NULL,
  prompt_text TEXT NOT NULL,
  response_text TEXT,
  
  -- Academic integrity tracking
  contains_direct_answers BOOLEAN DEFAULT FALSE,
  academic_integrity_flags TEXT[],
  educator_reviewed BOOLEAN DEFAULT FALSE,
  
  -- Quality and effectiveness
  response_quality_rating INTEGER CHECK (response_quality_rating >= 1 AND response_quality_rating <= 10),
  student_helpfulness_rating INTEGER CHECK (student_helpfulness_rating >= 1 AND student_helpfulness_rating <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE ai_usage_2025_08 PARTITION OF ai_usage
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE ai_usage_2025_09 PARTITION OF ai_usage
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- RLS: Students see their own AI usage
CREATE POLICY "students_own_ai_usage" ON ai_usage
FOR ALL USING (auth.uid() = user_id);

-- RLS: Educators see AI usage for their students (transparency)
CREATE POLICY "educators_ai_transparency" ON ai_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN student_enrollments se ON se.course_id = ce.course_id
    WHERE ce.educator_id = auth.uid()
    AND se.student_id = ai_usage.user_id
  )
);
```

---

## Performance Optimization

### Indexing Strategy
```sql
-- Performance indexes for common queries
CREATE INDEX idx_objectives_student_project ON individual_learning_objectives (student_id, project_id, progress_status);
CREATE INDEX idx_assessments_project_date ON individual_assessments (project_id, assessment_date DESC);
CREATE INDEX idx_reflections_student_phase ON individual_reflections (student_id, pbl_phase, created_at DESC);
CREATE INDEX idx_ai_usage_student_date ON ai_usage (user_id, created_at DESC);
CREATE INDEX idx_team_interventions_active ON team_intervention_triggers (team_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_team_activities_recent ON team_activities (team_id, timestamp DESC) WHERE timestamp > NOW() - INTERVAL '30 days';

-- Partial indexes for active projects
CREATE INDEX idx_active_projects ON projects (id, start_date, end_date) WHERE start_date <= NOW() AND end_date >= NOW();

-- Composite indexes for complex queries
CREATE INDEX idx_student_course_projects ON individual_learning_objectives (student_id, project_id) 
INCLUDE (objective_description, competency_level, progress_status);
```

### Database Functions
```sql
-- Get student progress summary
CREATE OR REPLACE FUNCTION get_student_progress(p_student_id UUID, p_project_id UUID)
RETURNS TABLE (
  total_objectives INTEGER,
  completed_objectives INTEGER,
  avg_competency_level DECIMAL,
  reflection_count INTEGER,
  ai_usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_objectives,
    COUNT(*) FILTER (WHERE progress_status = 'completed')::INTEGER as completed_objectives,
    ROUND(AVG(competency_level), 2) as avg_competency_level,
    (SELECT COUNT(*)::INTEGER FROM individual_reflections 
     WHERE student_id = p_student_id AND project_id = p_project_id) as reflection_count,
    (SELECT COUNT(*)::INTEGER FROM ai_usage 
     WHERE user_id = p_student_id AND project_context->>'projectId' = p_project_id::text) as ai_usage_count
  FROM individual_learning_objectives 
  WHERE student_id = p_student_id AND project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Data Compliance & Security

### FERPA Compliance
```sql
-- Audit log for all educational data access
CREATE TABLE ferpa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  student_data_accessed UUID[], -- Array of student IDs whose data was accessed
  ip_address INET,
  user_agent TEXT,
  educational_justification TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Compliance tracking
  compliance_review_needed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Automatic FERPA audit logging function
CREATE OR REPLACE FUNCTION log_ferpa_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to student data
  IF TG_TABLE_NAME IN ('individual_learning_objectives', 'individual_assessments', 'individual_reflections', 'ai_usage') THEN
    INSERT INTO ferpa_audit_log (
      user_id, action, resource_type, resource_id, 
      student_data_accessed, educational_justification
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
      ARRAY[COALESCE(NEW.student_id, NEW.user_id, OLD.student_id, OLD.user_id)],
      'Academic progress monitoring and assessment'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply FERPA logging to all student data tables
CREATE TRIGGER ferpa_log_objectives AFTER INSERT OR UPDATE OR DELETE ON individual_learning_objectives
FOR EACH ROW EXECUTE FUNCTION log_ferpa_access();

CREATE TRIGGER ferpa_log_assessments AFTER INSERT OR UPDATE OR DELETE ON individual_assessments
FOR EACH ROW EXECUTE FUNCTION log_ferpa_access();

CREATE TRIGGER ferpa_log_reflections AFTER INSERT OR UPDATE OR DELETE ON individual_reflections
FOR EACH ROW EXECUTE FUNCTION log_ferpa_access();

CREATE TRIGGER ferpa_log_ai_usage AFTER INSERT OR UPDATE OR DELETE ON ai_usage
FOR EACH ROW EXECUTE FUNCTION log_ferpa_access();
```

---

## Migration Scripts

### Initial Schema Setup
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set up Row Level Security
ALTER TABLE individual_learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON individual_learning_objectives
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

*This database schema ensures individual assessment integrity, educator facilitation support, and complete FERPA compliance while maintaining high performance for real-time collaborative learning.*
