"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GraduationCap, BookOpen, Users } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock login - in real implementation, this would use Supabase
    setTimeout(() => {
      console.log("[v0] Mock login attempt:", { email })
      setLoading(false)
      // Redirect to dashboard
      window.location.href = "/"
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary font-sans">PBLab</h1>
          </div>
          <p className="text-muted-foreground">Problem-Based Learning Platform</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-sans">Welcome back</CardTitle>
            <CardDescription>Sign in to your PBLab account to continue learning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <BookOpen className="h-5 w-5 text-primary mx-auto" />
            </div>
            <p className="text-xs text-muted-foreground">Interactive Learning</p>
          </div>
          <div className="space-y-2">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Users className="h-5 w-5 text-primary mx-auto" />
            </div>
            <p className="text-xs text-muted-foreground">Team Collaboration</p>
          </div>
          <div className="space-y-2">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="h-5 w-5 bg-secondary rounded mx-auto flex items-center justify-center">
                <span className="text-xs font-bold text-secondary-foreground">AI</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">AI Tutoring</p>
          </div>
        </div>
      </div>
    </div>
  )
}
