"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"

import {
  Users, DollarSign, Star, CalendarDays, Plus,
  Edit, Trash2, X, Search, CheckCircle,
  Download, Clock, Menu, LogOut, Briefcase, FileText, XCircle, Power, User, Calendar
} from "lucide-react"
import { QuickGuide, type GuideStep } from "@/components/ui/quick-guide"

import {
  getIMSStaff, updateProfileRole, createStaffUser,
  getHrLeaveRequests, createHrLeaveRequest, updateHrLeaveRequest, deleteHrLeaveRequest,
  getHrSalaryPayouts, createHrSalaryPayout, deleteHrSalaryPayout,
  getHrPerformanceReviews, createHrPerformanceReview, deleteHrPerformanceReview,
} from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import { sanitizeName, isValidName, isValidEmail } from "@/lib/validation"
import { FieldError } from "@/components/ui/field-error"
import type { Profile, HrLeaveRequest, HrSalaryPayout, HrPerformanceReview, HrRoster, UserRole, Permission } from "@/types"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"

const DEPARTMENTS = ["Academic", "Marketing", "Finance", "HR", "IT", "Operations"]
const LEAVE_TYPES = ["Annual", "Sick", "Emergency", "Maternity/Paternity", "Other"]
const ROLES = ["admin", "super_admin", "branch_manager", "marketing_staff", "academic_staff", "finance_officer", "hr_officer", "staff"]

