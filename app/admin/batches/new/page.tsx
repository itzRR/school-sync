"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { getCourses, createBatch } from "@/lib/data"

export default function NewBatchPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    course_id: "", name: "", start_date: "", end_date: "",
    schedule: "", mode: "classroom", venue: "", seats: "20",
  })

  useEffect(() => { getCourses(false).then(setCourses) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.course_id || !form.name || !form.start_date || !form.schedule) {
      setError("Please fill in all required fields.")
      return
    }
    setIsLoading(true)
    try {
      await createBatch({
        course_id: form.course_id,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        schedule: form.schedule,
        mode: form.mode,
        venue: form.venue || undefined,
        seats: parseInt(form.seats),
      })
      router.push("/admin/batches")
    } catch (err: any) {
      setError(err.message || "Failed to create batch")
    } finally {
      setIsLoading(false)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/batches"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Batch</h1>
          <p className="text-gray-600 text-sm">Set up a new training batch with schedule and allocation</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Batch Details</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.course_id}
                onChange={e => set("course_id", e.target.value)}
                required
              >
                <option value="">Select a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.level})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input placeholder="e.g. BIM Batch 01 – 2025" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Schedule *</Label>
              <Input placeholder="e.g. Mon, Wed, Fri — 9:00 AM to 12:00 PM" value={form.schedule} onChange={e => set("schedule", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mode *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.mode}
                  onChange={e => set("mode", e.target.value)}
                >
                  <option value="classroom">Classroom</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Seats *</Label>
                <Input type="number" min="1" value={form.seats} onChange={e => set("seats", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Venue / Platform</Label>
              <Input placeholder="e.g. CADD Centre — Room 3A or Zoom" value={form.venue} onChange={e => set("venue", e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Batch"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/batches")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
