import { supabase } from '@/lib/supabase'

// Types for Individual Learning Objectives
export interface IndividualLearningObjective {
  id: string
  student_id: string
  project_id: string
  team_id?: string
  objective_description: string
  competency_level?: number
  progress_status: 'draft' | 'active' | 'completed' | 'revised'
  created_at: string
  updated_at: string
}

export interface EvidenceArtifact {
  id: string
  learning_objective_id: string
  student_id: string
  type: 'document' | 'presentation' | 'code' | 'reflection' | 'video' | 'image' | 'link'
  title: string
  description?: string
  file_path?: string
  external_url?: string
  upload_date: string
}

export interface ObjectiveProgress {
  objective: IndividualLearningObjective
  evidence_count: number
  total_evidence_target: number
  progress_percentage: number
}

// Create a new learning objective
export async function createLearningObjective(
  objective: Omit<IndividualLearningObjective, 'id' | 'created_at' | 'updated_at'>
): Promise<IndividualLearningObjective> {
  const { data, error } = await supabase
    .from('individual_learning_objectives')
    .insert([objective])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create learning objective: ${error.message}`)
  }

  return data
}

// Get learning objectives for a student in a project
export async function getLearningObjectives(
  studentId: string, 
  projectId: string
): Promise<IndividualLearningObjective[]> {
  const { data, error } = await supabase
    .from('individual_learning_objectives')
    .select('*')
    .eq('student_id', studentId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch learning objectives: ${error.message}`)
  }

  return data || []
}

// Get learning objectives with progress information
export async function getLearningObjectivesWithProgress(
  studentId: string, 
  projectId: string
): Promise<ObjectiveProgress[]> {
  // Get objectives with evidence count
  const { data, error } = await supabase
    .from('individual_learning_objectives')
    .select(`
      *,
      evidence_artifacts(count)
    `)
    .eq('student_id', studentId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch objectives with progress: ${error.message}`)
  }

  // Transform data to include progress calculation
  return (data || []).map(obj => {
    const evidenceCount = obj.evidence_artifacts?.[0]?.count || 0
    const targetEvidence = 10 // Default target for portfolio completion
    
    return {
      objective: {
        id: obj.id,
        student_id: obj.student_id,
        project_id: obj.project_id,
        team_id: obj.team_id,
        objective_description: obj.objective_description,
        competency_level: obj.competency_level,
        progress_status: obj.progress_status,
        created_at: obj.created_at,
        updated_at: obj.updated_at
      },
      evidence_count: evidenceCount,
      total_evidence_target: targetEvidence,
      progress_percentage: Math.min(Math.round((evidenceCount / targetEvidence) * 100), 100)
    }
  })
}

// Update learning objective progress
export async function updateObjectiveProgress(
  objectiveId: string, 
  progress: 'draft' | 'active' | 'completed' | 'revised'
): Promise<void> {
  const { error } = await supabase
    .from('individual_learning_objectives')
    .update({ 
      progress_status: progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', objectiveId)

  if (error) {
    throw new Error(`Failed to update objective progress: ${error.message}`)
  }
}

// Update learning objective details
export async function updateLearningObjective(
  objectiveId: string,
  updates: Partial<Pick<IndividualLearningObjective, 'objective_description' | 'competency_level' | 'progress_status'>>
): Promise<IndividualLearningObjective> {
  const { data, error } = await supabase
    .from('individual_learning_objectives')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', objectiveId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update learning objective: ${error.message}`)
  }

  return data
}

// Delete learning objective
export async function deleteLearningObjective(objectiveId: string): Promise<void> {
  const { error } = await supabase
    .from('individual_learning_objectives')
    .delete()
    .eq('id', objectiveId)

  if (error) {
    throw new Error(`Failed to delete learning objective: ${error.message}`)
  }
}

// Validate minimum objectives requirement (3 per student per project)
export async function validateMinimumObjectives(
  studentId: string, 
  projectId: string
): Promise<{ isValid: boolean; currentCount: number; required: number }> {
  const objectives = await getLearningObjectives(studentId, projectId)
  const currentCount = objectives.length
  const required = 3 // Minimum as per requirements

  return {
    isValid: currentCount >= required,
    currentCount,
    required
  }
}

// Get evidence artifacts for a learning objective
export async function getEvidenceArtifacts(
  learningObjectiveId: string
): Promise<EvidenceArtifact[]> {
  const { data, error } = await supabase
    .from('evidence_artifacts')
    .select('*')
    .eq('learning_objective_id', learningObjectiveId)
    .order('upload_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch evidence artifacts: ${error.message}`)
  }

  return data || []
}

// Get total evidence portfolio count for student
export async function getEvidencePortfolioCount(
  studentId: string,
  projectId: string
): Promise<{ current: number; target: number; percentage: number }> {
  // Get all objectives for student in project
  const objectives = await getLearningObjectives(studentId, projectId)
  
  if (objectives.length === 0) {
    return { current: 0, target: 10, percentage: 0 }
  }

  // Get evidence count across all objectives
  const { data, error } = await supabase
    .from('evidence_artifacts')
    .select('id')
    .eq('student_id', studentId)
    .in('learning_objective_id', objectives.map(obj => obj.id))

  if (error) {
    throw new Error(`Failed to fetch evidence portfolio count: ${error.message}`)
  }

  const current = data?.length || 0
  const target = 10 // Default portfolio target
  const percentage = Math.round((current / target) * 100)

  return { current, target, percentage }
}

// Create evidence artifact
export async function createEvidenceArtifact(
  artifact: Omit<EvidenceArtifact, 'id' | 'upload_date'>
): Promise<EvidenceArtifact> {
  const { data, error } = await supabase
    .from('evidence_artifacts')
    .insert([{
      ...artifact,
      upload_date: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create evidence artifact: ${error.message}`)
  }

  return data
}
