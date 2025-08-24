"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Brain, Send, BookOpen, Lightbulb, MessageSquare, TrendingUp } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

export default function AITutorPage() {
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
                  <Brain className="h-5 w-5 text-secondary" />
                  <h2 className="text-lg font-semibold text-secondary">AI Learning Assistant</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI Capabilities */}
              <Card className="border-secondary/20 bg-secondary/5">
                <CardHeader>
                  <CardTitle className="text-secondary">AI Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-secondary" />
                    <span>Concept Explanation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-secondary" />
                    <span>Resource Recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-secondary" />
                    <span>Socratic Questioning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span>Progress Tracking</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Topics */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-left bg-transparent">
                    Epidemiology Basics
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left bg-transparent">
                    Disease Transmission
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left bg-transparent">
                    Statistical Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left bg-transparent">
                    Public Health Policy
                  </Button>
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Concepts Mastered</span>
                      <Badge variant="secondary">12/20</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Questions Asked</span>
                      <Badge variant="secondary">47</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Study Sessions</span>
                      <Badge variant="secondary">8</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-secondary" />
                    AI Learning Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions, explore concepts, and get personalized guidance for your PBL journey
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-0">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* AI Welcome Message */}
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-white">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary/10 rounded-lg p-4 max-w-md">
                          <p className="text-sm">
                            Hello! I'm your AI Learning Assistant. I'm here to help you navigate through your
                            Problem-Based Learning journey. I can explain concepts, suggest resources, ask
                            thought-provoking questions, and guide your thinking process.
                          </p>
                          <p className="text-sm mt-2">What would you like to explore today?</p>
                        </div>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-md">
                          <p className="text-sm">
                            I'm working on the outbreak simulation project. Can you help me understand the difference
                            between R0 and effective reproduction number?
                          </p>
                        </div>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* AI Response */}
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-white">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary/10 rounded-lg p-4 max-w-md">
                          <p className="text-sm mb-3">Great question! Let me break this down for you:</p>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>R₀ (Basic Reproduction Number):</strong> The average number of secondary
                              infections caused by one infected person in a completely susceptible population, with no
                              interventions.
                            </p>
                            <p>
                              <strong>Effective Reproduction Number (Rt):</strong> The actual average number of
                              secondary infections at time t, accounting for immunity, interventions, and behavioral
                              changes.
                            </p>
                          </div>
                          <p className="text-sm mt-3">
                            Think about your outbreak scenario - how might these numbers differ as the epidemic
                            progresses?
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* User Follow-up */}
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-md">
                          <p className="text-sm">
                            So Rt would decrease as more people become immune or as public health measures are
                            implemented?
                          </p>
                        </div>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* AI Response with Resources */}
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-white">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary/10 rounded-lg p-4 max-w-md">
                          <p className="text-sm mb-3">
                            Exactly! You're thinking like an epidemiologist. Rt typically decreases due to:
                          </p>
                          <ul className="text-sm space-y-1 ml-4 list-disc">
                            <li>Depletion of susceptible individuals</li>
                            <li>Public health interventions (masks, distancing)</li>
                            <li>Behavioral changes in the population</li>
                            <li>Seasonal factors</li>
                          </ul>
                          <div className="mt-3 p-2 bg-white rounded border">
                            <p className="text-xs font-medium">📚 Recommended Resource:</p>
                            <p className="text-xs">
                              "Epidemiology: An Introduction" - Chapter 4: Transmission Dynamics
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input placeholder="Ask a question or describe what you're working on..." className="flex-1" />
                      <Button size="icon" className="bg-secondary hover:bg-secondary/90">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">
                        Explain this concept
                      </Button>
                      <Button variant="outline" size="sm">
                        Find resources
                      </Button>
                      <Button variant="outline" size="sm">
                        Check my understanding
                      </Button>
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
