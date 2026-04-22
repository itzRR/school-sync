"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BookOpen, Award, ArrowRight, CheckCircle,
  GraduationCap, ClipboardList, CalendarDays,
  BarChart3, FolderOpen, Layers, Search, Plus, User
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getUserEnrollmentsAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { AuthUser } from "@/lib/auth"

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const u = await getCurrentUser()
      if (!u) { router.push("/auth/login?redirect=/dashboard"); return }
      if (["admin", "academic_manager", "coordinator"].includes(u.role)) {
        router.push("/admin"); return
      }
      setUser(u)
      try {
        const e = await getUserEnrollmentsAction()
        setEnrollments(e || [])
      } catch (err) {
        console.error("Failed to load enrollments", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050B14]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full mb-4" />
        <p className="text-white/30 text-sm font-bold uppercase tracking-widest animate-pulse">Syncing Portal...</p>
      </div>
    )
  }

  const completed = enrollments.filter(e => e.status === "completed").length
  const active = enrollments.filter(e => e.status === "confirmed").length

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{user?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p className="text-white/40 text-sm mt-1 font-medium">Your CADD Centre Lanka student portal is active.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 h-12">
              <Link href="/profile">My Profile</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl px-6 h-12 shadow-lg shadow-blue-500/20 border-none font-bold">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show" 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Enrolled",   value: enrollments.length, icon: BookOpen,      color: "text-blue-400",   bg: "bg-blue-500/10" },
            { label: "Active",     value: active,             icon: ClipboardList, color: "text-cyan-400",   bg: "bg-cyan-500/10" },
            { label: "Completed",  value: completed,          icon: CheckCircle,   color: "text-emerald-400",bg: "bg-emerald-500/10" },
            { label: "Certificates",value: completed,          icon: Award,         color: "text-amber-400",  bg: "bg-amber-500/10" },
          ].map(s => (
            <motion.div key={s.label} variants={item} 
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 hover:border-white/20 transition-all group shadow-xl shadow-black/20">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {enrollments.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-600/20 to-cyan-700/20 backdrop-blur-md border border-blue-500/30 rounded-[2.5rem] p-12 text-center mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Start Your Professional Journey</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto leading-relaxed">Enroll in our industry-leading BIM & CAD programmes to unlock your career potential.</p>
            <Button asChild className="bg-white text-blue-900 hover:bg-blue-50 rounded-2xl px-10 h-14 font-black shadow-2xl transition-all hover:scale-105">
              <Link href="/courses">Browse All Courses</Link>
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* Enrolled Courses */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                My Enrolled Courses
              </h2>
              <Link href="/my-courses" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 uppercase tracking-widest transition-all">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-16 bg-black/20 rounded-[2rem] border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-white/10" />
                </div>
                <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No active enrollments</p>
                <Link href="/courses" className="text-blue-400 text-xs font-bold mt-4 inline-block hover:underline">Browse catalogue →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 4).map(enrollment => {
                  const isCompleted = enrollment.status === "completed"
                  return (
                    <Link key={enrollment.id} href={`/courses/${enrollment.courses?.slug}`} 
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group">
                      <div className="w-14 h-14 rounded-xl bg-black/40 overflow-hidden relative flex-shrink-0">
                        {isCompleted ? (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-10">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center z-10">
                            <BookOpen className="w-6 h-6 text-blue-400/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                          {enrollment.courses?.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
                            isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {enrollment.status}
                          </span>
                          {enrollment.batch && (
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {enrollment.batch.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Student Portal Tiles */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-400" />
              </div>
              Student Portal
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Courses",    href: "/my-courses",     icon: BookOpen,     color: "from-blue-500 to-blue-600" },
                { label: "Attendance", href: "/my-attendance",  icon: CalendarDays, color: "from-cyan-500 to-cyan-600" },
                { label: "Results",    href: "/my-results",     icon: BarChart3,    color: "from-purple-500 to-purple-600" },
                { label: "Certificates",href: "/my-certificates",icon: Award,        color: "from-amber-500 to-amber-600" },
                { label: "E-books",    href: "/resources",      icon: FolderOpen,   color: "from-emerald-500 to-emerald-600" },
                { label: "Progress",   href: "/my-progress",    icon: Layers,       color: "from-pink-500 to-pink-600" },
              ].map(item => (
                <Link key={item.label} href={item.href} className="group">
                  <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-center hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-3 shadow-lg shadow-black/10">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-tighter group-hover:text-white">{item.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Module Progress Section */}
        {enrollments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-cyan-400" />
              </div>
              Academic Progress Overview
            </h2>
            <div className="space-y-8">
              {enrollments.map(enrollment => (
                <div key={enrollment.id} className="relative group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-8 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <p className="text-lg font-bold text-white tracking-tight">{enrollment.courses?.title}</p>
                    </div>
                    <Badge className={`rounded-xl px-4 py-1 font-black uppercase text-[10px] ${
                      enrollment.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                    }`}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  {enrollment.courses?.modules && enrollment.courses.modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {enrollment.courses.modules.map((mod: any, i: number) => (
                        <div key={mod.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center gap-3 group/mod hover:border-white/10 transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-black shadow-inner">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate leading-tight">{mod.title}</p>
                            <p className="text-[10px] text-white/30 font-medium">{mod.duration_hours} Credit Hours</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 bg-black/10 rounded-2xl border border-dashed border-white/5 text-center">
                      <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">Curriculum details pending</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      <style jsx global>{`
        .shadow-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  )
}
