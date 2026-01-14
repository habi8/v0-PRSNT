"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, CheckCircle2, CalendarDays, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface ClassData {
  id: string
  name: string
  description: string | null
  target_days: number | null
}

interface AttendanceRecord {
  id: string
  date: string
}

export default function ClassAttendancePage() {
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isMarkedToday, setIsMarkedToday] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [classId])

  const checkUserAndLoadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    await loadClassData()
  }

  const loadClassData = async () => {
    // Load class info
    const { data: classInfo, error: classError } = await supabase.from("classes").select("*").eq("id", classId).single()

    if (classError || !classInfo) {
      console.error("Error loading class:", classError)
      router.push("/dashboard")
      return
    }

    setClassData(classInfo)

    // Load attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", classId)
      .order("date", { ascending: false })

    if (attendanceError) {
      console.error("Error loading attendance:", attendanceError)
      return
    }

    setAttendanceRecords(attendance || [])

    // Check if today is marked
    const today = new Date().toISOString().split("T")[0]
    setIsMarkedToday(attendance?.some((record) => record.date === today) || false)
  }

  const handleMarkAttendance = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase.from("attendance").insert([
      {
        class_id: classId,
        user_id: user.id,
        date: today,
      },
    ])

    if (error) {
      console.error("Error marking attendance:", error)
      return
    }

    await loadClassData()
  }

  const handleMarkMultipleDates = async () => {
    if (selectedDates.length === 0) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const dateRecords = selectedDates.map((date) => ({
      class_id: classId,
      user_id: user.id,
      date: date.toISOString().split("T")[0],
    }))

    const { error } = await supabase.from("attendance").insert(dateRecords)

    if (error) {
      console.error("Error marking multiple dates:", error)
      return
    }

    setShowCalendar(false)
    setSelectedDates([])
    await loadClassData()
  }

  const handleCancelAttendance = async (attendanceId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to cancel this attendance record?")) {
      return
    }

    const { error } = await supabase.from("attendance").delete().eq("id", attendanceId)

    if (error) {
      console.error("Error canceling attendance:", error)
      return
    }

    await loadClassData()
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateStr = date.toISOString().split("T")[0]
    const isAlreadyRecorded = attendanceRecords.some((record) => record.date === dateStr)

    if (isAlreadyRecorded) {
      alert("Attendance already recorded for this date")
      return
    }

    const isSelected = selectedDates.some((d) => d.toISOString().split("T")[0] === dateStr)

    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => d.toISOString().split("T")[0] !== dateStr))
    } else {
      setSelectedDates([...selectedDates, date])
    }
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const attendanceCount = attendanceRecords.length
  const targetReached = classData.target_days !== null && attendanceCount >= classData.target_days

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="mb-4 hover:bg-primary/10 button-press"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-balance">{classData.name}</h1>
              <p className="text-muted-foreground">Track your class attendance</p>
            </div>
            <Card className="p-4 backdrop-blur-sm bg-card/90 border-2 border-primary/40 shadow-lg card-hover">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Days Attended</p>
                <p className={`text-3xl font-bold ${targetReached ? "text-[#FFD700]" : "text-foreground"}`}>
                  {attendanceCount}
                </p>
                {classData.target_days && (
                  <p className="text-xs text-muted-foreground mt-1">/ {classData.target_days} target</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Mark Attendance Card */}
        <Card className="p-8 md:p-12 mb-8 backdrop-blur-sm bg-card/80 border-2 border-primary/40 shadow-xl text-center card-hover">
          <Calendar className="w-16 h-16 mx-auto mb-6 text-primary" />

          {isMarkedToday ? (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Attendance Already Recorded Today</h2>
              <div className="flex items-center justify-center gap-2 text-accent mb-6">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-lg font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <Button
                disabled
                className="bg-primary hover:bg-primary text-primary-foreground font-semibold py-6 px-8 text-lg cursor-not-allowed opacity-60"
              >
                Attendance Recorded
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Ready to Mark Today's Attendance?</h2>
              <p className="text-muted-foreground mb-6 text-lg">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Button
                onClick={handleMarkAttendance}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 px-8 text-lg shadow-lg hover:shadow-xl transition-all button-press"
              >
                Mark Today's Attendance
              </Button>
            </>
          )}
        </Card>

        <Card className="p-6 mb-8 backdrop-blur-sm bg-card/80 border-2 border-primary/40 shadow-lg card-hover">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Mark Past Dates</h2>
            <Button
              onClick={() => setShowCalendar(!showCalendar)}
              variant="outline"
              className="border-accent/30 hover:bg-accent/10 button-press"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {showCalendar ? "Hide Calendar" : "Show Calendar"}
            </Button>
          </div>

          {showCalendar && (
            <div className="mt-4">
              <CalendarComponent
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (dates) {
                    const datesArray = Array.isArray(dates) ? dates : [dates]
                    const validDates = datesArray.filter((date) => {
                      const dateStr = date.toISOString().split("T")[0]
                      return !attendanceRecords.some((record) => record.date === dateStr)
                    })
                    setSelectedDates(validDates)
                  } else {
                    setSelectedDates([])
                  }
                }}
                disabled={(date) => {
                  const dateStr = date.toISOString().split("T")[0]
                  return attendanceRecords.some((record) => record.date === dateStr) || date > new Date()
                }}
                className="rounded-md border border-primary/20 mx-auto"
              />
              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""}
                  </p>
                  <Button
                    onClick={handleMarkMultipleDates}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold button-press"
                  >
                    Mark {selectedDates.length} Date{selectedDates.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Attendance History */}
        <Card className="p-6 backdrop-blur-sm bg-card/80 border-2 border-primary/40 shadow-lg card-hover">
          <h2 className="text-xl font-semibold text-foreground mb-4">Attendance History</h2>

          {attendanceRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No attendance records yet. Mark your first attendance above!
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/10"
                >
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-foreground font-medium flex-1">
                    {new Date(record.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <Button
                    onClick={(e) => handleCancelAttendance(record.id, e)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 button-press"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
