"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Bell,
  BookOpen,
  Users,
  Brain,
  ChevronRight,
  Upload,
  MessageSquare,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useDashboardData, formatPBLPhase } from "@/hooks/useDashboardData"

export default function PBLabDashboard() {
  const { user, signOut } = useAuth()
  const { objectives, projects, portfolioSummary, loading, error, refreshData } = useDashboardData()
  
  // Get user role from user metadata or default to student
  const userRole = user?.user_metadata?.role || "student"
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"
  const userInitials = userName.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">PBLab</h1>
                  <p className="text-sm text-muted-foreground">Evidence-Based Problem-Based Learning</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {userRole === "educator" && (
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                      2
                    </span>
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{userName}</p>
                    <p className="text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <Button variant="secondary" className="w-full justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  My Teams
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Target className="h-4 w-4" />
                  Learning Objectives
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Brain className="h-4 w-4" />
                  AI Tutor
                </Button>
                {userRole === "educator" && (
                  <>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Analytics
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Interventions
                    </Button>
                  </>
                )}
              </nav>

              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-primary" />
                    Learning Objectives
                    {loading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-2 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-2 bg-muted animate-pulse rounded" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Failed to load objectives</span>
                    </div>
                  ) : objectives.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No learning objectives yet.
                      <br />
                      <span className="text-xs">Create at least 3 to get started!</span>
                    </div>
                  ) : (
                    <>
                      {objectives.slice(0, 2).map((objective) => (
                        <div key={objective.objective.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="truncate pr-2">{objective.objective.objective_description}</span>
                            <span className="text-primary">{objective.progress_percentage}%</span>
                          </div>
                          <Progress value={objective.progress_percentage} className="h-2" />
                        </div>
                      ))}
                      {objectives.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{objectives.length - 2} more objectives
                        </div>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="outline" className="w-full bg-transparent">
                    View All Objectives
                  </Button>
                </CardContent>
              </Card>

              {/* AI Tutor Quick Access */}
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-secondary" />
                    AI Learning Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">12 interactions today • Educator visible</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground font-serif">
                    Need help with your current project? Ask me anything!
                  </p>
                  <Button size="sm" className="w-full">
                    Start Conversation
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Welcome Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {userName.split(' ')[0]}!</h2>
                <p className="text-muted-foreground font-serif">
                  {loading ? (
                    "Loading your dashboard..."
                  ) : error ? (
                    "Unable to load dashboard data"
                  ) : userRole === "educator" ? (
                    "2 teams need intervention • 15 students active today"
                  ) : (
                    `You have ${projects.length} active project${projects.length !== 1 ? 's' : ''} and ${objectives.length} learning objective${objectives.length !== 1 ? 's' : ''} in progress.`
                  )}
                </p>
              </div>

              {/* Minimum Objectives Warning */}
              {!loading && !error && objectives.length < 3 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-5 w-5" />
                      Learning Objectives Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-700">
                      You need at least 3 individual learning objectives to participate fully in PBL activities. 
                      Currently you have {objectives.length}/3 objectives.
                    </p>
                    <Button size="sm" className="mt-3" variant="outline">
                      Create Learning Objectives
                    </Button>
                  </CardContent>
                </Card>
              )}

              {userRole === "educator" && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Intervention Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Team Beta - EcoBalance</p>
                          <p className="text-xs text-muted-foreground">No progress in 48 hours • Stuck in Phase 1</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Intervene
                        </Button>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Team Alpha - Outbreak Simulator</p>
                          <p className="text-xs text-muted-foreground">Low individual reflection scores</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Projects */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Active Projects</h3>
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-2 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-2 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : error ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>Failed to load projects</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : projects.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No active projects</p>
                        <p className="text-xs mt-1">Join a team to start collaborating!</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project) => {
                      const phaseInfo = formatPBLPhase(project.current_phase)
                      return (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{project.project_name}</CardTitle>
                                <CardDescription className="font-serif">
                                  {project.course_name || 'Course'} • {project.team_name || 'Team'}
                                </CardDescription>
                              </div>
                              <Badge variant={project.current_phase === 'analysis' ? 'secondary' : 'outline'}>
                                {phaseInfo.number}: {phaseInfo.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Individual Progress</span>
                                <span className="font-medium">{project.individual_progress}%</span>
                              </div>
                              <Progress value={project.individual_progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Team: {project.team_progress}%</span>
                                <span>Evidence Portfolio: {project.evidence_count}/{project.total_evidence}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {project.team_members.slice(0, 4).map((member) => (
                                  <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {project.team_members.length > 4 && (
                                  <div className="h-6 w-6 border-2 border-background rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{project.team_members.length - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {project.team_members.length} team member{project.team_members.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  <span>{project.artifacts_count} artifacts</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{project.comments_count} comments</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  <span>{project.reflections_count} reflections</span>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost">
                                Continue <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">MK</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Maya Kim</span> uploaded a new research document to{" "}
                          <span className="font-medium">Outbreak Simulator</span>
                        </p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                        <Brain className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">AI Tutor</span> provided feedback on your learning objectives
                          <Badge variant="outline" className="ml-2 text-xs">
                            Educator Visible
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">4 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">AL</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Alex Liu</span> commented on your simulation parameters
                        </p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
