"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, X, Search, ShieldOff, ShieldCheck,
  Users, RefreshCw, Download, ShieldPlus, Info, Lock
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllProfiles, createStaffUser, updateProfileRole, disableUser } from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import {
  PERMISSION_DEFS, ROLE_BASE_PERMISSIONS, getExtraPermissions,
  hasPermission
} from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"
import type { Profile, UserRole } from "@/types"
import * as XLSX from "xlsx"

const IMS_ROLES: UserRole[] = [
  "admin", "super_admin", "branch_manager",
  "marketing_staff", "academic_staff", "finance_officer", "hr_officer", "staff",
  "academic_manager", "trainer", "coordinator", "student",
]
const DEPARTMENTS = ["Academic", "Marketing", "Finance", "HR", "IT", "Operations"]

const ROLE_COLORS: Record<string, string> = {
  admin:            "bg-red-100 text-red-600 border-red-200",
  super_admin:      "bg-red-100 text-red-600 border-red-200",
  branch_manager:   "bg-purple-100 text-purple-600 border-purple-200",
  marketing_staff:  "bg-pink-100 text-pink-600 border-pink-200",
  academic_staff:   "bg-blue-500/20 text-blue-600 border-blue-500/20",
  finance_officer:  "bg-green-100 text-green-700 border-green-200",
  hr_officer:       "bg-orange-500/20 text-orange-700 border-orange-500/20",
  staff:            "bg-gray-500/20 text-gray-300 border-gray-500/20",
  student:          "bg-cyan-500/20 text-cyan-700 border-cyan-500/20",
  trainer:          "bg-yellow-100 text-yellow-700 border-yellow-200",
  academic_manager: "bg-indigo-500/20 text-indigo-700 border-indigo-500/20",
  coordinator:      "bg-teal-500/20 text-teal-400 border-teal-500/20",
}

// ── Permission Checkbox Grid ─────────────────────────────────

interface PermissionGridProps {
  role: UserRole
  grantedPermissions: Permission[]
  onChange: (perms: Permission[]) => void
  readOnly?: boolean
}

