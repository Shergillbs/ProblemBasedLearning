"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare, FileText, Calendar, Clock, TrendingUp, Star } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

export default function TeamsPage() {
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
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">My Teams</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
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
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="active">Active Teams</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Card 1 */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Outbreak Investigation Team</CardTitle>
                        <CardDescription>Epidemiology & Public Health</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                        Phase 2
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Project Progress</span>
                        <span className="text-sm text-muted-foreground">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>

                    {/* Team Members */}
                    <div>
                      <p className="text-sm font-medium mb-2">Team Members</p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>AS</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>MJ</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>DL</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>SK</AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">4 members</span>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Activity</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Maria uploaded transmission model</span>
                          <span className="text-xs">2h ago</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>New discussion thread started</span>
                          <span className="text-xs">4h ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Project
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Card 2 */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">EcoBalance Solutions</CardTitle>
                        <CardDescription>Environmental Science</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Phase 1
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Project Progress</span>
                        <span className="text-sm text-muted-foreground">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>

                    {/* Team Members */}
                    <div>
                      <p className="text-sm font-medium mb-2">Team Members</p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>AS</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>JW</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>RT</AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">3 members</span>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Activity</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Pre-discussion phase started</span>
                          <span className="text-xs">1d ago</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Team formation completed</span>
                          <span className="text-xs">2d ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Project
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance Card */}
                <Card className="lg:col-span-2 border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Team Performance Overview
                    </CardTitle>
                    <CardDescription>Your collaboration and learning metrics across all teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">4.8</div>
                        <div className="text-sm text-muted-foreground">Avg Team Rating</div>
                        <div className="flex justify-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">12</div>
                        <div className="text-sm text-muted-foreground">Projects Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">89%</div>
                        <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">156</div>
                        <div className="text-sm text-muted-foreground">Peer Interactions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Climate Change Analysis</CardTitle>
                        <CardDescription>Environmental Science</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Final Score</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        A-
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">AS</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">LM</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">KP</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-sm text-muted-foreground">Completed 2 weeks ago</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View Project Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="archived" className="space-y-6 mt-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Archived Teams</h3>
                <p className="text-muted-foreground">Teams you've left or that have been archived will appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
