"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, BookOpen, LogOut, Trash2, Edit2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EditClassModal } from "@/components/edit-class-modal"

interface Class {
  id: string
  name: string
  description: string | null
  target_days: number | null
  attendance_count: number
}

export default function DashboardPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [newClassName, setNewClassName] = useState("")
  const [targetDays, setTargetDays] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadClasses()
  }, [])

  const checkUserAndLoadClasses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    await loadClasses()
  }

  const loadClasses = async () => {
    setLoading(true)
    const { data: classesData, error } = await supabase
      .from("classes")
      .select("*, attendance(count)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading classes:", error)
      setLoading(false)
      return
    }

    const transformedClasses =
      classesData?.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        description: cls.description,
        target_days: cls.target_days,
        attendance_count: cls.attendance?.[0]?.count || 0,
      })) || []

    setClasses(transformedClasses)
    setLoading(false)
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newClassName.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No authenticated user")
      router.push("/auth/login")
      return
    }

    const targetDaysNum = targetDays.trim() ? Number.parseInt(targetDays) : null

    const { data, error } = await supabase
      .from("classes")
      .insert([
        {
          name: newClassName,
          target_days: targetDaysNum,
          user_id: user.id,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating class:", error)
      return
    }

    setNewClassName("")
    setTargetDays("")
    await loadClasses()
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setEditingClassId(classItem.id)
  }

  const handleSaveEditClass = async (name: string, targetDays: number | null) => {
    if (!editingClassId) return

    const { error } = await supabase
      .from("classes")
      .update({
        name,
        target_days: targetDays,
      })
      .eq("id", editingClassId)

    if (error) {
      console.error("Error updating class:", error)
      return
    }

    setEditingClassId(null)
    setEditingClass(null)
    await loadClasses()
  }

  const handleDeleteClass = async (classId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this class? All attendance records will be deleted.")) {
      return
    }

    const { error } = await supabase.from("classes").delete().eq("id", classId)

    if (error) {
      console.error("Error deleting class:", error)
      return
    }

    await loadClasses()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">PRSNT</h1>
            <p className="text-muted-foreground">Manage your classes and attendance</p>
          </div>
          <Button
            onClick={handleLogout}
            className="btn-neutral button-press border"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Create Class Form */}
        <Card className="p-6 mb-8 backdrop-blur-sm bg-card border border-soft shadow-md card-hover">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create New Class</h2>
          <form onSubmit={handleCreateClass} className="flex flex-col md:flex-row gap-3">
            <Input
              type="text"
              placeholder="Class Name (e.g., Algebra III - Spring 2026)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="flex-1 bg-background/50 border-soft focus:border-accent"
            />
            <Input
              type="number"
              placeholder="Target Days (optional)"
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
              className="md:w-48 bg-background/50 border-soft focus:border-accent"
              min="1"
            />
            <Button
              type="submit"
              className="btn-primary button-press font-semibold px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </form>
        </Card>

        {/* Classes List */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Classes</h2>
          {classes.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-sm bg-card border border-soft shadow-md card-hover">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No classes yet. Create your first class above!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => {
                const targetReached =
                  classItem.target_days !== null && classItem.attendance_count >= classItem.target_days

                return (
                  <Card
                    key={classItem.id}
                    className="p-6 backdrop-blur-sm bg-card border border-soft hover:border-primary/30 transition-all cursor-pointer shadow-md hover:shadow-lg card-hover"
                    onClick={() => router.push(`/class/${classItem.id}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg mb-2 break-words">{classItem.name}</h3>
                        <p
                          className={`text-sm font-semibold ${targetReached ? "text-[#F5C518]" : "text-muted-foreground"}`}
                        >
                          {classItem.attendance_count} / {classItem.target_days || "∞"} days
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClass(classItem)
                        }}
                        className="flex-1 btn-neutral button-press border text-sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => handleDeleteClass(classItem.id, e)}
                        className="flex-1 border border-destructive/30 text-destructive hover:bg-destructive/10 button-press text-sm bg-transparent"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {editingClass && editingClassId && (
        <EditClassModal
          classId={editingClassId}
          className={editingClass.name}
          targetDays={editingClass.target_days}
          onSave={handleSaveEditClass}
          onClose={() => {
            setEditingClassId(null)
            setEditingClass(null)
          }}
        />
      )}
    </div>
  )
}