function PermissionGrid({ role, grantedPermissions, onChange, readOnly }: PermissionGridProps) {
  const basePerms = ROLE_BASE_PERMISSIONS[role] || []
  const groups = ['IMS', 'ASMS', 'Tasks'] as const

  const togglePerm = (key: Permission) => {
    if (readOnly) return
    if (grantedPermissions.includes(key)) {
      onChange(grantedPermissions.filter(p => p !== key))
    } else {
      onChange([...grantedPermissions, key])
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(group => {
        const items = PERMISSION_DEFS.filter(d => d.group === group)
        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group}</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {items.map(def => {
                const isBase = basePerms.includes(def.key)
                const isGranted = isBase || grantedPermissions.includes(def.key)
                const isExtra = !isBase && grantedPermissions.includes(def.key)

                return (
                  <motion.label
                    key={def.key}
                    whileHover={!isBase ? { scale: 1.01, x: 4 } : {}}
                    whileTap={!isBase ? { scale: 0.99 } : {}}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      isBase
                        ? 'bg-blue-500/10 border-blue-500/20 opacity-80 cursor-default'
                        : isExtra
                          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          : 'bg-gray-200 border-gray-100 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => !isBase && togglePerm(def.key)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isBase ? (
                        <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Lock className="h-3 w-3 text-gray-900" />
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${
                          isGranted
                            ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                            : 'border-gray-200 bg-gray-100'
                        }`}>
                          {isGranted && (
                            <motion.svg initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold transition-colors ${isGranted ? 'text-gray-900' : 'text-gray-600'}`}>{def.label}</span>
                        {isBase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-600 font-bold border border-blue-500/20 uppercase tracking-tighter">
                            Default
                          </span>
                        )}
                        {isExtra && (
                          <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/20 uppercase tracking-tighter">
                            Granted
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{def.description}</p>
                    </div>
                  </motion.label>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <strong className="text-blue-600">Blue/Lock</strong> permissions are fixed for this role. 
          <br />
          <strong className="text-emerald-700">Emerald</strong> permissions are custom overrides granted to this specific user.
        </p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────

export default function IMSUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const emptyForm = {
    email: "", password: "", name: "",
    role: "staff" as UserRole,
    position: "", department: "", access_level: 1,
    permissions: [] as Permission[],
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
  }
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  const [tempShiftTime, setTempShiftTime] = useState("")
  const [tempAssetItem, setTempAssetItem] = useState("")
  const [tempAssetSerial, setTempAssetSerial] = useState("")

  // Edit role modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({
    role: "staff" as UserRole,
    position: "",
    department: "",
    access_level: 1,
    task_delete_permission: false,
    permissions: [] as Permission[],
    work_schedule: [] as { startTime: string, durationHours: number }[],
    office_assets: [] as { item: string, serialNo?: string, issuedDate?: string }[],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, u] = await Promise.all([getAllProfiles(), getCurrentUser()])
      setProfiles(p); setCurrentUser(u)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.role === "hr_officer" || currentUser?.permissions?.includes("ims_users")
  const canGrantPermissions = currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.role === "branch_manager"

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.name)
      return toast.error("Email, password & name required")
    if (createForm.password.length < 6) return toast.error("Password must be at least 6 characters")
    setCreating(true)
    try {
      await createStaffUser({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        role: createForm.role,
        position: createForm.position,
        department: createForm.department || undefined,
        access_level: createForm.access_level,
        work_schedule: createForm.work_schedule,
        office_assets: createForm.office_assets,
      })
      // After creation, update permissions if any extras were set
      toast.success("User created — they can now log in with their credentials")
      setShowCreateModal(false); setCreateForm(emptyForm)
      await loadData()
    } catch (e: any) { toast.error(e.message) }
    finally { setCreating(false) }
  }

  const openEditModal = (p: Profile) => {
    setEditingProfile(p)
    // Only store the EXTRA permissions (not the base role ones) in UI state
    const extras = getExtraPermissions(p.role, (p.permissions as Permission[]) || [])
    setEditForm({
      role: p.role,
      position: p.position || "",
      department: p.department || "",
      access_level: p.access_level || 1,
      task_delete_permission: p.task_delete_permission || false,
      permissions: extras,
      work_schedule: p.work_schedule || [],
      office_assets: p.office_assets || [],
    })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingProfile) return
    try {
      // Sync task_delete_permission with the task_delete permission key
      const hasTaskDelete = editForm.permissions.includes('task_delete') || editForm.task_delete_permission
      const finalPerms = hasTaskDelete
        ? Array.from(new Set([...editForm.permissions, 'task_delete' as Permission]))
        : editForm.permissions.filter(p => p !== 'task_delete')

      const updated = await updateProfileRole(editingProfile.id, {
        role: editForm.role,
        position: editForm.position,
        department: editForm.department,
        access_level: editForm.access_level,
        task_delete_permission: hasTaskDelete,
        permissions: finalPerms,
        work_schedule: editForm.work_schedule,
        office_assets: editForm.office_assets,
      })
      setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, ...updated } : p))
      toast.success("Profile updated with new permissions")
      setShowEditModal(false); setEditingProfile(null)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleToggleDisable = async (p: Profile) => {
    if (!isAdmin) return toast.error("Only admins can disable accounts")
    if (p.id === currentUser?.id) return toast.error("You cannot disable your own account")
    if (!confirm(`${p.disabled ? "Enable" : "Disable"} ${p.full_name}?`)) return
    try {
      await disableUser(p.id, !p.disabled)
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, disabled: !p.disabled } : x))
      toast.success(`Account ${p.disabled ? "enabled" : "disabled"}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const exportUsers = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProfiles.map(p => ({
      Name: p.full_name, Email: p.email, Role: p.role,
      Position: p.position, Department: p.department,
      AccessLevel: p.access_level,
      ExtraPermissions: ((p.permissions as Permission[]) || []).join(', '),
      Status: p.disabled ? "Disabled" : "Active",
      Joined: p.created_at ? format(new Date(p.created_at), "yyyy-MM-dd") : "—",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Users")
    XLSX.writeFile(wb, `users_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const filteredProfiles = profiles.filter(p => {
    const matchSearch = !search ||
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.department || "").toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === "all" || p.role === filterRole
    return matchSearch && matchRole
  })

  const roleGroups = IMS_ROLES.reduce((acc, r) => {
    acc[r] = profiles.filter(p => p.role === r).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-700" /> Staff Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage accounts, roles and individual access permissions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl border border-gray-200 transition-colors" onClick={loadData}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl border border-gray-200 transition-colors" onClick={exportUsers}><Download className="h-4 w-4" /> Export</button>
          {isAdmin && (
            <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-gray-900 font-bold rounded-xl shadow-lg transition-all" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" /> Add New Staff
            </button>
          )}
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { role: "all",             label: "All Users", count: profiles.length },
          { role: "admin",           label: "Admins",    count: (roleGroups["admin"] || 0) + (roleGroups["super_admin"] || 0) + (roleGroups["branch_manager"] || 0) },
          { role: "marketing_staff", label: "Marketing", count: roleGroups["marketing_staff"] || 0 },
          { role: "academic_staff",  label: "Academic",  count: roleGroups["academic_staff"] || 0 },
          { role: "finance_officer", label: "Finance",   count: roleGroups["finance_officer"] || 0 },
          { role: "hr_officer",      label: "HR",        count: roleGroups["hr_officer"] || 0 },
        ].map(g => (
          <div key={g.role} onClick={() => setFilterRole(g.role)}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${filterRole === g.role ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gray-100 border-gray-200 hover:border-white/30 hover:bg-gray-100'}`}>
            <p className="text-xs text-gray-600 mb-1">{g.label}</p>
            <p className={`text-2xl font-black ${filterRole === g.role ? 'text-cyan-700' : 'text-gray-900'}`}>{g.count}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role & Access</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map(p => {
                  const extrasCount = getExtraPermissions(p.role, (p.permissions as Permission[]) || []).length
                  return (
                    <tr key={p.id} className={`hover:bg-gray-100 transition-colors ${p.disabled ? 'opacity-60 bg-red-900/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-gray-900 font-bold shadow-lg">
                            {p.full_name?.charAt(0) || p.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.full_name || '—'}</p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${ROLE_COLORS[p.role] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                            {p.role.replace(/_/g, ' ')}
                          </span>
                          {extrasCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                              <ShieldPlus className="h-3 w-3" /> +{extrasCount} custom perms
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.department ? (
                          <span className="text-gray-600">{p.department}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                        {p.position && <p className="text-xs text-gray-400 mt-0.5">{p.position}</p>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.disabled ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {p.disabled ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {p.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(p)} className="p-2 bg-gray-100 hover:bg-blue-500/20 text-gray-600 hover:text-blue-600 rounded-lg transition-colors" title="Edit user">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleToggleDisable(p)} className={`p-2 rounded-lg transition-colors ${p.disabled ? 'bg-green-500/10 text-green-700 hover:bg-green-100' : 'bg-red-500/10 text-red-600 hover:bg-red-100'}`} title={p.disabled ? "Enable user" : "Disable user"}>
                              {p.disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE USER MODAL ─────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 w-full max-w-4xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Staff User</h2>
                <p className="text-gray-500 text-sm mt-1">Set up base credentials, role, and department.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-cyan-700 mb-4 uppercase tracking-wider">Account Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Full Name *</label>
                    <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" required
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Email *</label>
                    <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" required
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Password *</label>
                    <input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-cyan-700 mb-4 uppercase tracking-wider mt-6">Role & Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">System Role *</label>
                    <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value as UserRole }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      {IMS_ROLES.map(r => <option key={r} value={r} className="bg-white text-gray-900">{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Department</label>
                    <select value={createForm.department} onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-cyan-500">
                      <option value="" className="bg-white text-gray-900">Select Department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-white text-gray-900">{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Job Title</label>
                    <input value={createForm.position} onChange={e => setCreateForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Senior Instructor"
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl font-semibold">Cancel</button>
                <button onClick={handleCreateUser} disabled={creating} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-gray-900 rounded-xl shadow-lg font-bold disabled:opacity-50">
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ROLE & PERMISSIONS MODAL ─────────────── */}
      {showEditModal && editingProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-[2rem] w-full max-w-lg shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-[2rem]">
              <div>
                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <ShieldPlus className="h-5 w-5 text-cyan-700" />
                  Role & Permissions
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{editingProfile.full_name} — {editingProfile.email}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as UserRole, permissions: [] }))}
                    className="w-full bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500 transition-all [color-scheme:dark]">
                    {IMS_ROLES.map(r => <option key={r} value={r} className="bg-white">{r.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Department</label>
                  <select value={editForm.department || "none"} onChange={e => setEditForm(p => ({ ...p, department: e.target.value === "none" ? "" : e.target.value }))}
                    className="w-full bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500 transition-all [color-scheme:dark]">
                    <option value="none" className="bg-white">None</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Position / Title</label>
                  <input value={editForm.position} onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))} placeholder="Job title..."
                    className="w-full bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Access Level</label>
                  <div className="flex gap-2">
                    {[{v:1,label:"Standard"},{v:2,label:"Head"}].map(lvl => (
                      <button key={lvl.v} type="button" onClick={() => setEditForm(p => ({ ...p, access_level: lvl.v }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${editForm.access_level === lvl.v ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-700' : 'bg-gray-100 border-gray-200 text-gray-400 hover:border-white/30'}`}>
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permission Grid */}
              <div>
                <h3 className="text-xs font-bold text-cyan-700 mb-4 uppercase tracking-wider">Granular Permissions</h3>
                {!canGrantPermissions ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 p-4 rounded-xl text-sm font-medium">
                    You do not have sufficient privileges to modify granular permissions.
                  </div>
                ) : (
                  <div className="bg-gray-200 border border-gray-200 rounded-2xl p-4">
                    <PermissionGrid
                      role={editForm.role}
                      grantedPermissions={editForm.permissions}
                      onChange={p => setEditForm(prev => ({ ...prev, permissions: p }))}
                    />
                  </div>
                )}
              </div>

              {/* Active permissions summary */}
              {editForm.permissions.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2">Extra permissions being granted:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.permissions.map(key => (
                      <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 font-medium">
                        {PERMISSION_DEFS.find(d => d.key === key)?.label || key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Schedule */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Work Schedule (Shifts)</label>
                <div className="flex gap-2">
                  <input type="time" value={tempShiftTime} onChange={e => setTempShiftTime(e.target.value)}
                    className="flex-1 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
                  <button type="button" onClick={() => { if (tempShiftTime) { setEditForm(p => ({ ...p, work_schedule: [...p.work_schedule, { startTime: tempShiftTime, durationHours: 8 }] })); setTempShiftTime(''); }}}
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 border border-cyan-500/30 rounded-xl text-sm font-bold transition-all">
                    Add
                  </button>
                </div>
                {editForm.work_schedule.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.work_schedule.map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600">
                        ⏰ {shift.startTime}
                        <button type="button" onClick={() => setEditForm(p => ({ ...p, work_schedule: p.work_schedule.filter((_, i) => i !== idx) }))}
                          className="text-red-600 hover:text-red-300 ml-1"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Office Assets */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Office Assets</label>
                <div className="flex gap-2">
                  <input placeholder="Asset (e.g. Laptop)" value={tempAssetItem} onChange={e => setTempAssetItem(e.target.value)}
                    className="flex-1 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-all" />
                  <input placeholder="Serial" value={tempAssetSerial} onChange={e => setTempAssetSerial(e.target.value)}
                    className="w-24 bg-gray-200 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-all" />
                  <button type="button" onClick={() => { if (tempAssetItem) { setEditForm(p => ({ ...p, office_assets: [...p.office_assets, { item: tempAssetItem, serialNo: tempAssetSerial, issuedDate: new Date().toISOString() }] })); setTempAssetItem(''); setTempAssetSerial(''); }}}
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 border border-cyan-500/30 rounded-xl text-sm font-bold transition-all">
                    Add
                  </button>
                </div>
                {editForm.office_assets.length > 0 && (
                  <div className="space-y-2">
                    {editForm.office_assets.map((asset, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-200 border border-gray-200 px-4 py-2.5 rounded-xl text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">{asset.item}</span>
                          {asset.serialNo && <span className="text-gray-400 ml-2 text-xs">SN: {asset.serialNo}</span>}
                        </div>
                        <button type="button" onClick={() => setEditForm(p => ({ ...p, office_assets: p.office_assets.filter((_, i) => i !== idx) }))} className="text-red-600 hover:text-red-300">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleEditSave} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 rounded-xl font-bold shadow-lg transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



