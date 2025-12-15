"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e) => {
    e.preventDefault()

    // Simulated authentication
    if (username && password) {
      localStorage.setItem("isAuthenticated", "true")
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-accent/20">
      <Card className="w-full max-w-md p-8 backdrop-blur-sm bg-card/80 border-primary/20 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2 tracking-tight">PRSNT</h1>
          <p className="text-muted-foreground">Tutor Attendance Tracker</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-background/50 border-primary/30 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-primary/30 focus:border-accent"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-lg shadow-lg"
          >
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
