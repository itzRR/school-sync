"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import jsPDF from "jspdf"
import { useRouter } from "next/navigation"

import {
  GraduationCap, Users, BookOpen, CalendarDays, Plus,
  Edit, Trash2, X, Search, BarChart3, CheckCircle,
  Download, Award, Clock, Star, Menu, List, Calendar, User, LogOut
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { getCurrentUser, signOut } from "@/lib/auth"
import { getAcademicResults, createAcademicResult, deleteAcademicResult, type AcademicResult } from "@/lib/ims-data"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"

interface AcademicStudent {
  id: string; name: string; email: string; contact: string
  student_id: string; course_id: string; batch_id: string
  enroll_date: string; status: "Active" | "Completed" | "Dropped"
  created_at: string
}
interface AcademicCourse {
  id: string; name: string; duration: string; fee: number
  instructor: string; schedule: string; created_at: string
}
interface AcademicBatch {
  id: string; name: string; course_id: string; course_name: string
  start_date: string; end_date: string; student_ids: string[]
  created_at: string
}
interface AttendanceRecord {
  id: string; batch_id: string; date: string
  present: string[]; absent: string[]; created_at: string
}

const COURSES_LIST = ["AutoCAD", "SolidWorks", "3ds Max", "Revit", "CATIA", "BIM Full Course", "Navisworks", "SketchUp"]

export default function AcademicDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("students")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [students, setStudents] = useState<AcademicStudent[]>([])
  const [courses, setCourses] = useState<AcademicCourse[]>([])
  const [batches, setBatches] = useState<AcademicBatch[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [results, setResults] = useState<AcademicResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [search, setSearch] = useState("")

  const isHead = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.access_level >= 2

  // Modals
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  
  const [editingStudent, setEditingStudent] = useState<AcademicStudent | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<AcademicBatch | null>(null)
  const [attendancePresent, setAttendancePresent] = useState<string[]>([])
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const emptyStudent: { name: string; email: string; contact: string; course_id: string; batch_id: string; enroll_date: string; status: "Active" | "Completed" | "Dropped" } = { name: "", email: "", contact: "", course_id: "", batch_id: "", enroll_date: format(new Date(), "yyyy-MM-dd"), status: "Active" }
  const [studentForm, setStudentForm] = useState(emptyStudent)

  const emptyCourse = { name: "AutoCAD", duration: "3 months", fee: 0, instructor: "", schedule: "" }
  const [courseForm, setCourseForm] = useState(emptyCourse)

  const emptyBatch = { name: "", course_id: "", start_date: "", end_date: "" }
  const [batchForm, setBatchForm] = useState(emptyBatch)

  const emptyResult = { student_id: "", student_name: "", course_id: "", exam_name: "", score: 0, max_score: 100, date: format(new Date(), "yyyy-MM-dd") }
  const [resultForm, setResultForm] = useState(emptyResult)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: stu }, { data: cou }, { data: bat }, { data: att }, res, cu
      ] = await Promise.all([
        supabase.from("ims_academic_students").select("*").order("created_at", { ascending: false }),
        supabase.from("ims_academic_courses").select("*").order("created_at", { ascending: false }),
        supabase.from("ims_academic_batches").select("*").order("created_at", { ascending: false }),
        supabase.from("ims_academic_attendance").select("*").order("created_at", { ascending: false }),
        getAcademicResults(),
        getCurrentUser(),
      ])
      setStudents(stu || [])
      setCourses(cou || [])
      setBatches((bat || []).map((b: any) => ({ ...b, student_ids: b.student_ids || [] })))
      setAttendance((att || []).map((a: any) => ({ ...a, present: a.present || [], absent: a.absent || [] })))
      setResults(res)
      setCurrentUser(cu)
    } catch (e: any) { toast.error("Load failed: " + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.name.trim()) return toast.error("Name required")
    try {
      if (editingStudent) {
        const { data, error } = await supabase.from("ims_academic_students").update(studentForm).eq("id", editingStudent.id).select().single()
        if (error) throw error
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? data : s))
        toast.success("Student updated")
      } else {
        const studentId = "STU-" + Math.random().toString(36).substr(2, 8).toUpperCase()
        const { data, error } = await supabase.from("ims_academic_students").insert({ ...studentForm, student_id: studentId }).select().single()
        if (error) throw error
        setStudents(prev => [data, ...prev])
        if (studentForm.batch_id) {
          const batch = batches.find(b => b.id === studentForm.batch_id)
          if (batch) {
            const updated = [...(batch.student_ids || []), data.id]
            await supabase.from("ims_academic_batches").update({ student_ids: updated }).eq("id", studentForm.batch_id)
            setBatches(prev => prev.map(b => b.id === studentForm.batch_id ? { ...b, student_ids: updated } : b))
          }
        }
        toast.success("Student registered")
      }
      setShowStudentModal(false); setEditingStudent(null); setStudentForm(emptyStudent)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseForm.name) return toast.error("Course name required")
    try {
      const { data, error } = await supabase.from("ims_academic_courses").insert(courseForm).select().single()
      if (error) throw error
      setCourses(prev => [data, ...prev])
      toast.success("Course added")
      setShowCourseModal(false); setCourseForm(emptyCourse)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchForm.name.trim() || !batchForm.course_id) return toast.error("Batch name and course required")
    const course = courses.find(c => c.id === batchForm.course_id)
    try {
      const { data, error } = await supabase.from("ims_academic_batches").insert({ ...batchForm, course_name: course?.name || "", student_ids: [] }).select().single()
      if (error) throw error
      setBatches(prev => [{ ...data, student_ids: [] }, ...prev])
      toast.success("Batch created")
      setShowBatchModal(false); setBatchForm(emptyBatch)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleSaveAttendance = async () => {
    if (!selectedBatch || !attendanceDate) return toast.error("Batch and date required")
    const batchStudents = students.filter(s => selectedBatch.student_ids.includes(s.id))
    const absent = batchStudents.filter(s => !attendancePresent.includes(s.id)).map(s => s.id)
    try {
      const { data, error } = await supabase.from("ims_academic_attendance").insert({ batch_id: selectedBatch.id, date: attendanceDate, present: attendancePresent, absent }).select().single()
      if (error) throw error
      setAttendance(prev => [{ ...data, present: data.present || [], absent: data.absent || [] }, ...prev])
      toast.success("Attendance recorded")
      setShowAttendanceModal(false)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resultForm.exam_name.trim() || !resultForm.student_id) return toast.error("Student and exam name required")
    const student = students.find(s => s.id === resultForm.student_id)
    try {
      const created = await createAcademicResult({ ...resultForm, student_name: student?.name || "", course_id: student?.course_id || "" })
      setResults(prev => [created, ...prev])
      toast.success("Result saved")
      setShowResultModal(false); setResultForm(emptyResult)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!isHead) return toast.error("Only heads can delete students")
    if (!confirm("Delete this student?")) return
    try {
      await supabase.from("ims_academic_students").delete().eq("id", id)
      setStudents(prev => prev.filter(s => s.id !== id))
      toast.success("Student deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteCourse = async (id: string) => {
    if (!isHead) return toast.error("Only heads can delete courses")
    if (!confirm("Delete this course?")) return
    try {
      await supabase.from("ims_academic_courses").delete().eq("id", id)
      setCourses(prev => prev.filter(c => c.id !== id))
      toast.success("Course deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteBatch = async (id: string) => {
    if (!isHead) return toast.error("Only heads can delete batches")
    if (!confirm("Delete this batch?")) return
    try {
      await supabase.from("ims_academic_batches").delete().eq("id", id)
      setBatches(prev => prev.filter(b => b.id !== id))
      toast.success("Batch deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const generateCertificate = (student: AcademicStudent) => {
    const course = courses.find(c => c.id === student.course_id)
    const doc2 = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc2.setFillColor(15, 23, 42); doc2.rect(0, 0, 297, 210, 'F')
    doc2.setDrawColor(251, 146, 60); doc2.setLineWidth(3); doc2.rect(10, 10, 277, 190)
    doc2.setDrawColor(251, 191, 36); doc2.setLineWidth(1); doc2.rect(15, 15, 267, 180)
    doc2.setTextColor(251, 146, 60); doc2.setFontSize(14); doc2.setFont('helvetica', 'bold')
    doc2.text('CADD Centre', 148.5, 35, { align: 'center' })
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(28)
    doc2.text('Certificate of Completion', 148.5, 55, { align: 'center' })
    doc2.setDrawColor(251, 146, 60); doc2.setLineWidth(0.5); doc2.line(50, 62, 247, 62)
    doc2.setTextColor(200, 200, 200); doc2.setFontSize(13); doc2.setFont('helvetica', 'normal')
    doc2.text('This is to certify that', 148.5, 80, { align: 'center' })
    doc2.setTextColor(251, 146, 60); doc2.setFontSize(24); doc2.setFont('helvetica', 'bold')
    doc2.text(student.name, 148.5, 95, { align: 'center' })
    doc2.setTextColor(200, 200, 200); doc2.setFontSize(13); doc2.setFont('helvetica', 'normal')
    doc2.text('has successfully completed the course', 148.5, 108, { align: 'center' })
    doc2.setTextColor(255, 255, 255); doc2.setFontSize(18); doc2.setFont('helvetica', 'bold')
    doc2.text(course?.name || 'CADD Course', 148.5, 122, { align: 'center' })
    doc2.setTextColor(200, 200, 200); doc2.setFontSize(11); doc2.setFont('helvetica', 'normal')
    doc2.text(`Enrollment Date: ${student.enroll_date}`, 148.5, 137, { align: 'center' })
    doc2.text(`Student ID: ${student.student_id}`, 148.5, 147, { align: 'center' })
    doc2.line(50, 170, 247, 170)
    doc2.setTextColor(251, 146, 60); doc2.setFontSize(10)
    doc2.text('CADD Centre - Authorized Signature', 148.5, 180, { align: 'center' })
    doc2.save(`Certificate_${student.name.replace(/ /g, '_')}.pdf`)
    toast.success('Certificate generated!')
  }

  const navSections = [
    {
      label: '🎓 Academic',
      items: [
        { id: 'students',       label: 'Students',        icon: Users,        badge: 0 },
        { id: 'attendance',     label: 'Class Attendance', icon: CheckCircle, badge: 0 },
        { id: 'batches',        label: 'Batches',          icon: CalendarDays,badge: 0 },
        { id: 'courses',        label: 'Courses',          icon: BookOpen,    badge: 0 },
        { id: 'results',        label: 'Exam Results',     icon: Award,       badge: 0 },
        { id: 'reports',        label: 'Reports',          icon: BarChart3,   badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'my-attendance',  label: 'My Attendance',    icon: Clock,        badge: 0 },
        { id: 'profile',        label: 'My Profile',       icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',       label: 'Calendar',         icon: Calendar,     badge: 0 },
      ]
    },
  ]

  const filteredStudents = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  )

  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || courseId
  const getBatchName = (batchId: string) => batches.find(b => b.id === batchId)?.name || ''

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center deep-blue-bg">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-emerald-500 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen deep-blue-bg">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-12 h-12 text-gray-900" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">CADD Centre - Academic</h2>
            <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="dark-glass-strong p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-emerald-400">Academic Dashboard</h1>
            <p className="text-gray-500 text-sm hidden md:block">CADD Centre - {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/ims')} className="text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-xl">Back to Admin</button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200 hover:bg-red-500/30">
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </motion.header>

      <div className="flex">
        <motion.aside initial={{ x: -100 }} animate={{ x: 0 }}
          className={`dark-glass-strong h-screen sticky top-0 z-40 w-60 flex flex-col ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
          {mobileMenuOpen && <div className="flex justify-end p-3 md:hidden"><button onClick={() => setMobileMenuOpen(false)} className="text-gray-900"><X size={20} /></button></div>}

          <div className="px-4 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-emerald-300 text-xs font-semibold">Academic Dept.</p>
                <p className="text-gray-400 text-[10px] mt-0.5">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                { val: students.length, label: 'Students', color: 'text-emerald-400' },
                { val: students.filter(s => s.status === 'Active').length, label: 'Active', color: 'text-blue-400' },
                { val: courses.length, label: 'Courses', color: 'text-cyan-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-100 rounded-lg p-1.5 text-center">
                  <p className={`font-bold text-base leading-none ${s.color}`}>{s.val}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-gray-900 shadow-lg shadow-emerald-500/20'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="ac-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-gray-900' : 'text-gray-500'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-gray-50">

          {/* ── STUDENTS ── */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                    className="w-full pl-9 pr-3 py-2 dark-glass-card text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setEditingStudent(null); setStudentForm(emptyStudent); setShowStudentModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Register Student
                </motion.button>
              </div>
              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-700">
                    <thead className="bg-gray-100">
                      <tr>{['Student ID','Name','Course','Batch','Status','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-emerald-400">{s.student_id}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                          <td className="px-4 py-3">{getCourseName(s.course_id)}</td>
                          <td className="px-4 py-3 text-gray-500">{getBatchName(s.batch_id)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : s.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-100 text-red-600'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingStudent(s); setStudentForm({ name: s.name, email: s.email, contact: s.contact, course_id: s.course_id, batch_id: s.batch_id, enroll_date: s.enroll_date, status: s.status }); setShowStudentModal(true); }}
                                className="p-1.5 hover:text-emerald-400 text-gray-400 transition-colors"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => generateCertificate(s)}
                                className="p-1.5 hover:text-yellow-700 text-gray-400 transition-colors" title="Generate Certificate"><Award className="w-4 h-4" /></button>
                              {isHead && (
                                <button onClick={() => handleDeleteStudent(s.id)}
                                  className="p-1.5 hover:text-red-600 text-gray-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No students found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── COURSES ── */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Course Management</h2>
                {isHead && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCourseModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">
                    <Plus className="w-4 h-4" /> Add Course
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map(c => (
                  <div key={c.id} className="dark-glass-card p-5 rounded-2xl border border-gray-200 hover:border-emerald-500/40 transition-all space-y-3">
                    <div className="flex justify-between">
                      <h3 className="text-gray-900 font-bold text-lg">{c.name}</h3>
                      {isHead && <button onClick={() => handleDeleteCourse(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><p className="text-xs text-gray-400">Duration</p><p>{c.duration}</p></div>
                      <div><p className="text-xs text-gray-400">Fee</p><p className="text-emerald-400">LKR {c.fee?.toLocaleString()}</p></div>
                      <div><p className="text-xs text-gray-400">Instructor</p><p>{c.instructor}</p></div>
                      <div><p className="text-xs text-gray-400">Schedule</p><p>{c.schedule}</p></div>
                    </div>
                    <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
                      Enrolled: {students.filter(s => s.course_id === c.id).length} students
                    </div>
                  </div>
                ))}
                {courses.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />No courses yet.</div>}
              </div>
            </div>
          )}

          {/* ── BATCHES ── */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Batches</h2>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setSelectedBatch(null); setShowAttendanceModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">
                    <CheckCircle className="w-4 h-4" /> Mark Attendance
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowBatchModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">
                    <Plus className="w-4 h-4" /> New Batch
                  </motion.button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batches.map(b => (
                  <div key={b.id} className="dark-glass-card p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-gray-900 font-bold">{b.name}</h3>
                        <p className="text-emerald-400 text-sm">{b.course_name}</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <button onClick={() => { setSelectedBatch(b); setAttendancePresent([]); setShowAttendanceModal(true); }}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-200 hover:border-emerald-500/50">
                          Attendance
                        </button>
                        {isHead && <button onClick={() => handleDeleteBatch(b.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Start: {b.start_date}</span><span>End: {b.end_date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {b.student_ids.map(sid => {
                        const st = students.find(s => s.id === sid);
                        return st ? <span key={sid} className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">{st.name}</span> : null;
                      })}
                      {b.student_ids.length === 0 && <span className="text-gray-400 text-xs">No students assigned</span>}
                    </div>
                  </div>
                ))}
                {batches.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">No batches yet.</div>}
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100">
                    <tr>{['Date','Batch','Present','Absent','Rate'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => {
                      const total = a.present.length + a.absent.length;
                      const rate = total > 0 ? Math.round((a.present.length / total) * 100) : 0;
                      return (
                        <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-100">
                          <td className="px-4 py-3">{a.date}</td>
                          <td className="px-4 py-3">{batches.find(b => b.id === a.batch_id)?.name || a.batch_id}</td>
                          <td className="px-4 py-3 text-green-700">{a.present.length}</td>
                          <td className="px-4 py-3 text-red-600">{a.absent.length}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${rate >= 75 ? 'text-green-700' : rate >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>{rate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    {attendance.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No attendance records yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Exam Results</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowResultModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Add Result
                </motion.button>
              </div>
              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100">
                    <tr>{['Student','Exam','Score','Max','Pass/Fail','Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-100">
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.student_name}</td>
                        <td className="px-4 py-3">{r.exam_name}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{r.score}</td>
                        <td className="px-4 py-3 text-gray-500">{r.max_score}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {r.passed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.date}</td>
                      </tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No results yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Academic Reports</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', val: students.length, color: 'from-emerald-500 to-cyan-500' },
                  { label: 'Active Students', val: students.filter(s => s.status === 'Active').length, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Completed', val: students.filter(s => s.status === 'Completed').length, color: 'from-purple-500 to-pink-500' },
                  { label: 'Pass Rate', val: results.length > 0 ? `${Math.round(results.filter(r => r.passed).length / results.length * 100)}%` : '0%', color: 'from-orange-500 to-pink-500' },
                ].map(s => (
                  <div key={s.label} className={`dark-glass-card p-5 rounded-2xl bg-gradient-to-br ${s.color} bg-opacity-10 border border-gray-200`}>
                    <p className="text-gray-600 text-xs mb-1">{s.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{s.val}</p>
                  </div>
                ))}
              </div>
              <div className="dark-glass-card p-5 rounded-2xl border border-gray-200">
                <h3 className="text-gray-900 font-bold mb-4">Enrollment by Course</h3>
                <div className="space-y-3">
                  {courses.map(c => {
                    const count = students.filter(s => s.course_id === c.id).length;
                    const pct = students.length > 0 ? Math.round(count / students.length * 100) : 0;
                    return (
                      <div key={c.id} className="space-y-1">
                        <div className="flex justify-between text-sm text-gray-600"><span>{c.name}</span><span>{count} students</span></div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                  {courses.length === 0 && <p className="text-gray-400">No courses yet.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="emerald" />}
          {activeTab === 'my-attendance' && (
            <div className="dark-glass-card p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance</h2>
              <p className="text-gray-500 mb-4">Your personal attendance records.</p>
              <StaffAttendance />
            </div>
          )}
          {activeTab === 'profile' && currentUser && (
            <ProfileSection userData={currentUser} />
          )}

        </main>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showStudentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">{editingStudent ? 'Edit Student' : 'Register Student'}</h2>
                <button onClick={() => { setShowStudentModal(false); setEditingStudent(null); }} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleStudentSubmit} className="space-y-3">
                {[['Name *', 'name', 'text', true], ['Email', 'email', 'email', false], ['Contact', 'contact', 'tel', false], ['Enroll Date', 'enroll_date', 'date', false]].map(([label, key, type, req]) => (
                  <div key={key as string}>
                    <label className="block text-gray-600 text-sm mb-1">{label as string}</label>
                    <input type={type as string} required={req as boolean} value={(studentForm as any)[key as string]}
                      onChange={e => setStudentForm(p => ({ ...p, [key as string]: e.target.value }))}
                      className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Course</label>
                  <select value={studentForm.course_id} onChange={e => setStudentForm(p => ({ ...p, course_id: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Batch</label>
                  <select value={studentForm.batch_id} onChange={e => setStudentForm(p => ({ ...p, batch_id: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    <option value="">Select Batch</option>
                    {batches.filter(b => !studentForm.course_id || b.course_id === studentForm.course_id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Status</label>
                  <select value={studentForm.status} onChange={e => setStudentForm(p => ({ ...p, status: e.target.value as 'Active' | 'Completed' | 'Dropped' }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    {['Active', 'Completed', 'Dropped'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowStudentModal(false); setEditingStudent(null); }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">
                    {editingStudent ? 'Update' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCourseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Add Course</h2>
                <button onClick={() => setShowCourseModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCourseSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Course Name</label>
                  <select value={courseForm.name} onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    {COURSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {[['Duration (e.g. 3 months)', 'duration', 'text'], ['Instructor', 'instructor', 'text'], ['Schedule (e.g. Mon/Wed 9am)', 'schedule', 'text']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-gray-600 text-sm mb-1">{label}</label>
                    <input type={type} value={(courseForm as any)[key]}
                      onChange={e => setCourseForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Fee (LKR)</label>
                  <input type="number" value={courseForm.fee} onChange={e => setCourseForm(p => ({ ...p, fee: Number(e.target.value) }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBatchModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">New Batch</h2>
                <button onClick={() => setShowBatchModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleBatchSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Batch Name *</label>
                  <input required value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" placeholder="e.g. AutoCAD Batch A" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Course</label>
                  <select required value={batchForm.course_id} onChange={e => setBatchForm(p => ({ ...p, course_id: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {[['Start Date', 'start_date', 'date'], ['End Date', 'end_date', 'date']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-gray-600 text-sm mb-1">{label}</label>
                    <input type={type} value={(batchForm as any)[key]} onChange={e => setBatchForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowBatchModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAttendanceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
                <button onClick={() => setShowAttendanceModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Date</label>
                  <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Batch</label>
                  <select value={selectedBatch?.id || ''} onChange={e => { const b = batches.find(b => b.id === e.target.value); setSelectedBatch(b || null); setAttendancePresent([]); }}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {selectedBatch && (
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Mark Present:</p>
                    <div className="space-y-2">
                      {selectedBatch.student_ids.map(sid => {
                        const st = students.find(s => s.id === sid);
                        if (!st) return null;
                        const isPresent = attendancePresent.includes(sid);
                        return (
                          <button key={sid} type="button"
                            onClick={() => setAttendancePresent(p => isPresent ? p.filter(id => id !== sid) : [...p, sid])}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isPresent ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-200 dark-glass-card text-gray-600'}`}>
                            <CheckCircle className={`w-5 h-5 ${isPresent ? 'text-green-700' : 'text-white/20'}`} />
                            {st.name}
                          </button>
                        );
                      })}
                      {selectedBatch.student_ids.length === 0 && <p className="text-gray-400 text-sm">No students in this batch.</p>}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAttendanceModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button onClick={handleSaveAttendance} className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResultModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Add Exam Result</h2>
                <button onClick={() => setShowResultModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleResultSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Student</label>
                  <select required value={resultForm.student_id} onChange={e => setResultForm(p => ({ ...p, student_id: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500">
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Exam Name *</label>
                  <input required value={resultForm.exam_name} onChange={e => setResultForm(p => ({ ...p, exam_name: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" placeholder="e.g. Final Exam" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Score</label>
                    <input type="number" value={resultForm.score} onChange={e => setResultForm(p => ({ ...p, score: Number(e.target.value) }))}
                      className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Max Score</label>
                    <input type="number" value={resultForm.max_score} onChange={e => setResultForm(p => ({ ...p, max_score: Number(e.target.value) }))}
                      className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Date</label>
                  <input type="date" value={resultForm.date} onChange={e => setResultForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full dark-glass-card text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowResultModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-gray-900 rounded-xl font-semibold">Save Result</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}


