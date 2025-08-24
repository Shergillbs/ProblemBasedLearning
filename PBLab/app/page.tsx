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
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

export default function PBLabDashboard() {
  const userRole = "student" // Could be "student", "educator", or "admin"

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
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">Jordan Smith</p>
                    <p className="text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("mockUser")
                      window.location.href = "/login"
                    }}
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Epidemiology Mastery</span>
                      <span className="text-primary">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Statistical Analysis</span>
                      <span className="text-primary">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
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
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, Jordan!</h2>
                <p className="text-muted-foreground font-serif">
                  {userRole === "educator"
                    ? "2 teams need intervention • 15 students active today"
                    : "You have 2 active projects and 3 learning objectives in progress."}
                </p>
              </div>

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
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Project 1 - Outbreak Simulator */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">Outbreak Simulator</CardTitle>
                          <CardDescription className="font-serif">Epidemiology • Team Alpha</CardDescription>
                        </div>
                        <Badge variant="secondary">Jump 4: Analysis</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Individual Progress</span>
                          <span className="font-medium">75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Team: 65%</span>
                          <span>Evidence Portfolio: 8/10</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">JS</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">MK</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">AL</AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-sm text-muted-foreground">3 team members</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            <span>5 artifacts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>12 comments</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>3 reflections</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Continue <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project 2 - EcoBalance */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">EcoBalance</CardTitle>
                          <CardDescription className="font-serif">Environmental Science • Team Beta</CardDescription>
                        </div>
                        <Badge variant="outline">Jump 1: Clarification</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Individual Progress</span>
                          <span className="font-medium">30%</span>
                        </div>
                        <Progress value={30} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Team: 25%</span>
                          <span>Evidence Portfolio: 2/10</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">JS</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">RH</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">TC</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-xs">LM</AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-sm text-muted-foreground">4 team members</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            <span>2 artifacts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>8 comments</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>1 reflection</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Continue <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
