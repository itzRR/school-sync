"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Phone, GraduationCap, Save, CheckCircle, ChevronLeft, BookOpen, Shield, ArrowRight, Sparkles, Layers } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getFullProfileAction, updateProfileAction } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const ROLE_LABELS: Record<string, string> = {
  admin:            "Administrator",
  academic_manager: "Academic Manager",
  trainer:          "Trainer",
  student:          "Student",
  coordinator:      "Coordinator",
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: "", phone: "", education_background: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const p = await getFullProfileAction()
      if (p) {
        setProfile(p)
        setForm({
          full_name:          p.full_name || "",
          phone:              p.phone || "",
          education_background: p.education_background || "",
        })
      }
      setIsLoading(false)
    }
    load()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error("Full name is required"); return }
    setIsSaving(true)
    const { error } = await updateProfileAction(form)
    setIsSaving(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success("Profile updated successfully!")
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050B14]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full mb-4" />
      <p className="text-white/30 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  )

  const inputCls = "bg-white/5 border-white/10 text-white placeholder-white/20 focus:ring-blue-500/50 focus:border-blue-500/50 rounded-xl h-12 pl-12 transition-all [color-scheme:dark]"

  return (
    <div className="min-h-screen bg-[#050B14] text-white selection:bg-blue-500/30">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Navigation & Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">My Profile</h1>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">Personal Identity Hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Session</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-blue-500/30 transform group-hover:scale-105 transition-transform duration-500">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <h2 className="text-xl font-bold text-white mb-1 truncate">{profile?.full_name || "New Student"}</h2>
                <p className="text-white/40 text-sm mb-6 truncate">{profile?.email}</p>
                
                <div className="flex flex-col gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">
                      {ROLE_LABELS[profile?.role] || profile?.role}
                    </span>
                  </div>
                  {profile?.student_id && (
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[9px] text-white/30 font-black uppercase tracking-tighter">Student ID</span>
                      <span className="text-sm font-mono text-white/70 tracking-widest">{profile.student_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 px-2">Navigation</h3>
              <div className="space-y-1">
                {[
                  { label: "Dashboard", href: "/dashboard", icon: Layers },
                  { label: "My Courses", href: "/my-courses", icon: BookOpen },
                  { label: "Settings", href: "#", icon: User, active: true },
                ].map(item => (
                  <Link key={item.label} href={item.href} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      item.active ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}>
                    <item.icon className={`h-4 w-4 ${item.active ? "text-blue-400" : "text-white/30"}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <User className="w-32 h-32 text-white" />
              </div>
              
              <div className="relative">
                <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                  <div className="w-2 h-6 bg-blue-500 rounded-full" />
                  Profile Details
                </h3>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name *</Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                        <Input id="full_name" className={inputCls} placeholder="Enter your full name"
                          value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Email Address</Label>
                      <div className="relative opacity-60">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input id="email" className={inputCls + " bg-black/40 border-dashed"} value={profile?.email || ""} disabled />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Phone Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                      <Input id="phone" className={inputCls} placeholder="07X XXX XXXX"
                        value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">Education Background</Label>
                    <div className="relative group">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                      <Input id="education" className={inputCls} placeholder="e.g. A/L, Diploma, BSc Engineering"
                        value={form.education_background} onChange={e => setForm(f => ({ ...f, education_background: e.target.value }))} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 gap-3 border-none transition-all active:scale-[0.98]" disabled={isSaving}>
                      {isSaving ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {isSaving ? "SYNCING..." : "COMMIT CHANGES"}
                    </Button>
                    <Button asChild variant="outline" className="flex-1 h-14 bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white rounded-2xl font-bold transition-all">
                      <Link href="/dashboard">RETURN TO DASHBOARD</Link>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
