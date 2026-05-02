"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Plus } from "lucide-react"
import { getCourses, deleteCourse } from "@/lib/data"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCourses(false).then(data => {
      setCourses(data)
      setFiltered(data)
    }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(courses.filter(c =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q) ||
      (c.level || "").toLowerCase().includes(q)
    ))
  }, [search, courses])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? This cannot be undone.")) return
    await deleteCourse(id)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const levelColor = (level: string) =>
    level === "Expert Certificate"     ? "bg-purple-100 text-purple-800" :
    level === "Master Certificate"     ? "bg-blue-100 text-blue-800" :
                                         "bg-green-100 text-green-800"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Manage CADD programmes - BIM, CAD, Project Management</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new"><Plus className="h-4 w-4 mr-2" /> New Course</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> All Courses ({filtered.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search by title, category, or level..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Featured</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No courses found</td></tr>
                  ) : filtered.map(course => (
                    <tr key={course.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{course.title}</td>
                      <td className="py-3 px-4">
                        <Badge className={levelColor(course.level)}>{course.level}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{course.category}</td>
                      <td className="py-3 px-4 text-gray-600">{course.total_hours}h</td>
                      <td className="py-3 px-4 font-semibold">Rs {course.price?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge className={course.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {course.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {course.is_featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/courses/${course.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(course.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
