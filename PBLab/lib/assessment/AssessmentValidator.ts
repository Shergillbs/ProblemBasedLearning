import { IndividualLearningObjective, EvidenceArtifact } from '@/lib/database/objectives'

// Types for Assessment Validation
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface IndividualAssessment {
  id?: string
  student_id: string
  project_id: string
  learning_objective_id: string
  competency_achievement?: number
  assessment_score?: number
  educator_feedback?: string
  assessed_by?: string
  assessment_date?: string
  status: 'submitted' | 'under_review' | 'completed'
}

export interface CompetencyFramework {
  competency_areas: CompetencyArea[]
  assessment_criteria: AssessmentCriteria[]
  // Explicitly exclude team_grade, team_score, and any team-based properties
}

export interface CompetencyArea {
  id: string
  name: string
  description: string
  individual_criteria: string[]
  // NO team_criteria allowed
}

export interface AssessmentCriteria {
  id: string
  description: string
  individual_weight: number
  competency_levels: CompetencyLevel[]
  // NO team_weight or team-based criteria allowed
}

export interface CompetencyLevel {
  level: 1 | 2 | 3 | 4 | 5
  description: string
  individual_indicators: string[]
  // NO team_indicators allowed
}

/**
 * AssessmentValidator - Enforces Individual Assessment Architecture (REQ-1.1.*)
 * 
 * This class ensures that ALL assessments are individual-only and prevents
 * any team-based grading from being introduced into the system.
 */
export class AssessmentValidator {
  
  /**
   * Validates that a learning objective is individual-only
   */
  static validateIndividualObjective(objective: IndividualLearningObjective): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check that objective is properly structured for individual assessment
    if (!objective.student_id) {
      errors.push('Learning objective must have a student_id (individual assessment required)')
    }

    if (!objective.objective_description || objective.objective_description.trim().length === 0) {
      errors.push('Learning objective must have a description')
    }

    if (objective.competency_level && (objective.competency_level < 1 || objective.competency_level > 5)) {
      errors.push('Competency level must be between 1 and 5')
    }

    // Check for any team-based language that should be flagged
    const teamKeywords = ['team grade', 'team score', 'group grade', 'collective assessment']
    const description = objective.objective_description?.toLowerCase() || ''
    
    teamKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        errors.push(`Learning objective description contains team-based language: "${keyword}". Individual assessment only.`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * CRITICAL: Prevents any form of team grading in assessment
   */
  static preventTeamGrading(assessment: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // List of forbidden team-based properties
    const forbiddenProperties = [
      'team_grade',
      'team_score', 
      'group_grade',
      'group_score',
      'team_assessment',
      'group_assessment',
      'team_competency',
      'group_competency',
      'collective_grade',
      'shared_grade'
    ]

    // Check for forbidden properties in the assessment object
    forbiddenProperties.forEach(prop => {
      if (assessment.hasOwnProperty(prop)) {
        errors.push(`FORBIDDEN: Team-based property "${prop}" detected. Individual assessment architecture requires individual-only grading.`)
      }
    })

    // Check for team-based properties in nested objects
    if (assessment.competency_framework) {
      this.validateCompetencyFramework(assessment.competency_framework, errors)
    }

    // Ensure required individual properties exist
    if (!assessment.student_id) {
      errors.push('Assessment must have student_id for individual assessment')
    }

    if (!assessment.learning_objective_id) {
      errors.push('Assessment must be linked to an individual learning objective')
    }

    // Check assessment data types
    if (assessment.competency_achievement && 
        (assessment.competency_achievement < 1 || assessment.competency_achievement > 5)) {
      errors.push('Competency achievement must be between 1 and 5')
    }

    if (assessment.assessment_score && 
        (assessment.assessment_score < 0 || assessment.assessment_score > 100)) {
      errors.push('Assessment score must be between 0 and 100')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates competency framework to ensure no team grading
   */
  private static validateCompetencyFramework(framework: any, errors: string[]): void {
    // Check for team-based properties in competency framework
    const forbiddenFrameworkProps = [
      'team_competencies',
      'group_competencies', 
      'team_criteria',
      'group_criteria',
      'team_weight',
      'group_weight'
    ]

    forbiddenFrameworkProps.forEach(prop => {
      if (framework.hasOwnProperty(prop)) {
        errors.push(`FORBIDDEN: Team-based competency framework property "${prop}" detected.`)
      }
    })

    // Validate competency areas
    if (framework.competency_areas) {
      framework.competency_areas.forEach((area: any, index: number) => {
        if (area.team_criteria || area.group_criteria) {
          errors.push(`FORBIDDEN: Team-based criteria found in competency area ${index}`)
        }
      })
    }

    // Validate assessment criteria
    if (framework.assessment_criteria) {
      framework.assessment_criteria.forEach((criteria: any, index: number) => {
        if (criteria.team_weight || criteria.group_weight) {
          errors.push(`FORBIDDEN: Team-based weight found in assessment criteria ${index}`)
        }
      })
    }
  }

  /**
   * Validates evidence portfolio for individual assessment
   */
  static validateEvidencePortfolio(artifacts: EvidenceArtifact[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!artifacts || artifacts.length === 0) {
      warnings.push('No evidence artifacts found. Portfolio development encouraged.')
      return { isValid: true, errors, warnings }
    }

    artifacts.forEach((artifact, index) => {
      // Ensure each artifact is linked to individual learning objective
      if (!artifact.learning_objective_id) {
        errors.push(`Evidence artifact ${index + 1} must be linked to an individual learning objective`)
      }

      if (!artifact.student_id) {
        errors.push(`Evidence artifact ${index + 1} must have student_id for individual assessment`)
      }

      // Validate artifact has content
      if (!artifact.file_path && !artifact.external_url) {
        errors.push(`Evidence artifact ${index + 1} must have either file_path or external_url`)
      }

      if (!artifact.title || artifact.title.trim().length === 0) {
        errors.push(`Evidence artifact ${index + 1} must have a title`)
      }

      // Check for team-based artifacts (should be individual)
      const teamKeywords = ['team project', 'group work', 'collective', 'shared']
      const title = artifact.title?.toLowerCase() || ''
      const description = artifact.description?.toLowerCase() || ''

      teamKeywords.forEach(keyword => {
        if (title.includes(keyword) || description.includes(keyword)) {
          warnings.push(`Evidence artifact "${artifact.title}" may contain team-based work. Ensure individual contribution is clearly identified.`)
        }
      })
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates minimum learning objectives requirement
   */
  static checkMinimumObjectives(objectives: IndividualLearningObjective[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const minRequired = 3

    if (objectives.length < minRequired) {
      errors.push(`Minimum ${minRequired} individual learning objectives required. Currently have ${objectives.length}.`)
    }

    // Check for duplicate objectives
    const descriptions = objectives.map(obj => obj.objective_description.toLowerCase().trim())
    const duplicates = descriptions.filter((desc, index) => descriptions.indexOf(desc) !== index)
    
    if (duplicates.length > 0) {
      warnings.push('Duplicate learning objectives detected. Consider consolidating similar objectives.')
    }

    // Check for properly distributed competency levels
    const competencyLevels = objectives
      .filter(obj => obj.competency_level)
      .map(obj => obj.competency_level!)

    if (competencyLevels.length > 0) {
      const avgLevel = competencyLevels.reduce((sum, level) => sum + level, 0) / competencyLevels.length
      
      if (avgLevel < 2) {
        warnings.push('Consider setting higher competency level targets for learning objectives')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Comprehensive assessment integrity check
   */
  static validateAssessmentIntegrity(
    assessment: IndividualAssessment,
    objective: IndividualLearningObjective,
    artifacts: EvidenceArtifact[]
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Prevent team grading
    const teamGradingValidation = this.preventTeamGrading(assessment)
    errors.push(...teamGradingValidation.errors)
    warnings.push(...teamGradingValidation.warnings)

    // 2. Validate individual objective
    const objectiveValidation = this.validateIndividualObjective(objective)
    errors.push(...objectiveValidation.errors)
    warnings.push(...objectiveValidation.warnings)

    // 3. Validate evidence portfolio
    const portfolioValidation = this.validateEvidencePortfolio(artifacts)
    errors.push(...portfolioValidation.errors)
    warnings.push(...portfolioValidation.warnings)

    // 4. Check consistency between assessment and objective
    if (assessment.student_id !== objective.student_id) {
      errors.push('Assessment student_id must match learning objective student_id')
    }

    if (assessment.project_id !== objective.project_id) {
      errors.push('Assessment project_id must match learning objective project_id')
    }

    if (assessment.learning_objective_id !== objective.id) {
      errors.push('Assessment must be linked to the correct learning objective')
    }

    // 5. Check artifacts belong to the same student and objective
    artifacts.forEach((artifact, index) => {
      if (artifact.student_id !== assessment.student_id) {
        errors.push(`Evidence artifact ${index + 1} student_id must match assessment student_id`)
      }
      if (artifact.learning_objective_id !== assessment.learning_objective_id) {
        errors.push(`Evidence artifact ${index + 1} must be linked to the same learning objective`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates that user has permission for individual assessment operations
   */
  static validateUserPermissions(
    userId: string,
    userRole: 'student' | 'educator' | 'admin',
    operation: 'create' | 'read' | 'update' | 'delete',
    targetStudentId: string
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Students can only operate on their own assessments
    if (userRole === 'student') {
      if (userId !== targetStudentId) {
        errors.push('Students can only access their own individual assessments')
      }
      
      if (operation === 'delete') {
        errors.push('Students cannot delete submitted assessments')
      }
    }

    // Educators can read and assess, but cannot create assessments for students
    if (userRole === 'educator') {
      if (operation === 'create') {
        errors.push('Educators cannot create assessments on behalf of students. Students must submit their own individual assessments.')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
