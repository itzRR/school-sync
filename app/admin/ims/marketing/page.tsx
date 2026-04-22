"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format, isAfter } from "date-fns"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"

import {
  Megaphone, Plus, Edit, Trash2, X, Search, Phone, Mail, Bell,
  CheckCircle, TrendingUp, Users, Download, Filter, Star, List, RefreshCw, LogOut, Calendar, Clock, User, MessageSquare, Menu
} from "lucide-react"

import {
  getMarketingLeads, createMarketingLead, updateMarketingLead,
  deleteMarketingLead, getMarketingCampaigns, createMarketingCampaign,
  deleteMarketingCampaign, getAllProfiles, subscribeToMarketingLeads,
} from "@/lib/ims-data"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { MarketingLead, MarketingCampaign, Profile, LeadStatus, LeadSource, FollowUp } from "@/types"
import SriLankaCalendar from "@/components/ims/SriLankaCalendar"
import StaffAttendance from "@/components/ims/StaffAttendance"
import ProfileSection from "@/components/ims/ProfileSection"

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-up", "Converted", "Lost"]
const SOURCES: LeadSource[] = ["Facebook", "Website", "Walk-in", "Referral", "WhatsApp", "Other"]
const COURSES = ["AutoCAD", "SolidWorks", "3ds Max", "Revit", "CATIA", "BIM (Full Course)", "Navisworks", "Photoshop", "Other"]

const STATUS_COLORS: Record<LeadStatus, string> = {
  New:        "bg-blue-500/20 text-blue-400 border border-blue-500/20",
  Contacted:  "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20",
  "Follow-up":"bg-purple-500/20 text-purple-400 border border-purple-500/20",
  Converted:  "bg-green-500/20 text-green-400 border border-green-500/20",
  Lost:       "bg-red-500/20 text-red-400 border border-red-500/20",
}

