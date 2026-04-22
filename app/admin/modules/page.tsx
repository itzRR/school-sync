"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Layers, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { getCourses, getModulesByCourse, createModule, deleteModule } from "@/lib/data"

export default function ModulesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ title: "", description: "", duration_hours: "0", topics: "" })

  useEffect(() => { getCourses(false).then(setCourses) }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setIsLoading(true)
    getModulesByCourse(selectedCourse).then(setModules).finally(() => setIsLoading(false))
  }, [selectedCourse])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!selectedCourse) { setError("Select a course first"); return }
    try {
      const topics = form.topics.split("\n").map(t => t.trim()).filter(Boolean)
      const mod = await createModule({
        course_id: selectedCourse,
        title: form.title,
        description: form.description,
        duration_hours: parseInt(form.duration_hours),
        order_index: modules.length + 1,
        topics,
      })
      setModules(prev => [...prev, mod])
      setForm({ title: "", description: "", duration_hours: "0", topics: "" })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module?")) return
    await deleteModule(id)
    setModules(prev => prev.filter(m => m.id !== id))
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          <p className="text-gray-600 mt-1">Manage course modules (Revit Architecture, MEP, Navisworks, etc.)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Course Modules</CardTitle>
          <div className="space-y-2">
            <Label>Select Course</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Choose a course --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

          {selectedCourse && (
            <>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                  {showForm ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  {showForm ? "Hide Form" : "Add Module"}
                </Button>
              </div>

              {showForm && (
                <form onSubmit={handleAdd} className="bg-blue-50 rounded-lg p-4 mb-6 space-y-3">
                  <h3 className="font-medium text-sm">New Module</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Title *</Label>
                      <Input placeholder="e.g. Revit Architecture" value={form.title} onChange={e => set("title", e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration (hours) *</Label>
                      <Input type="number" min="0" value={form.duration_hours} onChange={e => set("duration_hours", e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input placeholder="Brief description" value={form.description} onChange={e => set("description", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Topics (one per line)</Label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={"3D Modeling\nViews (plan, section, elevation)\nFamilies & components"}
                      value={form.topics}
                      onChange={e => set("topics", e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="sm">Add Module</Button>
                </form>
              )}

              {isLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : modules.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No modules yet for this course</p>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod, idx) => (
                    <div key={mod.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                            <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{mod.duration_hours}h</Badge>
                          </div>
                          {mod.description && <p className="text-sm text-gray-600 ml-8 mb-2">{mod.description}</p>}
                          {mod.topics && mod.topics.length > 0 && (
                            <div className="ml-8 flex flex-wrap gap-1">
                              {mod.topics.map((t: string) => (
                                <span key={t} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 ml-4" onClick={() => handleDelete(mod.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!selectedCourse && (
            <p className="text-center text-gray-400 py-12">Select a course above to manage its modules</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
