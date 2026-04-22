"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Plus } from "lucide-react"
import { getEnrollments, getModulesByCourse, createAssessment, getAssessmentsByEnrollment } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"

export default function AssessmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedEnrollment, setSelectedEnrollment] = useState("")
  const [modules, setModules] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    module_id: "", type: "module_test", title: "",
    marks_obtained: "", total_marks: "100", grade: "", notes: ""
  })

  useEffect(() => { getEnrollments().then(setEnrollments) }, [])

  const handleEnrollmentChange = async (id: string) => {
    setSelectedEnrollment(id)
    const enroll = enrollments.find(e => e.id === id)
    if (enroll?.courses?.id) {
      const mods = await getModulesByCourse(enroll.courses.id)
      setModules(mods)
    }
    if (id) getAssessmentsByEnrollment(id).then(setAssessments)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!selectedEnrollment) { setError("Select an enrollment"); return }
    try {
      const a = await createAssessment({
        enrollment_id: selectedEnrollment,
        module_id: form.module_id || undefined,
        type: form.type,
        title: form.title,
        marks_obtained: form.marks_obtained ? parseFloat(form.marks_obtained) : undefined,
        total_marks: parseFloat(form.total_marks),
        grade: form.grade || undefined,
        conducted_at: new Date().toISOString(),
        notes: form.notes || undefined,
      })
      setAssessments(prev => [a, ...prev])
      setForm({ module_id: "", type: "module_test", title: "", marks_obtained: "", total_marks: "100", grade: "", notes: "" })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const typeColor = (t: string) =>
    t === "final_project" ? "bg-purple-100 text-purple-800" :
    t === "practical" ? "bg-orange-100 text-orange-800" :
    "bg-blue-100 text-blue-800"

  const gradeColor = (g: string) =>
    g === "A" ? "bg-green-100 text-green-800" :
    g === "B" ? "bg-blue-100 text-blue-800" :
    g === "C" ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800"

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assessments & Exams</h1>
        <p className="text-gray-600 mt-1">Record module tests, practicals and final project evaluations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Manage Assessments</CardTitle>
          <div className="space-y-2">
            <Label>Select Enrollment</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedEnrollment}
              onChange={e => handleEnrollmentChange(e.target.value)}
            >
              <option value="">-- Select student enrollment --</option>
              {enrollments.map(e => (
                <option key={e.id} value={e.id}>
                  {e.profiles?.full_name} — {e.courses?.title} ({e.batches?.name || "No batch"})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

          {selectedEnrollment && (
            <>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Assessment
                </Button>
              </div>

              {showForm && (
                <form onSubmit={handleAdd} className="bg-blue-50 rounded-lg p-4 mb-6 space-y-3">
                  <h3 className="font-medium text-sm">New Assessment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type *</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.type} onChange={e => set("type", e.target.value)}>
                        <option value="module_test">Module Test</option>
                        <option value="practical">Practical</option>
                        <option value="final_project">Final Project</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Module</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.module_id} onChange={e => set("module_id", e.target.value)}>
                        <option value="">-- All modules --</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Title *</Label>
                    <Input placeholder="e.g. Revit Architecture Module Test 1" value={form.title} onChange={e => set("title", e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Marks Obtained</Label>
                      <Input type="number" min="0" step="0.5" value={form.marks_obtained} onChange={e => set("marks_obtained", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total Marks</Label>
                      <Input type="number" min="1" value={form.total_marks} onChange={e => set("total_marks", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grade</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.grade} onChange={e => set("grade", e.target.value)}>
                        <option value="">—</option>
                        <option>A</option><option>B</option><option>C</option><option>D</option><option>F</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input placeholder="Optional notes" value={form.notes} onChange={e => set("notes", e.target.value)} />
                  </div>
                  <Button type="submit" size="sm">Save Assessment</Button>
                </form>
              )}

              {assessments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No assessments recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Title</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Type</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Module</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Score</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Grade</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map(a => (
                        <tr key={a.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">{a.title}</td>
                          <td className="py-2 px-4">
                            <Badge className={typeColor(a.type)}>{a.type.replace("_", " ")}</Badge>
                          </td>
                          <td className="py-2 px-4 text-gray-600">{a.modules?.title || "—"}</td>
                          <td className="py-2 px-4">
                            {a.marks_obtained != null ? `${a.marks_obtained} / ${a.total_marks}` : "—"}
                          </td>
                          <td className="py-2 px-4">
                            {a.grade ? <Badge className={gradeColor(a.grade)}>{a.grade}</Badge> : "—"}
                          </td>
                          <td className="py-2 px-4 text-gray-500 text-xs">{a.conducted_at ? formatDateTime(a.conducted_at) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {!selectedEnrollment && (
            <p className="text-center text-gray-400 py-12">Select an enrollment above to view or record assessments</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