export default function MarketingDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("leads")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [leads, setLeads] = useState<MarketingLead[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSource, setFilterSource] = useState<string>("all")

  // Modals
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [editingLead, setEditingLead] = useState<MarketingLead | null>(null)
  const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)

  const isHead = currentUser?.role === "admin" || currentUser?.role === "super_admin" ||
    currentUser?.role === "branch_manager" || currentUser?.access_level >= 2

  const emptyLead: {
    name: string; contact: string; email: string; occupation: string; dob: string
    nic: string; course_interested: string; source: LeadSource; status: LeadStatus
    assigned_to: string | null; campaign_id: string | null; follow_ups: FollowUp[]; notes: string
  } = { name: "", contact: "", email: "", occupation: "", dob: "", nic: "", course_interested: "AutoCAD", source: "Walk-in" as LeadSource, status: "New" as LeadStatus, assigned_to: null, campaign_id: null, follow_ups: [], notes: "" }
  const [leadForm, setLeadForm] = useState(emptyLead)

  const emptyCampaign = { name: "", source: "Facebook" as LeadSource, start_date: "", end_date: "", budget: 0, notes: "", created_by: null }
  const [campaignForm, setCampaignForm] = useState(emptyCampaign)

  const emptyFollowUp: FollowUp = { method: "Call", due_date: format(new Date(), "yyyy-MM-dd"), note: "", done: false }
  const [followUpForm, setFollowUpForm] = useState(emptyFollowUp)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [l, c, s, u] = await Promise.all([
        getMarketingLeads(), getMarketingCampaigns(), getAllProfiles(), getCurrentUser()
      ])
      setLeads(l); setCampaigns(c)
      setStaff(s.filter(p => ["admin","super_admin","branch_manager","marketing_staff"].includes(p.role)))
      setCurrentUser(u)
    } catch (e: any) { toast.error("Load failed: " + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadData()
    const unsub = subscribeToMarketingLeads(setLeads)
    return unsub
  }, [loadData])

  useEffect(() => { const t = setTimeout(() => setShowLoadingAnimation(false), 2000); return () => clearTimeout(t); }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadForm.name.trim()) return toast.error("Name is required")
    try {
      if (editingLead) {
        const updated = await updateMarketingLead(editingLead.id, { ...leadForm })
        setLeads(prev => prev.map(l => l.id === editingLead.id ? updated : l))
        toast.success("Lead updated")
      } else {
        const created = await createMarketingLead({ ...leadForm, created_by: currentUser?.id })
        setLeads(prev => [created, ...prev])
        toast.success("Lead added")
      }
      setShowLeadModal(false); setEditingLead(null); setLeadForm(emptyLead)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteLead = async (id: string) => {
    if (!isHead) return toast.error("Only managers can delete leads")
    if (!confirm("Delete this lead?")) return
    try {
      await deleteMarketingLead(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      toast.success("Lead deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignForm.name.trim()) return toast.error("Campaign name required")
    try {
      const created = await createMarketingCampaign({ ...campaignForm, created_by: currentUser?.id })
      setCampaigns(prev => [created, ...prev])
      toast.success("Campaign created")
      setShowCampaignModal(false); setCampaignForm(emptyCampaign)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!isHead) return toast.error("Only managers can delete campaigns")
    if (!confirm("Delete this campaign?")) return
    try {
      await deleteMarketingCampaign(id)
      setCampaigns(prev => prev.filter(c => c.id !== id))
      toast.success("Campaign deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return
    const updatedFollowUps = [...(selectedLead.follow_ups || []), followUpForm]
    try {
      const updated = await updateMarketingLead(selectedLead.id, { follow_ups: updatedFollowUps })
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l))
      setSelectedLead(updated)
      setFollowUpForm(emptyFollowUp)
      setShowFollowUpModal(false)
      toast.success("Follow-up added")
    } catch (e: any) { toast.error(e.message) }
  }

  const toggleFollowUpDone = async (lead: MarketingLead, idx: number) => {
    const updated = (lead.follow_ups || []).map((f, i) => i === idx ? { ...f, done: !f.done } : f)
    try {
      const result = await updateMarketingLead(lead.id, { follow_ups: updated })
      setLeads(prev => prev.map(l => l.id === lead.id ? result : l))
      if (selectedLead?.id === lead.id) setSelectedLead(result)
    } catch (e: any) { toast.error(e.message) }
  }

  const exportLeads = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map(l => ({
      Name: l.name, Contact: l.contact, Email: l.email,
      Course: l.course_interested, Source: l.source, Status: l.status,
      Notes: l.notes, Date: format(new Date(l.created_at), "yyyy-MM-dd"),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Leads")
    XLSX.writeFile(wb, `leads_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const filteredLeads = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.contact || "").includes(search)
    const matchStatus = filterStatus === "all" || l.status === filterStatus
    const matchSource = filterSource === "all" || l.source === filterSource
    return matchSearch && matchStatus && matchSource
  })

  const stats = STATUSES.map(s => ({ status: s, count: leads.filter(l => l.status === s).length }))
  const conversionRate = leads.length ? Math.round((leads.filter(l => l.status === "Converted").length / leads.length) * 100) : 0

  const upcomingFollowUps = leads.flatMap(l =>
    (l.follow_ups || [])
      .filter(f => !f.done && isAfter(new Date(f.due_date), new Date()))
      .map(f => ({ ...f, leadName: l.name, leadId: l.id }))
  ).slice(0, 5)

  const navSections = [
    {
      label: '🚀 Marketing',
      items: [
        { id: 'leads',      label: 'Lead Pipeline',   icon: Users,        badge: 0 },
        { id: 'campaigns',  label: 'Campaigns',       icon: Megaphone,    badge: 0 },
        { id: 'followup',   label: 'Follow-ups',      icon: Bell,         badge: upcomingFollowUps.length, urgent: upcomingFollowUps.length > 0 },
        { id: 'reports',    label: 'Reports',         icon: TrendingUp,   badge: 0 },
      ]
    },
    {
      label: '📋 My Work',
      items: [
        { id: 'attendance', label: 'My Attendance',   icon: Clock,        badge: 0 },
        { id: 'profile',    label: 'My Profile',      icon: User,         badge: 0 },
      ]
    },
    {
      label: '🗂 Tools',
      items: [
        { id: 'calendar',   label: 'Calendar',        icon: Calendar,     badge: 0 },
      ]
    },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center deep-blue-bg">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen deep-blue-bg">
      <AnimatePresence>
        {showLoadingAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md">
            <motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
              <Megaphone className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">CADD Centre - Marketing</h2>
            <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-orange-500 to-pink-400"
                initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="dark-glass-strong p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-orange-400">Marketing Dashboard</h1>
            <p className="text-white/50 text-sm hidden md:block">CADD Centre - {currentUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/ims')} className="text-white/70 hover:text-white px-3 py-2 border border-white/20 rounded-xl">Back to Admin</button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-xl border border-white/20 hover:bg-red-500/30">
            <LogOut className="w-4 h-4" /> Logout
          </motion.button>
        </div>
      </motion.header>

      <div className="flex">
        <motion.aside initial={{ x: -100 }} animate={{ x: 0 }}
          className={`dark-glass-strong h-screen sticky top-0 z-40 w-60 flex flex-col ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden md:flex'}`}>
          {mobileMenuOpen && <div className="flex justify-end p-3 md:hidden"><button onClick={() => setMobileMenuOpen(false)} className="text-white"><X size={20} /></button></div>}

          <div className="px-4 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-orange-300 text-xs font-semibold">Marketing Dept.</p>
                <p className="text-white/40 text-[10px] mt-0.5">CCL Taskflow</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="font-bold text-sm text-blue-400">{leads.length}</p>
                <p className="text-white/40 text-[10px]">Total Leads</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p className="font-bold text-sm text-green-400">{conversionRate}%</p>
                <p className="text-white/40 text-[10px]">Conversion</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white shadow-lg shadow-orange-500/20'
                          : item.urgent
                            ? 'text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                            : 'text-white/70 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {activeTab === item.id && (
                        <motion.div layoutId="mkt-active-pill" className="absolute left-0 top-0 bottom-0 w-0.5 bg-white rounded-full" />
                      )}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-white' : item.urgent ? 'text-yellow-300' : 'text-white/50'}`} />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white">{item.badge}</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.aside>

        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-auto space-y-5 bg-[#0e1628]">

          {/* ── LEADS PIPELINE ── */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
                    className="w-full pl-9 pr-3 py-2 dark-glass-card text-white placeholder-white/40 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                  <Filter className="w-4 h-4 text-white/40" />
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none w-28">
                    <option value="all" className="text-black">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                  </select>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} onClick={exportLeads}
                  className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded-xl border border-white/20">
                  <Download className="w-4 h-4" /> Export
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }}
                  onClick={() => { setEditingLead(null); setLeadForm(emptyLead); setShowLeadModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> Add Lead
                </motion.button>
              </div>

              {/* Status Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {stats.map(s => (
                  <div key={s.status} onClick={() => setFilterStatus(filterStatus === s.status ? 'all' : s.status)}
                    className={`cursor-pointer dark-glass-card p-3 rounded-xl border transition-all text-center ${filterStatus === s.status ? 'border-orange-500/50 bg-white/10' : 'border-white/10 hover:border-white/30'}`}>
                    <p className="text-2xl font-black text-white mb-1">{s.count}</p>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${STATUS_COLORS[s.status as LeadStatus]}`}>{s.status}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map(lead => (
                  <div key={lead.id} className="dark-glass-card p-5 rounded-2xl border border-white/10 space-y-3 relative group hover:border-orange-500/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{lead.name}</h3>
                        <p className="text-orange-400 text-sm font-semibold">{lead.course_interested}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-white/60">
                      {lead.contact && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {lead.contact}</div>}
                      {lead.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {lead.email}</div>}
                      <div className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5" /> Source: {lead.source}</div>
                    </div>
                    {lead.follow_ups && lead.follow_ups.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                        <p className="text-xs font-bold text-white/40 flex items-center gap-1"><Bell className="w-3 h-3"/> Follow-ups</p>
                        {lead.follow_ups.slice(-2).map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className={f.done ? 'line-through text-white/30' : 'text-orange-300'}>{f.method} on {f.due_date}</span>
                            <button onClick={() => toggleFollowUpDone(lead, lead.follow_ups.length - 2 + i)} className="text-white/40 hover:text-white">
                              {f.done ? <CheckCircle className="w-3 h-3 text-green-400"/> : <CheckCircle className="w-3 h-3"/>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      <button onClick={() => { setSelectedLead(lead); setFollowUpForm(emptyFollowUp); setShowFollowUpModal(true); }}
                        className="flex-1 py-1.5 glass-button text-xs font-bold rounded-lg border border-white/20">Add Follow-up</button>
                      <button onClick={() => {
                        setEditingLead(lead);
                        setLeadForm({
                          name: lead.name, contact: lead.contact || "", email: lead.email || "", occupation: lead.occupation || "", dob: lead.dob || "",
                          nic: lead.nic || "", course_interested: lead.course_interested || "AutoCAD", source: lead.source, status: lead.status,
                          assigned_to: lead.assigned_to, campaign_id: lead.campaign_id, follow_ups: lead.follow_ups || [], notes: lead.notes || "",
                        });
                        setShowLeadModal(true);
                      }} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10"><Edit className="w-3.5 h-3.5"/></button>
                      {isHead && <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20"><Trash2 className="w-3.5 h-3.5"/></button>}
                    </div>
                  </div>
                ))}
                {filteredLeads.length === 0 && <div className="col-span-full text-center py-12 text-white/30">No leads match your search/filter.</div>}
              </div>
            </div>
          )}

          {/* ── CAMPAIGNS ── */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Marketing Campaigns</h2>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowCampaignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4" /> New Campaign
                </motion.button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map(c => {
                  const campLeads = leads.filter(l => l.campaign_id === c.id);
                  const converted = campLeads.filter(l => l.status === 'Converted').length;
                  const cr = campLeads.length ? Math.round((converted / campLeads.length) * 100) : 0;
                  return (
                    <div key={c.id} className="dark-glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-lg">{c.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/10 mt-1 inline-block text-white/70">{c.source}</span>
                        </div>
                        {isHead && <button onClick={() => handleDeleteCampaign(c.id)} className="text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 p-2 rounded-lg text-center">
                          <p className="text-xs text-white/40 mb-1">Leads</p>
                          <p className="font-bold text-blue-400">{campLeads.length}</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg text-center">
                          <p className="text-xs text-white/40 mb-1">Converted</p>
                          <p className="font-bold text-green-400">{converted}</p>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg text-center">
                          <p className="text-xs text-white/40 mb-1">Conv. Rate</p>
                          <p className="font-bold text-orange-400">{cr}%</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                        <span>{c.start_date} to {c.end_date}</span>
                        <span>Budget: LKR {c.budget?.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && <div className="col-span-full text-center py-12 text-white/30">No campaigns yet.</div>}
              </div>
            </div>
          )}

          {/* ── FOLLOW UPS ── */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500"/> Action Required: Follow-ups</h2>
              <div className="dark-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-white/80">
                  <thead className="bg-white/5">
                    <tr>{['Lead','Method','Due Date','Notes','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-white/50 text-xs uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {upcomingFollowUps.map((f: any, i) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold text-white">{f.leadName}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-md bg-white/10 text-xs">{f.method}</span></td>
                        <td className="px-4 py-3 text-yellow-400 font-bold">{f.due_date}</td>
                        <td className="px-4 py-3 text-white/50 italic">"{f.note}"</td>
                        <td className="px-4 py-3">
                          <button onClick={() => {
                            const lead = leads.find(l => l.id === f.leadId);
                            if (lead) {
                              const idx = lead.follow_ups.findIndex(fu => fu.due_date === f.due_date && fu.note === f.note);
                              if (idx !== -1) toggleFollowUpDone(lead, idx);
                            }
                          }} className="px-3 py-1 glass-button text-xs rounded-lg border border-white/20 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 transition-colors">
                            Mark Done
                          </button>
                        </td>
                      </tr>
                    ))}
                    {upcomingFollowUps.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-white/30">No pending follow-ups! Great job.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Marketing Analytics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="dark-glass-card p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Total Leads</p><p className="text-3xl font-bold text-white">{leads.length}</p>
                </div>
                <div className="dark-glass-card p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Converted</p><p className="text-3xl font-bold text-green-400">{leads.filter(l=>l.status==='Converted').length}</p>
                </div>
                <div className="dark-glass-card p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Conversion Rate</p><p className="text-3xl font-bold text-orange-400">{conversionRate}%</p>
                </div>
                <div className="dark-glass-card p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Active Campaigns</p><p className="text-3xl font-bold text-purple-400">{campaigns.length}</p>
                </div>
              </div>
              <div className="dark-glass-card p-5 rounded-2xl border border-white/10">
                <h3 className="text-white font-bold mb-4">Leads by Source</h3>
                <div className="space-y-3">
                  {SOURCES.map(s => {
                    const count = leads.filter(l => l.source === s).length;
                    const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                    return (
                      <div key={s} className="space-y-1">
                        <div className="flex justify-between text-sm text-white/70"><span>{s}</span><span>{count} ({pct}%)</span></div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && <SriLankaCalendar accentColor="orange" />}
          {activeTab === 'attendance' && (
            <div className="dark-glass-card p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">My Attendance</h2>
              <p className="text-white/50 mb-4">Your personal attendance records.</p>
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
        {showLeadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">{editingLead ? 'Edit Lead' : 'New Lead'}</h2>
                <button onClick={() => setShowLeadModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[['Name *', 'name', 'text', true], ['Contact', 'contact', 'text', false], ['Email', 'email', 'email', false], ['Occupation', 'occupation', 'text', false], ['NIC', 'nic', 'text', false], ['Date of Birth', 'dob', 'date', false]].map(([label, key, type, req]) => (
                    <div key={key as string}>
                      <label className="block text-white/70 text-sm mb-1">{label as string}</label>
                      <input type={type as string} required={req as boolean} value={(leadForm as any)[key as string]}
                        onChange={e => setLeadForm(p => ({ ...p, [key as string]: e.target.value }))}
                        className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Course Interested</label>
                    <select value={leadForm.course_interested} onChange={e => setLeadForm(p => ({ ...p, course_interested: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Source</label>
                    <select value={leadForm.source} onChange={e => setLeadForm(p => ({ ...p, source: e.target.value as LeadSource }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Status</label>
                    <select value={leadForm.status} onChange={e => setLeadForm(p => ({ ...p, status: e.target.value as LeadStatus }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Campaign</label>
                    <select value={leadForm.campaign_id || ''} onChange={e => setLeadForm(p => ({ ...p, campaign_id: e.target.value || null }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                      <option value="">None</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white/70 text-sm mb-1">Notes</label>
                    <textarea value={leadForm.notes} onChange={e => setLeadForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400 resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowLeadModal(false)}
                    className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCampaignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">New Campaign</h2>
                <button onClick={() => setShowCampaignModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Campaign Name *</label>
                  <input required value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Source Platform</label>
                  <select value={campaignForm.source} onChange={e => setCampaignForm(p => ({ ...p, source: e.target.value as LeadSource }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Start Date</label>
                    <input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">End Date</label>
                    <input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm(p => ({ ...p, end_date: e.target.value }))}
                      className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Budget (LKR)</label>
                  <input type="number" value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: Number(e.target.value) }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Notes</label>
                  <textarea value={campaignForm.notes} onChange={e => setCampaignForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCampaignModal(false)}
                    className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFollowUpModal && selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="dark-glass-strong rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Add Follow-up</h2>
                  <p className="text-white/50 text-sm">{selectedLead.name}</p>
                </div>
                <button onClick={() => setShowFollowUpModal(false)} className="text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddFollowUp} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Method</label>
                  <select value={followUpForm.method}
                    onChange={e => setFollowUpForm(p => ({ ...p, method: e.target.value as any }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400">
                    {['Call', 'WhatsApp', 'Email'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Due Date *</label>
                  <input required type="date" value={followUpForm.due_date}
                    onChange={e => setFollowUpForm(p => ({ ...p, due_date: e.target.value }))}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Note</label>
                  <textarea value={followUpForm.note}
                    onChange={e => setFollowUpForm(p => ({ ...p, note: e.target.value }))} rows={2}
                    className="w-full dark-glass-card text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-orange-400 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 py-2 glass-button text-white rounded-xl border border-white/20">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold">Add</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