export default function HRDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("directory")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [employees, setEmployees] = useState<Profile[]>([])
  const [leaves, setLeaves] = useState<HrLeaveRequest[]>([])
  const [payouts, setPayouts] = useState<HrSalaryPayout[]>([])
  const [reviews, setReviews] = useState<HrPerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [search, setSearch] = useState("")

  const isHead = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.role === "hr_officer" || currentUser?.access_level >= 2 || currentUser?.permissions?.includes("ims_users")

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  const [editingEmp, setEditingEmp] = useState<Profile | null>(null)

  const emptyLeave = { user_id: "", employee_name: "", type: "Annual" as const, from_date: "", to_date: "", reason: "", status: "Pending" as const, reviewed_by: null }
  const [leaveForm, setLeaveForm] = useState(emptyLeave)

  const emptyPayout = { user_id: "", employee_name: "", month: format(new Date(), "yyyy-MM"), amount: 0, paid_on: format(new Date(), "yyyy-MM-dd"), notes: "", created_by: null }
  const [payoutForm, setPayoutForm] = useState(emptyPayout)

  const emptyReview = { employee_id: "", employee_name: "", quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`, score: 80, notes: "", reviewed_by: null }
  const [reviewForm, setReviewForm] = useState(emptyReview)

  const emptyUserForm = { 
    email: "", password: "", name: "", role: "staff" as UserRole, position: "", department: "HR", access_level: 1,
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
    permissions: [] as Permission[]
  }
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [creatingUser, setCreatingUser] = useState(false)

  const [tempShiftTime, setTempShiftTime] = useState("")
  const [tempAssetItem, setTempAssetItem] = useState("")
  const [tempAssetSerial, setTempAssetSerial] = useState("")
  const [userFormTouched, setUserFormTouched] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [e, l, p, r, u] = await Promise.all([
        getIMSStaff(), getHrLeaveRequests(), getHrSalaryPayouts(), getHrPerformanceReviews(), getCurrentUser()
      ])
      setEmployees(e); setLeaves(l); setPayouts(p); setReviews(r); setCurrentUser(u)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const hrGuideSteps: GuideStep[] = [
    { title: "Staff Directory", description: "View all staff members with their department, role, and status. Add new staff, edit details, assign shifts, and manage office assets.", icon: Users, gradient: "from-purple-500 to-pink-500", tip: "Hover over a staff row to see Edit and Enable/Disable actions." },
    { title: "Leave Requests", description: "Staff can submit leave requests (Annual, Sick, Emergency, etc.). Department heads can approve or reject them.", icon: CalendarDays, gradient: "from-orange-500 to-pink-500", tip: "Pending leave count is shown as a badge in the sidebar." },
    { title: "Payroll Management", description: "Log salary payouts for each employee, generate PDF payslips, and export the full payroll to Excel.", icon: DollarSign, gradient: "from-blue-500 to-indigo-500" },
    { title: "Performance Reviews", description: "Record quarterly performance scores (0-100) with notes. Track employee performance over time.", icon: Star, gradient: "from-yellow-500 to-orange-500" },
    { title: "Staff Resources", description: "When adding/editing staff, you can assign shift schedules, office assets (laptops, etc.), and granular permissions.", icon: Briefcase, gradient: "from-emerald-500 to-cyan-500", tip: "Use 'Granular Permissions' to control exactly what each staff member can access." },
  ]

  // ── Leave CRUD ──
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveForm.employee_name.trim() || !leaveForm.from_date || !leaveForm.to_date) return toast.error("All required fields needed")
    try {
      const created = await createHrLeaveRequest({ ...leaveForm })
      setLeaves(prev => [created, ...prev])
      toast.success("Leave request submitted")
      setShowLeaveModal(false); setLeaveForm(emptyLeave)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleLeaveStatusChange = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const updated = await updateHrLeaveRequest(id, { status, reviewed_by: currentUser?.id })
      setLeaves(prev => prev.map(l => l.id === id ? updated : l))
      toast.success(`Leave ${status.toLowerCase()}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteLeave = async (id: string) => {
    if (!confirm("Delete this leave request?")) return
    try { await deleteHrLeaveRequest(id); setLeaves(prev => prev.filter(l => l.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Salary CRUD ──
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutForm.employee_name.trim() || payoutForm.amount <= 0) return toast.error("Name and amount required")
    try {
      const created = await createHrSalaryPayout({ ...payoutForm, created_by: currentUser?.id })
      setPayouts(prev => [created, ...prev])
      toast.success("Salary payout recorded")
      setShowPayoutModal(false); setPayoutForm(emptyPayout)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeletePayout = async (id: string) => {
    if (!confirm("Delete this payout?")) return
    try { await deleteHrSalaryPayout(id); setPayouts(prev => prev.filter(p => p.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Performance CRUD ──
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewForm.employee_name.trim()) return toast.error("Employee name required")
    try {
      const created = await createHrPerformanceReview({ ...reviewForm, reviewed_by: currentUser?.id })
      setReviews(prev => [created, ...prev])
      toast.success("Review saved")
      setShowReviewModal(false); setReviewForm(emptyReview)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return
    try { await deleteHrPerformanceReview(id); setReviews(prev => prev.filter(r => r.id !== id)); toast.success("Deleted") }
    catch (e: any) { toast.error(e.message) }
  }

  // ── Employee Management ──
  const handleToggleDisable = async (emp: Profile) => {
    try {
      await updateProfileRole(emp.id, { disabled: !emp.disabled })
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, disabled: !e.disabled } : e))
      toast.success(emp.disabled ? "Account enabled" : "Account disabled")
    } catch (e: any) { toast.error(e.message) }
  }

  // User form validation errors
  const userFormErrors: Record<string, string> = {}
  if (userFormTouched.name && !userForm.name.trim()) {
    userFormErrors.name = "Name is required"
  } else if (userFormTouched.name && userForm.name.trim() && !isValidName(userForm.name)) {
    userFormErrors.name = "Name can only contain letters, spaces, and hyphens"
  }
  if (!editingEmp && userFormTouched.email && !userForm.email.trim()) {
    userFormErrors.email = "Email is required"
  } else if (!editingEmp && userFormTouched.email && userForm.email.trim() && !isValidEmail(userForm.email)) {
    userFormErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (!editingEmp && userFormTouched.password && userForm.password && userForm.password.length < 6) {
    userFormErrors.password = "Password must be at least 6 characters"
  }

  const handleUserFormBlur = (field: string) => setUserFormTouched(prev => ({ ...prev, [field]: true }))

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserFormTouched({ name: true, email: true, password: true })
    if (!userForm.name.trim() || !isValidName(userForm.name)) return toast.error("Please enter a valid name (letters only)")
    if (!editingEmp && (!userForm.email.trim() || !isValidEmail(userForm.email))) return toast.error("Please enter a valid email address")
    if (!editingEmp && userForm.password.length < 6) return toast.error("Password must be at least 6 chars")
    
    setCreatingUser(true)
    try {
      if (editingEmp) {
        const updated = await updateProfileRole(editingEmp.id, {
          role: userForm.role, position: userForm.position, department: userForm.department,
          access_level: userForm.access_level, work_schedule: userForm.work_schedule,
          office_assets: userForm.office_assets, full_name: userForm.name,
          permissions: userForm.permissions
        })
        setEmployees(prev => prev.map(p => p.id === editingEmp.id ? { ...p, ...updated } : p))
        toast.success("HR details updated successfully")
      } else {
        await createStaffUser({
          email: userForm.email, password: userForm.password, name: userForm.name,
          role: userForm.role, position: userForm.position, department: userForm.department,
          access_level: userForm.access_level, work_schedule: userForm.work_schedule,
          office_assets: userForm.office_assets, permissions: userForm.permissions
        })
        toast.success("Staff member added successfully")
        await loadData()
      }
      setShowUserModal(false); setUserForm(emptyUserForm); setEditingEmp(null); setUserFormTouched({})
    } catch (e: any) { toast.error(e.message) }
    finally { setCreatingUser(false) }
  }

  const exportPayroll = () => {
    const ws = XLSX.utils.json_to_sheet(payouts.map(p => ({
      Employee: p.employee_name, Month: p.month, Amount: p.amount, PaidOn: p.paid_on, Notes: p.notes,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payroll")
    XLSX.writeFile(wb, `payroll_${format(new Date(), "yyyy-MM")}.xlsx`)
  }

  const generatePayslipPDF = (payout: HrSalaryPayout) => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text("CADD Centre Lanka - Salary Payslip", 14, 20)
    doc.setFontSize(12)
    doc.text(`Employee: ${payout.employee_name}`, 14, 35)
    doc.text(`Month: ${payout.month}`, 14, 43)
    doc.text(`Amount: LKR ${payout.amount.toLocaleString()}`, 14, 51)
    doc.text(`Paid On: ${payout.paid_on || "-"}`, 14, 59)
    if (payout.notes) doc.text(`Notes: ${payout.notes}`, 14, 67)
    doc.save(`payslip_${payout.employee_name}_${payout.month}.pdf`)
  }

  const filteredEmployees = employees.filter(e =>
    !search || (e.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  )

  const navSections = [
    {
      label: '🏢 HR Management',
      items: [
        { id: 'directory',     label: 'Staff Directory', icon: Users,       badge: 0 },
        { id: 'leaves',        label: 'Leave Requests',  icon: CalendarDays,badge: leaves.filter(l=>l.status==='Pending').length },
        { id: 'salary',        label: 'Payroll',         icon: DollarSign,  badge: 0 },
        { id: 'performance',   label: 'Performance',     icon: Star,        badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'attendance',    label: 'My Attendance',   icon: Clock,       badge: 0 },
        { id: 'profile',       label: 'My Profile',      icon: User,        badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',      label: 'Calendar',        icon: Calendar,    badge: 0 },
      ]
    },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-gray-900" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">CADD Centre - HR</h2>
            <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-purple-700">HR Dashboard</h1>
            <p className="text-gray-500 text-sm hidden md:block">CADD Centre - {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuickGuide
            guideKey="hr_dashboard"
            dashboardName="HR"
            accentGradient="from-purple-500 to-pink-500"
            steps={hrGuideSteps}
          />
          <button onClick={() => router.push('/admin/ims')} className="text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Back to Admin</button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-colors font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </motion.header>

      <div className="flex">
        <motion.aside initial={{ x: -100 }} animate={{ x: 0 }}
          className={`bg-white border-r border-gray-200 h-screen sticky top-0 z-40 w-60 flex flex-col ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
          {mobileMenuOpen && <div className="flex justify-end p-3 md:hidden"><button onClick={() => setMobileMenuOpen(false)} className="text-gray-900"><X size={20} /></button></div>}

          <div className="px-4 pt-5 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'H'}
              </div>
              <div className="min-w-0">
                <p className="text-purple-700 text-xs font-semibold">Human Resources</p>
                <p className="text-gray-400 text-[10px] mt-0.5">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-gray-100 rounded-lg p-2 text-center border border-gray-200">
                <p className="font-bold text-sm text-green-600">{employees.filter(e => !e.disabled).length}</p>
                <p className="text-gray-500 text-[10px]">Active</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-2 text-center border border-gray-200">
                <p className="font-bold text-sm text-yellow-600">{leaves.filter(l => l.status === 'Pending').length}</p>
                <p className="text-gray-500 text-[10px]">Leave Req</p>
              </div>
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
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-gray-900 shadow-lg shadow-purple-500/20'
                          : item.badge > 0
                            ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="hr-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-gray-900' : item.badge > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">{item.badge}</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-gray-50">

          {/* ── DIRECTORY ── */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
                {isHead && (
                  <motion.button whileHover={{ scale: 1.05 }}
                    onClick={() => { setEditingEmp(null); setUserForm(emptyUserForm); setShowUserModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                    <Plus className="w-4 h-4" /> Add Staff
                  </motion.button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-separate border-spacing-y-2 px-4">
                    <thead>
                      <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-50">
                        <th className="px-4 py-4">Staff Member</th>
                        <th className="px-4 py-4">Department</th>
                        <th className="px-4 py-4">Role</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map(emp => (
                      <tr key={emp.id} className={`group bg-gray-50 hover:bg-purple-50 transition-all rounded-2xl border border-gray-100 ${emp.disabled ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-4 rounded-l-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shadow-inner">
                                {emp.full_name?.charAt(0).toUpperCase() || emp.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-[15px] truncate">{emp.full_name || emp.email}</p>
                                <p className="text-gray-400 text-xs truncate">{emp.position || 'Staff member'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider border border-purple-200">
                              {emp.department || 'General'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-gray-700 font-medium">
                              {emp.role.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">{emp.email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${emp.disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${emp.disabled ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                              {emp.disabled ? 'Disabled' : 'Active'}
                            </div>
                          </td>
                          <td className="px-4 py-4 rounded-r-2xl text-right">
                            {isHead && (
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { 
                                  setEditingEmp(emp); 
                                  setUserForm({
                                    email: emp.email, password: "", name: emp.full_name || "",
                                    role: emp.role as UserRole, position: emp.position || "", department: emp.department || "HR", access_level: emp.access_level || 1,
                                    work_schedule: emp.work_schedule || [], office_assets: emp.office_assets || [], permissions: emp.permissions || []
                                  });
                                  setShowUserModal(true); 
                                }} className="p-2 hover:bg-purple-100 hover:text-purple-600 text-gray-400 rounded-lg transition-all" title="Edit Staff">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleToggleDisable(emp)} 
                                  className={`p-2 rounded-lg transition-all ${emp.disabled ? 'hover:bg-green-100 hover:text-green-700' : 'hover:bg-red-100 hover:text-red-600'} text-gray-400`}
                                  title={emp.disabled ? "Enable" : "Disable"}>
                                  <Power className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LEAVES ── */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Request Leave
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaves.map(l => (
                  <div key={l.id} className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 space-y-3 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {l.status}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{l.employee_name}</h3>
                      <span className="text-purple-700 text-xs px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200 inline-block mt-1">{l.type} Leave</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      {l.from_date} to {l.to_date}
                    </div>
                    <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded-lg italic">"{l.reason}"</p>
                    {isHead && (
                      <div className="flex gap-2 pt-2">
                        {l.status === 'Pending' && (
                          <>
                            <button onClick={() => handleLeaveStatusChange(l.id, 'Approved')} className="flex-1 py-1.5 bg-green-100 text-green-700 hover:bg-green-500/30 text-xs font-bold rounded-lg border border-green-200">Approve</button>
                            <button onClick={() => handleLeaveStatusChange(l.id, 'Rejected')} className="flex-1 py-1.5 bg-red-100 text-red-600 hover:bg-red-500/30 text-xs font-bold rounded-lg border border-red-200">Reject</button>
                          </>
                        )}
                        <button onClick={() => handleDeleteLeave(l.id)} className="px-3 py-1.5 bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No leave requests.</div>}
              </div>
            </div>
          )}

          {/* ── PAYROLL ── */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Payroll</h2>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} onClick={exportPayroll}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">
                    <Download className="w-4 h-4" /> Export Excel
                  </motion.button>
                  {isHead && (
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowPayoutModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                      <Plus className="w-4 h-4" /> Log Payout
                    </motion.button>
                  )}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100">
                    <tr>{['Month','Employee','Amount','Paid On','Payslip','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {payouts.map(p => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-100">
                        <td className="px-4 py-3 font-semibold text-purple-700">{p.month}</td>
                        <td className="px-4 py-3 text-gray-900">{p.employee_name}</td>
                        <td className="px-4 py-3 font-bold text-green-700">LKR {p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500">{p.paid_on || '-'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => generatePayslipPDF(p)} className="px-3 py-1 glass-button text-xs rounded-lg flex items-center gap-1 border border-gray-200"><FileText className="w-3 h-3"/> PDF</button>
                        </td>
                        <td className="px-4 py-3">
                          {isHead && <button onClick={() => handleDeletePayout(p.id)} className="p-1.5 hover:text-red-600 text-gray-400"><Trash2 className="w-4 h-4" /></button>}
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No payroll records.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PERFORMANCE ── */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Performance Reviews</h2>
                {isHead && (
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">
                    <Plus className="w-4 h-4" /> Add Review
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{r.employee_name}</h3>
                        <p className="text-gray-400 text-xs">{r.quarter}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-lg font-black ${r.score >= 80 ? 'bg-green-100 text-green-700' : r.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                        {r.score}/100
                      </div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                      "{r.notes}"
                    </div>
                    {isHead && (
                      <div className="flex justify-end pt-2">
                        <button onClick={() => handleDeleteReview(r.id)} className="text-gray-400 hover:text-red-600 flex items-center gap-1 text-xs"><Trash2 className="w-3 h-3" /> Delete</button>
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No performance reviews yet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="purple" />}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl border border-gray-200">
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
        {showUserModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">{editingEmp ? 'Edit Staff & Resources' : 'Add New Staff'}</h2>
                <button type="button" onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSaveUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-purple-600 font-bold border-b border-gray-200 pb-2">Basic Info</h3>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">Full Name *</label>
                      <input required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: sanitizeName(e.target.value) }))}
                        onBlur={() => handleUserFormBlur("name")}
                        className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.name ? 'border-red-400' : 'border-gray-200'}`} />
                      <FieldError message={userFormErrors.name} />
                    </div>
                    {!editingEmp && (
                      <>
                        <div>
                          <label className="block text-gray-600 text-sm mb-1">Email *</label>
                          <input required type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                            onBlur={() => handleUserFormBlur("email")}
                            className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
                          <FieldError message={userFormErrors.email} />
                        </div>
                        <div>
                          <label className="block text-gray-600 text-sm mb-1">Password *</label>
                          <input required minLength={6} type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                            onBlur={() => handleUserFormBlur("password")}
                            className={`w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border focus:outline-none focus:border-purple-500 ${userFormErrors.password ? 'border-red-400' : 'border-gray-200'}`} />
                          <FieldError message={userFormErrors.password} />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Role</label>
                        <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as UserRole }))}
                          className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Department</label>
                        <select value={userForm.department} onChange={e => setUserForm(p => ({ ...p, department: e.target.value }))}
                          className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-1">Department Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setUserForm(p => ({ ...p, access_level: 1 }))}
                          className={`px-3 py-2 rounded-xl font-semibold flex justify-center items-center gap-2 border transition-all ${userForm.access_level === 1 ? "bg-blue-500/20 border-blue-500/50 text-blue-600" : "bg-gray-100 border-gray-200 text-gray-500 hover:border-white/30"}`}>
                          <User className="w-4 h-4" /> Staff
                        </button>
                        <button type="button" onClick={() => setUserForm(p => ({ ...p, access_level: 2 }))}
                          className={`px-3 py-2 rounded-xl font-semibold flex justify-center items-center gap-2 border transition-all ${userForm.access_level === 2 ? "bg-orange-500/20 border-orange-500/50 text-orange-700" : "bg-gray-100 border-gray-200 text-gray-500 hover:border-white/30"}`}>
                          <span>👑</span> Dept Head
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-1">Job Title</label>
                      <input value={userForm.position} onChange={e => setUserForm(p => ({ ...p, position: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm mb-3 mt-4 border-t border-gray-200 pt-4">Granular Permissions</label>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { id: "task_delete", label: "Can Delete Tasks" },
                          { id: "ims_users", label: "Can Add Users" },
                          { id: "ims_roster", label: "Can View All Attendance" },
                          { id: "ims_hr", label: "Can Approve Leaves" },
                          { id: "ims_finance", label: "Can Manage Payroll" },
                          { id: "ims_overview", label: "Can View Reports" },
                        ].map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                            <input type="checkbox"
                              checked={userForm.permissions.includes(perm.id as Permission)}
                              onChange={(e) => {
                                if (e.target.checked) setUserForm(p => ({ ...p, permissions: [...p.permissions, perm.id as Permission] }))
                                else setUserForm(p => ({ ...p, permissions: p.permissions.filter(x => x !== perm.id) }))
                              }}
                              className="rounded bg-gray-100 border-gray-200 text-purple-500 focus:ring-purple-500"
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-purple-600 font-bold border-b border-gray-200 pb-2">HR Resources</h3>
                    
                    {/* Shift Assignments */}
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                      <label className="block text-gray-900 font-bold text-sm mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/> Shift Assignment</label>
                      <div className="flex gap-2 mb-2">
                        <input type="time" value={tempShiftTime} onChange={e => setTempShiftTime(e.target.value)}
                          className="flex-1 bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                        <button type="button" onClick={() => {
                          if (tempShiftTime) {
                            setUserForm(p => ({ ...p, work_schedule: [...p.work_schedule, { startTime: tempShiftTime, durationHours: 8 }] }))
                            setTempShiftTime("")
                          }
                        }} className="px-3 bg-purple-500 text-gray-900 rounded-lg hover:bg-purple-600 text-sm font-bold">Add</button>
                      </div>
                      <div className="space-y-1">
                        {userForm.work_schedule.map((shift, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-gray-100 px-2 py-1 rounded">
                            <span>{shift.startTime} (8 hrs)</span>
                            <button type="button" onClick={() => setUserForm(p => ({...p, work_schedule: p.work_schedule.filter((_,i)=>i!==idx)}))} className="text-red-600 hover:text-red-300"><X className="w-3 h-3"/></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Office Assets */}
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                      <label className="block text-gray-900 font-bold text-sm mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Assign Assets</label>
                      <div className="space-y-2 mb-2">
                        <input placeholder="Asset Name (e.g. Laptop)" value={tempAssetItem} onChange={e => setTempAssetItem(e.target.value)}
                          className="w-full bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                        <div className="flex gap-2">
                          <input placeholder="Serial No." value={tempAssetSerial} onChange={e => setTempAssetSerial(e.target.value)}
                            className="flex-1 bg-gray-50 text-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
                          <button type="button" onClick={() => {
                            if (tempAssetItem) {
                              setUserForm(p => ({ ...p, office_assets: [...p.office_assets, { item: tempAssetItem, serialNo: tempAssetSerial, issuedDate: format(new Date(), 'yyyy-MM-dd') }] }))
                              setTempAssetItem(""); setTempAssetSerial("");
                            }
                          }} className="px-3 bg-purple-500 text-gray-900 rounded-lg hover:bg-purple-600 text-sm font-bold">Assign</button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {userForm.office_assets.map((asset, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-gray-100 px-2 py-1 rounded">
                            <span>{asset.item} <span className="text-gray-400">({asset.serialNo})</span></span>
                            <button type="button" onClick={() => setUserForm(p => ({...p, office_assets: p.office_assets.filter((_,i)=>i!==idx)}))} className="text-red-600 hover:text-red-300"><X className="w-3 h-3"/></button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" disabled={creatingUser} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold disabled:opacity-50">
                    {creatingUser ? "Saving..." : editingEmp ? "Update Info" : "Create Staff"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Request Leave</h2>
                <button onClick={() => setShowLeaveModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleLeaveSubmit} className="space-y-3">
                {isHead && (
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Employee Name *</label>
                    <input required value={leaveForm.employee_name} onChange={e => setLeaveForm(p => ({ ...p, employee_name: e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                  </div>
                )}
                {!isHead && (
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">Employee Name</label>
                    <input readOnly value={currentUser?.name || ''} 
                      className="w-full bg-white border border-gray-200 text-gray-500 px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 cursor-not-allowed" />
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Leave Type</label>
                  <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['From', 'from_date'], ['To', 'to_date']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-gray-600 text-sm mb-1">{label}</label>
                      <input required type="date" value={(leaveForm as any)[key]} onChange={e => setLeaveForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Reason</label>
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} rows={2}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" onClick={() => !isHead && setLeaveForm(p => ({ ...p, employee_name: currentUser?.name }))}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Record Salary Payout</h2>
                <button onClick={() => setShowPayoutModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handlePayoutSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Employee *</label>
                  <select required value={payoutForm.employee_name} onChange={e => setPayoutForm(p => ({ ...p, employee_name: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.full_name || e.email}>{e.full_name || e.email}</option>)}
                  </select>
                </div>
                {[['Month (YYYY-MM)', 'month', 'month', payoutForm.month], ['Amount (LKR)', 'amount', 'number', payoutForm.amount], ['Paid On', 'paid_on', 'date', payoutForm.paid_on]].map(([label, key, type, val]) => (
                  <div key={key as string}>
                    <label className="block text-gray-600 text-sm mb-1">{label as string}</label>
                    <input type={type as string} value={val as any}
                      onChange={e => setPayoutForm(p => ({ ...p, [key as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Notes</label>
                  <input value={payoutForm.notes} onChange={e => setPayoutForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPayoutModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Add Performance Review</h2>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Employee *</label>
                  <select required value={reviewForm.employee_name} onChange={e => setReviewForm(p => ({ ...p, employee_name: e.target.value }))}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500">
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.full_name || e.email}>{e.full_name || e.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Quarter</label>
                  <input value={reviewForm.quarter} onChange={e => setReviewForm(p => ({ ...p, quarter: e.target.value }))}
                    placeholder="e.g. Q1 2026"
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Score (0–100): {reviewForm.score}</label>
                  <input type="range" min={0} max={100} value={reviewForm.score} onChange={e => setReviewForm(p => ({ ...p, score: Number(e.target.value) }))}
                    className="w-full accent-purple-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Poor</span><span>Excellent</span></div>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Notes</label>
                  <textarea value={reviewForm.notes} onChange={e => setReviewForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-gray-50 text-gray-900 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl border border-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-gray-900 rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}



