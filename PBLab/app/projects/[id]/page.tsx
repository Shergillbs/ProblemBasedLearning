"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, FileText, Users, Clock, Brain, Target, BookOpen } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

export default function ProjectPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-primary">PBLab</h1>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h2 className="text-lg font-semibold">Outbreak Simulator</h2>
                  <p className="text-sm text-muted-foreground">Epidemiology & Public Health</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                  Jump 4: Analysis
                </Badge>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
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
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    7-Jump PBL Methodology Progress
                  </CardTitle>
                  <CardDescription>Evidence-based Problem-Based Learning workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Jump 4: Analysis & Synthesis</span>
                      <span className="text-sm text-muted-foreground">75% Complete</span>
                    </div>
                    <Progress value={75} className="h-2" />

                    <div className="grid grid-cols-4 gap-2 mt-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mx-auto mb-1 text-xs font-bold">
                          ✓
                        </div>
                        <p className="text-xs font-medium">Jump 1</p>
                        <p className="text-xs text-muted-foreground">Clarification</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mx-auto mb-1 text-xs font-bold">
                          ✓
                        </div>
                        <p className="text-xs font-medium">Jump 2</p>
                        <p className="text-xs text-muted-foreground">Problem Definition</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mx-auto mb-1 text-xs font-bold">
                          ✓
                        </div>
                        <p className="text-xs font-medium">Jump 3</p>
                        <p className="text-xs text-muted-foreground">Brainstorming</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white mx-auto mb-1 text-xs font-bold">
                          4
                        </div>
                        <p className="text-xs font-medium">Jump 4</p>
                        <p className="text-xs text-muted-foreground">Analysis</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground mx-auto mb-1 text-xs font-bold">
                          5
                        </div>
                        <p className="text-xs font-medium">Jump 5</p>
                        <p className="text-xs text-muted-foreground">Learning Objectives</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground mx-auto mb-1 text-xs font-bold">
                          6
                        </div>
                        <p className="text-xs font-medium">Jump 6</p>
                        <p className="text-xs text-muted-foreground">Self-Study</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground mx-auto mb-1 text-xs font-bold">
                          7
                        </div>
                        <p className="text-xs font-medium">Jump 7</p>
                        <p className="text-xs text-muted-foreground">Reporting</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Content Tabs */}
              <Tabs defaultValue="problem" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="problem">Problem</TabsTrigger>
                  <TabsTrigger value="objectives">Objectives</TabsTrigger>
                  <TabsTrigger value="research">Research</TabsTrigger>
                  <TabsTrigger value="artifacts">Evidence</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                </TabsList>

                <TabsContent value="problem" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Problem Statement</CardTitle>
                      <CardDescription>Understanding the challenge we're solving</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p>
                          A mysterious outbreak has occurred in a metropolitan area. As epidemiologists, your team must
                          investigate the source, track transmission patterns, and develop intervention strategies to
                          contain the spread.
                        </p>
                        <h4>Key Questions:</h4>
                        <ul>
                          <li>What is the likely source of the outbreak?</li>
                          <li>How is the disease spreading through the population?</li>
                          <li>What public health measures should be implemented?</li>
                          <li>How can we model future transmission scenarios?</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="objectives" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Individual Learning Objectives
                      </CardTitle>
                      <CardDescription>Your personal learning goals for this project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">Epidemiological Investigation Methods</h4>
                            <Badge variant="secondary">75% Complete</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Master the systematic approach to outbreak investigation including case definition, data
                            collection, and hypothesis testing.
                          </p>
                          <Progress value={75} className="h-2 mb-2" />
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              Evidence: 3/4
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Reflection: Complete
                            </Badge>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">Statistical Analysis in Public Health</h4>
                            <Badge variant="outline">60% Complete</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Apply statistical methods to analyze epidemiological data and interpret results for public
                            health decision-making.
                          </p>
                          <Progress value={60} className="h-2 mb-2" />
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              Evidence: 2/4
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Reflection: Pending
                            </Badge>
                          </div>
                        </div>

                        <Button variant="outline" className="w-full bg-transparent">
                          <Target className="h-4 w-4 mr-2" />
                          Add Learning Objective
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="research" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Research Resources</CardTitle>
                      <CardDescription>Curated materials and findings from your investigation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">CDC Outbreak Investigation Guidelines</h4>
                            <p className="text-sm text-muted-foreground">
                              Comprehensive framework for epidemiological investigations
                            </p>
                            <Badge variant="outline" className="mt-1">
                              PDF Resource
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                          <FileText className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">Disease Transmission Models</h4>
                            <p className="text-sm text-muted-foreground">
                              Mathematical models for understanding epidemic spread
                            </p>
                            <Badge variant="outline" className="mt-1">
                              Research Paper
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="artifacts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Evidence Portfolio
                      </CardTitle>
                      <CardDescription>Individual competency evidence and team deliverables</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-medium text-primary mb-1">Individual Evidence</h4>
                          <p className="text-sm text-muted-foreground mb-3">Your personal competency demonstrations</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-1">Case Analysis Reflection</h5>
                              <p className="text-xs text-muted-foreground mb-2">
                                Individual critical thinking evidence
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  Complete
                                </Badge>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  View
                                </Button>
                              </div>
                            </div>

                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-1">Statistical Analysis</h5>
                              <p className="text-xs text-muted-foreground mb-2">Quantitative skills demonstration</p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  In Progress
                                </Badge>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-l-4 border-accent pl-4">
                          <h4 className="font-medium text-accent mb-1">Team Deliverables</h4>
                          <p className="text-sm text-muted-foreground mb-3">Collaborative work products</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-1">Epidemiological Report</h5>
                              <p className="text-xs text-muted-foreground mb-2">Team investigation findings</p>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  Draft
                                </Badge>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  View
                                </Button>
                              </div>
                            </div>

                            <div className="border rounded-lg p-3">
                              <h5 className="font-medium text-sm mb-1">Transmission Model</h5>
                              <p className="text-xs text-muted-foreground mb-2">Mathematical simulation</p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  In Progress
                                </Badge>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="discussion" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Discussion</CardTitle>
                      <CardDescription>Collaborative space for sharing insights and questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>AS</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm">
                                I think we should focus on the water supply as a potential source. The geographic
                                clustering suggests a common exposure point.
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>MJ</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm">
                                Good point! I've been looking at the timeline and there's definitely a pattern. Should
                                we run the SIR model with different R0 values?
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-secondary/20 bg-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Brain className="h-5 w-5" />
                    AI Learning Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Usage tracked • Educator visible • 8 interactions today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-secondary/10 rounded-lg p-3">
                      <p className="text-sm">
                        "Consider examining the incubation period patterns. What does this tell you about the
                        transmission mechanism?"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Ask AI Tutor
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Usage Log
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Alex Smith</p>
                        <p className="text-xs text-muted-foreground">Team Lead</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>MJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Maria Johnson</p>
                        <p className="text-xs text-muted-foreground">Researcher</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>DL</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">David Lee</p>
                        <p className="text-xs text-muted-foreground">Analyst</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Artifact
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
