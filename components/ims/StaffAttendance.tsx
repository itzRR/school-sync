"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { Clock, LogIn, LogOut, CheckCircle, FileText, Download, RefreshCw, User, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { getMyAttendance, getAllAttendance, clockIn, clockOut, type StaffAttendanceSession } from "@/lib/ims-data"
import * as XLSX from "xlsx"

function durationStr(timeIn: string, timeOut?: string | null): string {
  if (!timeOut) return "Active"
  const mins = differenceInMinutes(parseISO(timeOut), parseISO(timeIn))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function timeStr(iso: string) {
  try { return format(parseISO(iso), "hh:mm a") } catch { return "—" }
}

export default function StaffAttendance({ isAdmin = false }: { isAdmin?: boolean }) {
  const [sessions, setSessions] = useState<StaffAttendanceSession[]>([])
  const [allSessions, setAllSessions] = useState<StaffAttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<StaffAttendanceSession | null>(null)
  const [userId, setUserId] =useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [tab, setTab] = useState<"my" | "team">("my")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportText, setReportText] = useState("")
  const [clockingOut, setClocingOut] = useState(false)

  // Today string
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Staff"
        setUserName(name)
      }
    })
  }, [])

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const mine = await getMyAttendance(userId)
      setSessions(mine)
      // Find active session (today, no time_out)
      const active = mine.find(s => s.date === today && !s.time_out)
      setActiveSession(active || null)
      if (isAdmin) {
        const all = await getAllAttendance()
        setAllSessions(all)
      }
    } catch (e: any) { toast.error("Could not load attendance") }
    finally { setLoading(false) }
  }, [userId, isAdmin, today])

  useEffect(() => { loadData() }, [loadData])

  const todaySessions = sessions.filter(s => s.date === today)
  const sessionIndex = todaySessions.length + 1

  const handleClockIn = async () => {
    if (!userId || !userName) return
    try {
      const session = await clockIn({ userId, userName, sessionIndex })
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      toast.success("Clocked in! Good morning 🌟")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleClockOut = async () => {
    if (!activeSession) return
    setClocingOut(true)
    setShowReportModal(true)
  }

  const submitClockOut = async () => {
    if (!activeSession) return
    try {
      const updated = await clockOut(activeSession.id, reportText)
      setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s))
      setActiveSession(null)
      setShowReportModal(false)
      setReportText("")
      setClocingOut(false)
      toast.success(`Clocked out! Duration: ${durationStr(updated.time_in, updated.time_out)}`)
    } catch (e: any) { toast.error(e.message) }
  }

  const exportMyAttendance = () => {
    const ws = XLSX.utils.json_to_sheet(sessions.map(s => ({
      Date: s.date,
      "Time In": timeStr(s.time_in),
      "Time Out": s.time_out ? timeStr(s.time_out) : "Active",
      Duration: durationStr(s.time_in, s.time_out),
      Status: s.status,
      "Daily Report": s.daily_report || "",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    XLSX.writeFile(wb, `attendance_${userName}_${format(new Date(), "yyyy-MM")}.xlsx`)
  }

  const presentDays = [...new Set(sessions.filter(s => s.time_out).map(s => s.date))].length
  const avgDuration = (() => {
    const completed = sessions.filter(s => s.time_out)
    if (!completed.length) return 0
    const total = completed.reduce((sum, s) => sum + differenceInMinutes(parseISO(s.time_out!), parseISO(s.time_in)), 0)
    return Math.round(total / completed.length)
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" /> My Attendance
          </h1>
          <p className="text-sm text-white/50">{format(new Date(), "EEEE, MMMM d, yyyy")} · Colombo time</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 text-white bg-white/5 hover:bg-white/10 flex items-center transition-colors"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</button>
          <button onClick={exportMyAttendance} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 text-white bg-white/5 hover:bg-white/10 flex items-center transition-colors"><Download className="h-4 w-4 mr-1" /> Export</button>
        </div>
      </div>

      {/* Clock widget */}
      <Card className={`border ${activeSession ? "border-green-500/50 bg-green-500/10" : "border-white/10 bg-black/20"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-5xl font-mono font-bold text-white" suppressHydrationWarning>
                {format(new Date(), "hh:mm")}
                <span className="text-2xl text-white/50 ml-1">{format(new Date(), "a")}</span>
              </p>
              <p className="text-sm text-white/50 mt-1">
                {activeSession ? (
                  <span className="text-green-400 font-semibold">
                    ✓ Clocked in at {timeStr(activeSession.time_in)}
                    {activeSession.session_index > 1 ? ` (Session ${activeSession.session_index})` : ""}
                  </span>
                ) : "Not clocked in today" }
              </p>
            </div>
            <div className="flex gap-3">
              {!activeSession ? (
                <button onClick={handleClockIn} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center border-0">
                  <LogIn className="h-4 w-4 mr-2" />
                  {todaySessions.length > 0 ? `Clock In (Session ${sessionIndex})` : "Clock In"}
                </button>
              ) : (
                <button onClick={handleClockOut} className="px-6 py-2.5 rounded-xl font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 transition-all shadow-lg flex items-center">
                  <LogOut className="h-4 w-4 mr-2" /> Clock Out
                </button>
              )}
            </div>
          </div>
          {todaySessions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-white/50 mb-2">Today's Sessions</p>
              <div className="flex flex-wrap gap-2">
                {todaySessions.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${s.time_out ? "bg-white/5 border-white/10 text-white/80" : "bg-green-500/20 border-green-500/30 text-green-400"}`}>
                    <span>Session {s.session_index}</span>
                    <span className="text-white/40">{timeStr(s.time_in)} → {s.time_out ? timeStr(s.time_out) : "Active"}</span>
                    <Badge className={s.status === "late" ? "bg-orange-500/20 text-orange-700 border-none px-1.5 text-[10px]" : "bg-green-500/20 text-green-400 border-none px-1.5 text-[10px]"}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present Days", value: presentDays, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Total Sessions", value: sessions.filter(s => s.time_out).length, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Avg Duration", value: `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m`, icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "This Month", value: sessions.filter(s => s.date.startsWith(today.slice(0, 7))).length, icon: User, color: "text-indigo-700", bg: "bg-indigo-500/10 border-indigo-500/20" },
        ].map((s, i) => (
          <Card key={i} className={`border ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-xl font-bold text-white">{loading ? "…" : s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs — only show Team if admin */}
      {isAdmin && (
        <div className="flex gap-1 border-b border-white/10">
          {(["my", "team"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-blue-400 text-blue-600" : "border-transparent text-white/50 hover:text-white/80"}`}>
              {t === "my" ? "My Records" : `Team Records (${allSessions.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {(tab === "team" && isAdmin ? ["Name", "Date", "Time In", "Time Out", "Duration", "Status", "Report"] : ["Date", "Time In", "Time Out", "Duration", "Status", "Report"]).map(h => (
                <th key={h} className="text-left py-3 px-4 font-medium text-white/60">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-white/40" /></td></tr>
            ) : (tab === "team" && isAdmin ? allSessions : sessions).length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-white/40">No attendance records yet</td></tr>
            ) : (tab === "team" && isAdmin ? allSessions : sessions).map(s => (
              <tr key={s.id} className={`border-b border-white/5 hover:bg-white/5 ${!s.time_out ? "bg-green-500/10" : ""}`}>
                {tab === "team" && isAdmin && <td className="py-3 px-4 font-medium text-white">{s.user_name}</td>}
                <td className="py-3 px-4 text-white/70">{s.date}</td>
                <td className="py-3 px-4 font-medium text-white">{timeStr(s.time_in)}</td>
                <td className="py-3 px-4 text-white/70">{s.time_out ? timeStr(s.time_out) : <Badge className="bg-green-500/20 text-green-400 border-none">Active</Badge>}</td>
                <td className="py-3 px-4 text-white">{durationStr(s.time_in, s.time_out)}</td>
                <td className="py-3 px-4">
                  <Badge className={`border-none ${
                    s.status === "late" ? "bg-orange-500/20 text-orange-700" :
                    !s.time_out ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-600"
                  }`}>{!s.time_out ? "active" : s.status}</Badge>
                </td>
                <td className="py-3 px-4 text-white/50 text-xs max-w-[150px] truncate" title={s.daily_report || ""}>
                  {s.daily_report ? (
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{s.daily_report}</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clock Out modal with daily report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md border border-white/10">
            <div className="p-5 border-b border-white/10">
              <h2 className="font-semibold text-lg text-white">Daily Report</h2>
              <p className="text-sm text-white/50 mt-0.5">Write a short summary of what you did today before clocking out.</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/30"
                rows={5}
                placeholder="Completed tasks, meetings, progress, blockers..."
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 hover:from-blue-600 hover:to-indigo-600 flex items-center justify-center transition-all shadow-lg" onClick={submitClockOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Submit & Clock Out
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-colors" onClick={() => { setShowReportModal(false); setClocingOut(false) }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

