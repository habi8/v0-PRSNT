"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface EditClassModalProps {
  classId: string
  className: string
  targetDays: number | null
  onSave: (name: string, targetDays: number | null) => Promise<void>
  onClose: () => void
}

export function EditClassModal({ classId, className, targetDays, onSave, onClose }: EditClassModalProps) {
  const [editName, setEditName] = useState(className)
  const [editTargetDays, setEditTargetDays] = useState(targetDays?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!editName.trim()) return

    setIsSaving(true)
    const targetDaysNum = editTargetDays.trim() ? Number.parseInt(editTargetDays) : null
    await onSave(editName, targetDaysNum)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-card border-2 border-primary/40 shadow-xl glowing-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Class</h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="hover:bg-primary/10 button-press">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Class Name</label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Target Days (optional)</label>
            <Input
              type="number"
              value={editTargetDays}
              onChange={(e) => setEditTargetDays(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-accent"
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/10 bg-transparent button-press"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold button-press"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
