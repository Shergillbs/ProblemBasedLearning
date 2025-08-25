import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getLearningObjectivesWithProgress, 
  getEvidencePortfolioCount,
  ObjectiveProgress 
} from '@/lib/database/objectives'
import { supabase } from '@/lib/supabase'

// Types for dashboard data
export interface Project {
  id: string
  project_name: string
  description: string
  course_name?: string
  team_name?: string
  current_phase: string
  individual_progress: number
  team_progress: number
  evidence_count: number
  total_evidence: number
  team_members: TeamMember[]
  artifacts_count: number
  comments_count: number
  reflections_count: number
}

export interface TeamMember {
  id: string
  full_name: string
  initials: string
}

export interface DashboardData {
  objectives: ObjectiveProgress[]
  projects: Project[]
  portfolioSummary: {
    current: number
    target: number
    percentage: number
  }
  loading: boolean
  error: string | null
}

export function useDashboardData() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    objectives: [],
    projects: [],
    portfolioSummary: { current: 0, target: 10, percentage: 0 },
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Get user profile to determine role
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Get projects for the user (different logic for students vs educators)
      let projectsQuery = supabase
        .from('projects')
        .select(`
          id,
          project_name,
          description,
          current_phase,
          course_id,
          teams!inner(
            id,
            team_name,
            team_members!inner(
              student_id,
              user_profiles(id, full_name)
            )
          )
        `)

      // For students, filter by team membership
      if (userProfile?.role === 'student') {
        projectsQuery = projectsQuery.eq('teams.team_members.student_id', user.id)
      }

      const { data: projectsData, error: projectsError } = await projectsQuery

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`)
      }

      // Process projects data
      const projects: Project[] = []
      const allObjectives: ObjectiveProgress[] = []
      let totalEvidenceCurrent = 0
      let totalEvidenceTarget = 0

      for (const project of projectsData || []) {
        // Get learning objectives and progress for this project
        const objectives = await getLearningObjectivesWithProgress(user.id, project.id)
        allObjectives.push(...objectives)

        // Get evidence portfolio count for this project
        const portfolioCount = await getEvidencePortfolioCount(user.id, project.id)
        totalEvidenceCurrent += portfolioCount.current
        totalEvidenceTarget += portfolioCount.target

        // Calculate individual progress (average of objective progress)
        const individualProgress = objectives.length > 0
          ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress_percentage, 0) / objectives.length)
          : 0

        // Mock team progress (would be calculated differently in real implementation)
        const teamProgress = Math.max(0, individualProgress - 10)

        // Get team members and format them
        const team = project.teams?.[0]
        const teamMembers: TeamMember[] = team?.team_members?.map((member: any) => ({
          id: member.user_profiles.id,
          full_name: member.user_profiles.full_name,
          initials: member.user_profiles.full_name
            .split(' ')
            .map((name: string) => name.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase()
        })) || []

        projects.push({
          id: project.id,
          project_name: project.project_name,
          description: project.description,
          course_name: undefined, // Will be implemented when course data is needed
          team_name: team?.team_name,
          current_phase: project.current_phase,
          individual_progress: individualProgress,
          team_progress: teamProgress,
          evidence_count: portfolioCount.current,
          total_evidence: portfolioCount.target,
          team_members: teamMembers,
          artifacts_count: portfolioCount.current,
          comments_count: Math.floor(Math.random() * 20) + 5, // Mock data
          reflections_count: objectives.filter(obj => obj.objective.progress_status === 'completed').length
        })
      }

      // Calculate overall portfolio summary
      const portfolioSummary = {
        current: totalEvidenceCurrent,
        target: Math.max(totalEvidenceTarget, 10),
        percentage: totalEvidenceTarget > 0 
          ? Math.round((totalEvidenceCurrent / totalEvidenceTarget) * 100)
          : 0
      }

      setData({
        objectives: allObjectives,
        projects,
        portfolioSummary,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }))
    }
  }

  const refreshData = () => {
    fetchDashboardData()
  }

  return {
    ...data,
    refreshData
  }
}

// Utility function to format PBL phase for display
export function formatPBLPhase(phase: string): { label: string; number: string } {
  const phaseMap: Record<string, { label: string; number: string }> = {
    'problem_identification': { label: 'Clarification', number: 'Jump 1' },
    'learning_objectives': { label: 'Learning Goals', number: 'Jump 2' },
    'research': { label: 'Research', number: 'Jump 3' },
    'analysis': { label: 'Analysis', number: 'Jump 4' },
    'synthesis': { label: 'Synthesis', number: 'Jump 5' },
    'evaluation': { label: 'Evaluation', number: 'Jump 6' },
    'reflection': { label: 'Reflection', number: 'Jump 7' }
  }

  return phaseMap[phase] || { label: phase, number: 'Unknown' }
}
