"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X, Calendar, RefreshCw, Clock, UserCircle } from "lucide-react"
import { getHrRoster, createHrRoster, deleteHrRoster, getAllProfiles } from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import type { HrRoster, Profile } from "@/types"

const ROSTER_TYPES = ["Shift", "Duty", "On-call", "Other"] as const
const SHIFTS = ["Morning", "Afternoon", "Evening", "Night", "Full Day"]

const TYPE_COLORS: Record<string, string> = {
  Shift:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Duty:       "bg-green-500/20 text-green-400 border-green-500/30",
  "On-call":  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Other:      "bg-gray-500/20 text-gray-300 border-gray-500/30",
}
const SHIFT_COLORS: Record<string, string> = {
  Morning:  "text-yellow-400",
  Afternoon: "text-orange-400",
  Evening:  "text-purple-400",
  Night:    "text-blue-400",
  "Full Day": "text-cyan-400",
}

export default function IMSRosterPage() {
  const [roster, setRoster] = useState<HrRoster[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"))
  const [currentUser, setCurrentUser] = useState<any>(null)

  const emptyForm = { date: format(new Date(), "yyyy-MM-dd"), type: "Shift" as const, shift: "", assigned_to: null as string | null, assigned_name: "", description: "" }
  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, u, cu] = await Promise.all([getHrRoster(), getAllProfiles(), getCurrentUser()])
      setRoster(r)
      setUsers(u.filter((u: Profile) => u.role !== "student"))
      setCurrentUser(cu)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.role === "hr_officer" || currentUser?.access_level >= 2

  const handleSubmit = async () => {
    if (!form.date) return toast.error("Date required")
    try {
      const assignedUser = users.find(u => u.id === form.assigned_to)
      const created = await createHrRoster({
        ...form,
        assigned_name: assignedUser?.full_name || form.assigned_name || null,
        created_by: currentUser?.id,
      })
      setRoster(prev => [created, ...prev])
      toast.success("Roster entry added")
      setShowModal(false); setForm(emptyForm)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    if (!canEdit) return toast.error("You don't have permission to delete roster entries")
    if (!confirm("Remove this roster entry?")) return
    try {
      await deleteHrRoster(id)
      setRoster(prev => prev.filter(r => r.id !== id))
      toast.success("Deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const filteredRoster = roster.filter(r => r.date.startsWith(filterMonth))
  const grouped = filteredRoster.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {} as Record<string, HrRoster[]>)
  const sortedDates = Object.keys(grouped).sort()

  const inputCls = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all [color-scheme:dark]"

  return (
    <div className="min-h-screen bg-[#050B14] p-4 md:p-8 space-y-6 text-white selection:bg-pink-500/20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Roster Management
          </h1>
          <p className="text-sm text-white/50 mt-1">Staff duty, shift scheduling & on-call assignments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors text-sm font-medium" onClick={loadData}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all text-sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Stats + Month Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-2xl px-5 py-3">
          <Calendar className="h-4 w-4 text-pink-400" />
          <label className="text-sm font-bold text-white/60">Month</label>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none [color-scheme:dark]" />
        </div>
        <div className="flex gap-3">
          {[
            { label: "Total Entries", value: filteredRoster.length, color: "text-white" },
            { label: "Days Scheduled", value: sortedDates.length, color: "text-pink-400" },
          ].map((s, i) => (
            <div key={i} className="bg-black/20 border border-white/10 rounded-2xl px-5 py-3">
              <p className="text-xs text-white/50">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Groups */}
      {loading ? (
        <div className="text-center py-20 text-white/40">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
          <p>Loading roster...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20 text-white/40 bg-black/20 border border-white/10 rounded-2xl">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No roster entries</p>
          <p className="text-sm mt-1">No shifts scheduled for {filterMonth}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => {
            const isToday = date === format(new Date(), "yyyy-MM-dd")
            return (
              <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-black/20 border rounded-2xl overflow-hidden ${isToday ? 'border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'border-white/10'}`}>
                <div className={`px-6 py-3 flex items-center justify-between border-b ${isToday ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-white/5'}`}>
                  <p className="font-bold text-white">
                    {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                  </p>
                  {isToday && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                      <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" /> Today
                    </span>
                  )}
                </div>
                <div className="divide-y divide-white/5">
                  {grouped[date].map((entry, i) => (
                    <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(entry.assigned_name || entry.assignee?.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${TYPE_COLORS[entry.type] || TYPE_COLORS.Other}`}>
                              {entry.type}
                            </span>
                            {entry.shift && (
                              <span className={`text-xs font-bold ${SHIFT_COLORS[entry.shift] || 'text-white/60'}`}>
                                <Clock className="h-3 w-3 inline mr-1" />{entry.shift}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {entry.assigned_name || entry.assignee?.full_name || "Unassigned"}
                          </p>
                          {entry.description && (
                            <p className="text-xs text-white/40 mt-0.5">{entry.description}</p>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <button onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ADD MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1628] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Add Roster Entry</h2>
                  <p className="text-white/50 text-sm mt-1">Schedule a shift or duty assignment</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/70">Date *</label>
                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      className={inputCls + " [color-scheme:dark]"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/70">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                      className={inputCls}>
                      {ROSTER_TYPES.map(t => <option key={t} value={t} className="bg-[#0e1628]">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/70">Shift</label>
                  <div className="flex flex-wrap gap-2">
                    {["", ...SHIFTS].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, shift: s }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.shift === s ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-black/20 border-white/10 text-white/40 hover:border-white/30'}`}>
                        {s || "N/A"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/70">Assigned To</label>
                  <select value={form.assigned_to || ""} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value || null }))}
                    className={inputCls}>
                    <option value="" className="bg-[#0e1628]">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id} className="bg-[#0e1628]">{u.full_name || u.email}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/70">Notes</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..."
                    className={inputCls} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold shadow-lg transition-all">
                    Add Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
