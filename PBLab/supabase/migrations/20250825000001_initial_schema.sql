-- ============================================================================
-- INDIVIDUAL ASSESSMENT SCHEMA (REQ-1.1.*)
-- Evidence-Based PBL Platform Database Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PROFILES AND AUTHENTICATION
-- ============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'admin')),
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Update trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ACADEMIC STRUCTURE
-- ============================================================================

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  description TEXT,
  educator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Projects table (main PBL containers)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  problem_statement TEXT NOT NULL,
  
  -- PBL methodology phases
  current_phase TEXT NOT NULL CHECK (current_phase IN (
    'problem_identification', 'learning_objectives', 'research', 
    'analysis', 'synthesis', 'evaluation', 'reflection'
  )) DEFAULT 'problem_identification',
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_team_size INTEGER NOT NULL DEFAULT 4,
  min_learning_objectives INTEGER NOT NULL DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Teams table (collaboration without grading)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_description TEXT,
  max_members INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table (many-to-many relationship)
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'coordinator')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, student_id)
);

-- ============================================================================
-- INDIVIDUAL ASSESSMENT CORE (REQ-1.1.1)
-- ============================================================================

-- Individual learning objectives (core assessment unit)
CREATE TABLE individual_learning_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  objective_description TEXT NOT NULL,
  competency_level INTEGER CHECK (competency_level >= 1 AND competency_level <= 5),
  
  progress_status TEXT NOT NULL CHECK (progress_status IN (
    'draft', 'active', 'completed', 'revised'
  )) DEFAULT 'draft',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Minimum 3 objectives per student per project
  CONSTRAINT unique_student_project UNIQUE (student_id, project_id, objective_description)
);

CREATE TRIGGER update_objectives_updated_at 
  BEFORE UPDATE ON individual_learning_objectives 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Evidence artifacts (portfolio items)
CREATE TABLE evidence_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_objective_id UUID REFERENCES individual_learning_objectives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'document', 'presentation', 'code', 'reflection', 'video', 'image', 'link'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  external_url TEXT,
  
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validation: Must have either file_path or external_url
  CONSTRAINT artifact_content_check CHECK (
    (file_path IS NOT NULL) OR (external_url IS NOT NULL)
  )
);

-- Individual assessments (prevents team grading)
CREATE TABLE individual_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  learning_objective_id UUID REFERENCES individual_learning_objectives(id) ON DELETE CASCADE,
  
  -- Assessment data (NO team grading fields allowed)
  competency_achievement INTEGER CHECK (competency_achievement >= 1 AND competency_achievement <= 5),
  assessment_score DECIMAL(5,2) CHECK (assessment_score >= 0 AND assessment_score <= 100),
  
  educator_feedback TEXT,
  assessed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  assessment_date TIMESTAMP WITH TIME ZONE,
  
  status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'completed')) DEFAULT 'submitted',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One assessment per student per learning objective
  CONSTRAINT unique_student_objective_assessment UNIQUE (student_id, learning_objective_id)
);

CREATE TRIGGER update_assessments_updated_at 
  BEFORE UPDATE ON individual_assessments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- PBL PROCESS ENGINE (REQ-2.1.*)
-- ============================================================================

-- Individual reflections (mandatory for phase transitions)
CREATE TABLE individual_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  pbl_phase TEXT NOT NULL CHECK (pbl_phase IN (
    'problem_identification', 'learning_objectives', 'research', 
    'analysis', 'synthesis', 'evaluation', 'reflection'
  )),
  
  reflection_prompt TEXT NOT NULL,
  reflection_content TEXT NOT NULL,
  
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  learning_insights TEXT[],
  next_steps TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EDUCATOR DASHBOARD (REQ-1.2.*)
-- ============================================================================

-- Team intervention tracking
CREATE TABLE team_intervention_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stalling', 'conflict', 'free_rider', 'off_track', 'low_engagement'
  )),
  
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_data JSONB NOT NULL,
  
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  educator_notified BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and authentication indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Project and course indexes
CREATE INDEX idx_projects_course_id ON projects(course_id);
CREATE INDEX idx_projects_current_phase ON projects(current_phase);
CREATE INDEX idx_teams_project_id ON teams(project_id);
CREATE INDEX idx_team_members_student_id ON team_members(student_id);

-- Individual assessment indexes
CREATE INDEX idx_objectives_student_project ON individual_learning_objectives(student_id, project_id);
CREATE INDEX idx_objectives_status ON individual_learning_objectives(progress_status);
CREATE INDEX idx_artifacts_objective_id ON evidence_artifacts(learning_objective_id);
CREATE INDEX idx_artifacts_student_id ON evidence_artifacts(student_id);
CREATE INDEX idx_assessments_student_id ON individual_assessments(student_id);
CREATE INDEX idx_assessments_project_id ON individual_assessments(project_id);

-- PBL process indexes
CREATE INDEX idx_reflections_student_project ON individual_reflections(student_id, project_id);
CREATE INDEX idx_reflections_phase ON individual_reflections(pbl_phase);
CREATE INDEX idx_interventions_team_id ON team_intervention_triggers(team_id);
CREATE INDEX idx_interventions_triggered_at ON team_intervention_triggers(triggered_at);
