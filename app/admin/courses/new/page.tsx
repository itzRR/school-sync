"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import { createCourse } from "@/lib/data"

export default function NewCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", slug: "", description: "", short_description: "",
    price: "", original_price: "",
    level: "Proficient Certificate",
    category: "BIM",
    total_hours: "80",
    tags: "",
    is_active: true, is_featured: false,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await createCourse({
        slug: form.slug || autoSlug(form.title),
        title: form.title,
        description: form.description,
        short_description: form.short_description || undefined,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : undefined,
        level: form.level,
        category: form.category,
        total_hours: parseInt(form.total_hours),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        is_active: form.is_active,
        is_featured: form.is_featured,
      })
      router.push("/admin/courses")
    } catch (err: any) {
      setError(err.message || "Failed to create course")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/courses"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Course</h1>
          <p className="text-gray-600 text-sm">Create a new CADD Centre programme</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. BIM Master Certificate" value={form.title}
                onChange={e => { set("title", e.target.value); set("slug", autoSlug(e.target.value)) }} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="auto-generated" value={form.slug} onChange={e => set("slug", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Level *</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.level} onChange={e => set("level", e.target.value)}>
                  <option>Proficient Certificate</option>
                  <option>Master Certificate</option>
                  <option>Expert Certificate</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.category} onChange={e => set("category", e.target.value)}>
                  <option>BIM</option>
                  <option>CAD</option>
                  <option>Project Management</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total Hours *</Label>
                <Input type="number" min="1" value={form.total_hours} onChange={e => set("total_hours", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (Rs) *</Label>
                <Input type="number" min="0" step="500" value={form.price} onChange={e => set("price", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Original Price (Rs)</Label>
                <Input type="number" min="0" step="500" value={form.original_price} onChange={e => set("original_price", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input placeholder="One-line summary" value={form.short_description} onChange={e => set("short_description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea placeholder="Full course description..." value={form.description} onChange={e => set("description", e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="BIM, Revit, Navisworks" value={form.tags} onChange={e => set("tags", e.target.value)} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} />
                Featured
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Course"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/courses")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
