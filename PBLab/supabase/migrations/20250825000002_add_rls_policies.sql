-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Enable and configure RLS for data isolation and FERPA compliance
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES RLS POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT TO authenticated
USING ( (select auth.uid()) = id );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = id )
WITH CHECK ( (select auth.uid()) = id );

-- Users can insert their own profile (signup)
CREATE POLICY "Users can create their own profile" ON user_profiles
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = id );

-- ============================================================================
-- INDIVIDUAL LEARNING OBJECTIVES RLS POLICIES
-- ============================================================================

-- Students can view their own objectives
CREATE POLICY "Students can view their own objectives" ON individual_learning_objectives
FOR SELECT TO authenticated
USING ( (select auth.uid()) = student_id );

-- Students can create their own objectives
CREATE POLICY "Students can create their own objectives" ON individual_learning_objectives
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = student_id );

-- Students can update their own objectives
CREATE POLICY "Students can update their own objectives" ON individual_learning_objectives
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = student_id )
WITH CHECK ( (select auth.uid()) = student_id );

-- Students can delete their own objectives
CREATE POLICY "Students can delete their own objectives" ON individual_learning_objectives
FOR DELETE TO authenticated
USING ( (select auth.uid()) = student_id );

-- ============================================================================
-- EVIDENCE ARTIFACTS RLS POLICIES
-- ============================================================================

-- Students can view their own evidence
CREATE POLICY "Students can view their own evidence" ON evidence_artifacts
FOR SELECT TO authenticated
USING ( (select auth.uid()) = student_id );

-- Students can create their own evidence
CREATE POLICY "Students can create their own evidence" ON evidence_artifacts
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = student_id );

-- Students can update their own evidence
CREATE POLICY "Students can update their own evidence" ON evidence_artifacts
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = student_id )
WITH CHECK ( (select auth.uid()) = student_id );

-- Students can delete their own evidence
CREATE POLICY "Students can delete their own evidence" ON evidence_artifacts
FOR DELETE TO authenticated
USING ( (select auth.uid()) = student_id );

-- ============================================================================
-- INDIVIDUAL ASSESSMENTS RLS POLICIES
-- ============================================================================

-- Students can view their own assessments
CREATE POLICY "Students can view their own assessments" ON individual_assessments
FOR SELECT TO authenticated
USING ( (select auth.uid()) = student_id );

-- Only educators can create assessments (prevent students from self-grading)
CREATE POLICY "Educators can create assessments" ON individual_assessments
FOR INSERT TO authenticated
WITH CHECK ( 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('educator', 'admin')
  )
);

-- Only educators can update assessments
CREATE POLICY "Educators can update assessments" ON individual_assessments
FOR UPDATE TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('educator', 'admin')
  )
)
WITH CHECK ( 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('educator', 'admin')
  )
);

-- ============================================================================
-- INDIVIDUAL REFLECTIONS RLS POLICIES
-- ============================================================================

-- Students can view their own reflections
CREATE POLICY "Students can view their own reflections" ON individual_reflections
FOR SELECT TO authenticated
USING ( (select auth.uid()) = student_id );

-- Students can create their own reflections
CREATE POLICY "Students can create their own reflections" ON individual_reflections
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) = student_id );

-- Students can update their own reflections
CREATE POLICY "Students can update their own reflections" ON individual_reflections
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = student_id )
WITH CHECK ( (select auth.uid()) = student_id );

-- ============================================================================
-- ADMIN BYPASS POLICIES (Service Role Access)
-- ============================================================================

-- Service role can bypass RLS for testing and admin operations
-- Grant full access to service_role for testing and admin operations

-- Allow service_role to bypass RLS on user_profiles
CREATE POLICY "Service role can manage all profiles" ON user_profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to bypass RLS on individual_learning_objectives  
CREATE POLICY "Service role can manage all objectives" ON individual_learning_objectives
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to bypass RLS on evidence_artifacts
CREATE POLICY "Service role can manage all evidence" ON evidence_artifacts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to bypass RLS on individual_assessments
CREATE POLICY "Service role can manage all assessments" ON individual_assessments
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to bypass RLS on individual_reflections
CREATE POLICY "Service role can manage all reflections" ON individual_reflections
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
