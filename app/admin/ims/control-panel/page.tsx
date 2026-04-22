"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  Terminal, Send, LogOut, Bell, Users, Shield,
  Clock, AlertTriangle, CheckCircle, X, RefreshCw, Activity, Zap
} from "lucide-react"
import {
  getAllProfiles, getSystemCommands, createSystemCommand,
  updateSystemCommandStatus, disableUser, getLoginHistory,
} from "@/lib/ims-data"
import { getCurrentUser } from "@/lib/auth"
import type { Profile, ImsSystemCommand, ImsLoginHistory } from "@/types"

type CmdType = "force_logout" | "popup" | "broadcast" | "disable_user"

const CMD_META: Record<CmdType, { icon: React.ReactNode; label: string; color: string }> = {
  force_logout:  { icon: <LogOut className="h-4 w-4" />,  label: "Force Logout",    color: "text-red-400" },
  popup:         { icon: <Bell className="h-4 w-4" />,     label: "Popup Alert",     color: "text-yellow-400" },
  broadcast:     { icon: <Send className="h-4 w-4" />,     label: "Broadcast",       color: "text-blue-400" },
  disable_user:  { icon: <Shield className="h-4 w-4" />,   label: "Disable Account", color: "text-orange-400" },
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/20",
}

export default function IMSControlPanelPage() {
  const [users, setUsers]         = useState<Profile[]>([])
  const [commands, setCommands]   = useState<ImsSystemCommand[]>([])
  const [loginLogs, setLoginLogs] = useState<ImsLoginHistory[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<"commands" | "login_history" | "active_users">("commands")
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [cmdType, setCmdType]       = useState<CmdType>("broadcast")
  const [cmdTarget, setCmdTarget]   = useState<string>("all")
  const [cmdMessage, setCmdMessage] = useState("")
  const [sending, setSending]       = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [u, c, l, cu] = await Promise.all([
        getAllProfiles(), getSystemCommands(), getLoginHistory(), getCurrentUser(),
      ])
      setUsers(u.filter((p: Profile) => p.role !== "student" && !p.disabled))
      setCommands(c)
      setLoginLogs(l)
      setCurrentUser(cu)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const isSuperAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  const handleSendCommand = async () => {
    if (!cmdMessage.trim() && cmdType !== "force_logout" && cmdType !== "disable_user") {
      return toast.error("Message required for this command type")
    }
    if ((cmdType === "force_logout" || cmdType === "disable_user") && cmdTarget === "all") {
      return toast.error(`Cannot ${cmdType.replace("_"," ")} all users at once`)
    }
    setSending(true)
    try {
      const targetProfile = cmdTarget !== "all" ? users.find(u => u.id === cmdTarget) : null
      const cmd = await createSystemCommand({
        type: cmdType,
        message: cmdMessage || null,
        target_user_id: targetProfile?.id || null,
        target_user_name: targetProfile?.full_name || (cmdTarget === "all" ? "All Users" : null),
        sent_by_id: currentUser?.id,
        sent_by_name: currentUser?.name,
        status: "pending",
      })
      setCommands(prev => [cmd, ...prev])
      if (cmdType === "disable_user" && targetProfile) {
        await disableUser(targetProfile.id, true)
        setUsers(prev => prev.filter(u => u.id !== targetProfile.id))
        toast.success(`${targetProfile.full_name} has been disabled`)
      } else {
        toast.success("Command sent successfully")
      }
      setCmdMessage(""); setCmdTarget("all")
    } catch (e: any) { toast.error(e.message) }
    finally { setSending(false) }
  }

  const handleCancelCommand = async (id: string) => {
    try {
      await updateSystemCommandStatus(id, "cancelled")
      setCommands(prev => prev.map(c => c.id === id ? { ...c, status: "cancelled" } : c))
      toast.success("Command cancelled")
    } catch (e: any) { toast.error(e.message) }
  }

  const recentLogins = loginLogs.slice(0, 50)
  const inputCls = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all [color-scheme:dark]"

  const tabs = [
    { id: "commands" as const,      label: "Commands",      icon: <Zap className="h-4 w-4" /> },
    { id: "login_history" as const, label: "Login History", icon: <Activity className="h-4 w-4" /> },
    { id: "active_users" as const,  label: "Active Staff",  icon: <Users className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#050B14] p-4 md:p-8 space-y-6 text-white selection:bg-red-500/20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            System Control Panel
          </h1>
          <p className="text-sm text-white/50 mt-1">Admin-only commands, login history & system audit</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors text-sm font-medium" onClick={loadData}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Access warning */}
      {!isSuperAdmin && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-red-400">Restricted Access</p>
            <p className="text-sm text-red-400/70">This panel is restricted to Super Admin and Admin roles only. You can view data but cannot send commands.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Staff",   value: users.length,                                    icon: Users,    color: "text-blue-400",   glow: "shadow-blue-500/10" },
          { label: "Commands Sent",  value: commands.length,                                 icon: Terminal, color: "text-purple-400", glow: "shadow-purple-500/10" },
          { label: "Pending Cmds",   value: commands.filter(c => c.status === "pending").length, icon: Clock, color: "text-yellow-400", glow: "shadow-yellow-500/10" },
          { label: "Login Events",   value: loginLogs.length,                                icon: Shield,   color: "text-green-400",  glow: "shadow-green-500/10" },
        ].map((s, i) => (
          <div key={i} className={`bg-black/20 border border-white/10 rounded-2xl p-5 shadow-lg ${s.glow}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/50">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color} opacity-60`} />
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{loading ? "…" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/20 border border-white/10 rounded-2xl p-1.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* COMMANDS TAB */}
      {activeTab === "commands" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Command */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Send System Command</h3>
            </div>

            {!isSuperAdmin && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-sm text-orange-400 font-medium">
                Read-only: You don't have permission to send commands.
              </div>
            )}

            {/* Command Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Command Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(CMD_META) as [CmdType, typeof CMD_META[CmdType]][]).map(([key, meta]) => (
                  <button key={key} type="button" onClick={() => setCmdType(key)} disabled={!isSuperAdmin}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 ${
                      cmdType === key ? `bg-red-500/20 border-red-500/40 ${meta.color}` : 'bg-black/20 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                    }`}>
                    <span className={cmdType === key ? meta.color : "opacity-50"}>{meta.icon}</span>
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Target User</label>
              <select value={cmdTarget} onChange={e => setCmdTarget(e.target.value)} disabled={!isSuperAdmin}
                className={inputCls + " disabled:opacity-50"}>
                {cmdType === "broadcast" && <option value="all" className="bg-[#0e1628]">All Users</option>}
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#0e1628]">
                    {u.full_name} ({u.role.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            {cmdType !== "force_logout" && cmdType !== "disable_user" && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/70">Message</label>
                <textarea rows={3} disabled={!isSuperAdmin}
                  placeholder={cmdType === "broadcast" ? "Message to broadcast to all staff…" : "Message for popup alert…"}
                  value={cmdMessage} onChange={e => setCmdMessage(e.target.value)}
                  className={inputCls + " resize-none disabled:opacity-50"} />
              </div>
            )}

            {/* Warning */}
            <div className={`rounded-xl p-4 text-sm font-medium ${
              cmdType === "force_logout" || cmdType === "disable_user"
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
            }`}>
              {cmdType === "force_logout" && "⚠️ This will immediately end the selected user's session."}
              {cmdType === "disable_user" && "⚠️ This will permanently disable the account until re-enabled."}
              {cmdType === "popup" && "ℹ️ This will display an alert popup to the selected user."}
              {cmdType === "broadcast" && "📢 This will send a message visible to all active staff members."}
            </div>

            <button onClick={handleSendCommand} disabled={sending || !isSuperAdmin}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? "Sending…" : "Send Command"}
            </button>
          </div>

          {/* Command History */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Command History</h3>
            </div>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {commands.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Terminal className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No commands sent yet</p>
                </div>
              ) : commands.map(cmd => (
                <div key={cmd.id} className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors group">
                  <div className={`mt-0.5 flex-shrink-0 ${CMD_META[cmd.type]?.color || "text-white/40"}`}>
                    {CMD_META[cmd.type]?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-white">{CMD_META[cmd.type]?.label}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[cmd.status] || STATUS_COLORS.cancelled}`}>
                        {cmd.status}
                      </span>
                    </div>
                    {cmd.message && <p className="text-xs text-white/50 truncate mb-1">"{cmd.message}"</p>}
                    <p className="text-[10px] text-white/30">
                      → {cmd.target_user_name || "All"} · by {cmd.sent_by_name} · {format(new Date(cmd.sent_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                  {cmd.status === "pending" && isSuperAdmin && (
                    <button onClick={() => handleCancelCommand(cmd.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN HISTORY TAB */}
      {activeTab === "login_history" && (
        <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-white/5 border-b border-white/10">
            <h3 className="font-bold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-green-400" /> Recent Login Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-white/40 uppercase bg-black/40">
                <tr>
                  {["User", "Email", "Login Time", "IP Address", "Device"].map(h => (
                    <th key={h} className="text-left py-4 px-6 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/40">Loading…</td></tr>
                ) : recentLogins.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/30">No login history found</td></tr>
                ) : recentLogins.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">{log.user_name || "—"}</td>
                    <td className="py-4 px-6 text-white/50 text-xs">{log.email || "—"}</td>
                    <td className="py-4 px-6 text-white/60 text-xs">
                      {log.login_time ? format(new Date(log.login_time), "MMM d yyyy, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-4 px-6 text-cyan-400/70 text-xs font-mono">{log.ip_address || "—"}</td>
                    <td className="py-4 px-6 text-white/30 text-xs max-w-[200px] truncate" title={log.device_info || ""}>
                      {log.device_info ? log.device_info.replace(/Mozilla\/[^ ]+/, "").substring(0, 50) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE STAFF TAB */}
      {activeTab === "active_users" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-white/30 bg-black/20 border border-white/10 rounded-2xl">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No active staff users found</p>
            </div>
          ) : users.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                {(u.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{u.full_name || "—"}</p>
                <p className="text-xs text-white/40 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 capitalize">
                    {u.role.replace(/_/g, " ")}
                  </span>
                  {u.department && (
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-white/40 border border-white/10">
                      {u.department}
                    </span>
                  )}
                </div>
              </div>
              {u.last_active && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-white/30">Last active</p>
                  <p className="text-xs font-bold text-white/60">{format(new Date(u.last_active), "MMM d")}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
