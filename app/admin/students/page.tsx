"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldError } from "@/components/ui/field-error"
import { Users, Search, UserPlus, X, Eye, EyeOff } from "lucide-react"
import { getStudents, toggleUserActive } from "@/lib/data"
import { createStaffUser } from "@/lib/ims-data"
import { formatDateTime } from "@/lib/utils"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone } from "@/lib/validation"
import { motion, AnimatePresence } from "framer-motion"

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Add Student Modal
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", education: "", password: "" })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = () => {
    setIsLoading(true)
    getStudents().then(data => {
      setStudents(data)
      setFiltered(data)
    }).finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(students.filter(s =>
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.student_id || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q)
    ))
  }, [search, students])

  const toggleActive = async (id: string, current: boolean) => {
    await toggleUserActive(id, !current)
    setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  // Validation
  const fieldErrors: Record<string, string> = {}
  if (touched.name && !form.name.trim()) fieldErrors.name = "Name is required"
  else if (touched.name && form.name.trim() && !isValidName(form.name)) fieldErrors.name = "Letters, spaces, and hyphens only"
  if (touched.email && !form.email.trim()) fieldErrors.email = "Email is required"
  else if (touched.email && form.email.trim() && !isValidEmail(form.email)) fieldErrors.email = "Enter a valid email (e.g. name@example.com)"
  if (touched.phone && form.phone.trim() && !isValidSriLankanPhone(form.phone)) fieldErrors.phone = "Enter a valid Sri Lankan number (e.g. 077 123 4567)"
  if (touched.password && !form.password) fieldErrors.password = "Password is required"
  else if (touched.password && form.password.length < 8) fieldErrors.password = "Password must be at least 8 characters"

  const handleBlur = (f: string) => setTouched(p => ({ ...p, [f]: true }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched({ name: true, email: true, password: true, phone: true })

    if (!form.name.trim() || !isValidName(form.name)) return setError("Please enter a valid name")
    if (!form.email.trim() || !isValidEmail(form.email)) return setError("Please enter a valid email")
    if (form.phone.trim() && !isValidSriLankanPhone(form.phone)) return setError("Please enter a valid Sri Lankan phone number")
    if (!form.password || form.password.length < 8) return setError("Password must be at least 8 characters")

    setCreating(true)
    try {
      await createStaffUser({
        email: form.email,
        password: form.password,
        name: form.name,
        role: "student",
        position: "",
        department: undefined,
      })
      setShowModal(false)
      setForm({ name: "", email: "", phone: "", education: "", password: "" })
      setTouched({})
      loadStudents()
    } catch (err: any) {
      setError(err.message || "Failed to create student")
    } finally {
      setCreating(false)
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setForm({ name: "", email: "", phone: "", education: "", password: "" })
    setTouched({})
    setError("")
  }

  const inputCls = (field: string) =>
    `w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${fieldErrors[field] ? "border-red-400" : "border-gray-200"}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student registrations and profiles</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Students ({filtered.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or student ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Full Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Education</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No students found</td></tr>
                  ) : filtered.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{student.student_id || "—"}</td>
                      <td className="py-3 px-4 font-medium">{student.full_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                      <td className="py-3 px-4 text-gray-600">{student.phone || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{student.education_background || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge className={student.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(student.created_at)}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(student.id, student.is_active)}
                        >
                          {student.is_active ? "Deactivate" : "Activate"}
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

      {/* ── ADD STUDENT MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Creates a student account they can log in with</p>
                </div>
                <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: sanitizeName(e.target.value) }))}
                    onBlur={() => handleBlur("name")} placeholder="Letters only" required className={inputCls("name")} />
                  <FieldError message={fieldErrors.name} />
                </div>

                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onBlur={() => handleBlur("email")} placeholder="student@example.com" required className={inputCls("email")} />
                  <FieldError message={fieldErrors.email} />
                </div>

                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: formatSriLankanPhone(e.target.value) }))}
                    onBlur={() => handleBlur("phone")} placeholder="077 123 4567" className={inputCls("phone")} />
                  <FieldError message={fieldErrors.phone} />
                </div>

                <div className="space-y-1.5">
                  <Label>Education Background</Label>
                  <input value={form.education} onChange={e => setForm(p => ({ ...p, education: e.target.value }))}
                    placeholder="e.g. A/L, Diploma, BSc" className={inputCls("education")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      onBlur={() => handleBlur("password")} placeholder="Min 8 characters" required
                      className={`${inputCls("password")} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError message={fieldErrors.password} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={resetModal} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={creating} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    {creating ? "Creating..." : "Create Student"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
