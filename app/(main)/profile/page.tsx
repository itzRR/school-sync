"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Mail, Phone, BookOpen, Save, ChevronLeft, Shield, Layers, Sparkles } from "lucide-react"
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
  const [form, setForm]       = useState({ full_name: "", phone: "", education_background: "" })
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
        setForm({ full_name: p.full_name || "", phone: p.phone || "", education_background: p.education_background || "" })
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
    if (error) toast.error(error)
    else toast.success("Profile updated successfully!")
  }

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full mb-4" />
      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  )

  const inputCls = "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30 focus:border-blue-500 rounded-xl h-12 pl-12 transition-all"

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-500/20">
      {/* Subtle blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 blur-[100px] rounded-full opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Nav bar */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Personal Identity Hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Session</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left - Avatar & Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6">

            {/* Avatar card */}
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 text-center shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-sky-400 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-lg shadow-blue-500/20">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">{profile?.full_name || "New Student"}</h2>
              <p className="text-gray-400 text-sm mb-6 truncate">{profile?.email}</p>

              <div className="flex flex-col gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">
                    {ROLE_LABELS[profile?.role] || profile?.role}
                  </span>
                </div>
                {profile?.student_id && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Student ID</span>
                    <span className="text-sm font-mono text-gray-700 tracking-widest">{profile.student_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <div className="bg-white border border-gray-200 rounded-[2rem] p-4 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">Navigation</h3>
              <div className="space-y-1">
                {[
                  { label: "Dashboard",  href: "/dashboard",  icon: Layers },
                  { label: "My Courses", href: "/my-courses", icon: BookOpen },
                  { label: "Settings",   href: "#",           icon: User, active: true },
                ].map(navItem => (
                  <Link key={navItem.label} href={navItem.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      navItem.active
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}>
                    <navItem.icon className={`h-4 w-4 ${navItem.active ? "text-blue-600" : "text-gray-400"}`} />
                    <span className="text-sm">{navItem.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                Profile Details
              </h3>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Full Name *</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input id="full_name" className={inputCls} placeholder="Enter your full name"
                        value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</Label>
                    <div className="relative opacity-60">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="email" className={inputCls + " bg-gray-100 border-dashed"} value={profile?.email || ""} disabled />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input id="phone" className={inputCls} placeholder="07X XXX XXXX"
                      value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="education" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Education Background</Label>
                  <div className="relative group">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input id="education" className={inputCls} placeholder="e.g. A/L, Diploma, BSc Engineering"
                      value={form.education_background} onChange={e => setForm(f => ({ ...f, education_background: e.target.value }))} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                  <Button type="submit"
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 gap-3 border-none transition-all active:scale-[0.98]"
                    disabled={isSaving}>
                    {isSaving
                      ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Save className="h-5 w-5" />
                    }
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button asChild variant="outline"
                    className="flex-1 h-14 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-2xl font-bold transition-all">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
