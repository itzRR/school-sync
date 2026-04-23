"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight, BookOpen, Users, Award, CheckCircle,
  GraduationCap, Layers, Clock, ChevronRight, Play, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getFeaturedCourses } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import type { Course } from "@/types"

const PROGRAMS = [
  { category: "BIM", title: "Building Information Modelling", desc: "Industry-standard BIM training using Revit Architecture, Revit MEP, Navisworks and Project Management.", modules: ["Revit Architecture", "Revit MEP", "Navisworks", "Project Management"], hours: 148, color: "from-blue-600 to-cyan-600" },
  { category: "CAD", title: "Computer-Aided Design", desc: "Foundation and advanced CAD skills for engineering, architecture and manufacturing applications.", modules: ["2D Drafting", "3D Modelling", "Technical Documentation", "Industry Applications"], hours: 80, color: "from-purple-600 to-blue-600" },
  { category: "Project Management", title: "Project Management", desc: "Expert-level project planning and control using MS Project and Primavera for construction projects.", modules: ["Scheduling", "Resource Planning", "WBS & Reporting", "Primavera P6"], hours: 240, color: "from-cyan-600 to-teal-600" },
]

const LIFECYCLE = [
  { step: "1", label: "Registration", icon: Users },
  { step: "2", label: "Enrollment", icon: BookOpen },
  { step: "3", label: "Batch Allocation", icon: Layers },
  { step: "4", label: "Module Learning", icon: GraduationCap },
  { step: "5", label: "Assessment", icon: CheckCircle },
  { step: "6", label: "Certification", icon: Award },
]

const levelColor = (l: string) => l === "Expert Certificate" ? "bg-purple-100 text-purple-800" : l === "Master Certificate" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFeaturedCourses().then(setCourses).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white selection:bg-blue-500/30">
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-sky-50 overflow-hidden pt-20">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-100 blur-[120px] rounded-full pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-sky-100 blur-[150px] rounded-full pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-sm px-5 py-2 rounded-full mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Leading Technology Education in Sri Lanka
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500">Your Future</span><br />
              In Design & Tech
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              Award-winning training in BIM, CAD, and Project Management. Turn your architectural and engineering ambitions into certified reality.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 h-14 text-base font-bold transition-all hover:scale-105 border-0">
                <Link href="/courses">Explore Programmes <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full px-8 h-14 text-base font-bold transition-all hover:scale-105">
                <Link href="/auth/register"><Play className="mr-2 h-4 w-4 fill-current" /> Student Portal</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto text-white fill-current" preserveAspectRatio="none">
            <path d="M0,60 C320,120 420,-20 720,60 C1020,140 1120,20 1440,80 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "10k+", label: "Successful Alumni",  icon: Users,       bg: "from-blue-50 to-sky-50",   text: "text-blue-600",   border: "border-blue-100" },
              { value: "50+",  label: "Expert Instructors", icon: Star,         bg: "from-purple-50 to-pink-50",text: "text-purple-600", border: "border-purple-100" },
              { value: "100%", label: "Job Assistance",     icon: CheckCircle,  bg: "from-green-50 to-emerald-50",text: "text-green-600", border: "border-green-100" },
              { value: "ISO",  label: "Certified Quality",  icon: Award,        bg: "from-orange-50 to-yellow-50",text: "text-orange-500", border: "border-orange-100" },
            ].map((stat, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={stat.label}
                className={`bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-3xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                <stat.icon className={`w-7 h-7 mx-auto mb-3 ${stat.text}`} />
                <p className={`text-4xl font-black tracking-tight ${stat.text}`}>{stat.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES (Premium Cards) ───────────────────────── */}
      <section className="py-32 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Elite Training</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Ignite Your Career With<br/>Our Top Courses</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full px-6 h-12 border-gray-200 hover:border-blue-600 hover:text-blue-600 hover:bg-transparent transition-all">
              <Link href="/courses">View All Catalog <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-[400px] bg-gray-200 rounded-3xl animate-pulse" />)
            ) : (
              courses.map((course, i) => (
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={course.id}>
                  <Link href={`/courses/${course.slug}`} className="group block bg-white rounded-[2rem] border border-gray-100 p-3 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                    <div className="h-56 rounded-3xl overflow-hidden relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-700"><BookOpen className="h-16 w-16 text-white/30" /></div>
                      )}
                      <div className="absolute top-4 left-4 z-20"><Badge className={`${levelColor(course.level)} border-none shadow-sm backdrop-blur-md`}>{course.level}</Badge></div>
                      {course.is_featured && <div className="absolute top-4 right-4 z-20 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">⭐ Hot</div>}
                    </div>
                    <div className="px-5 pb-5">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">{course.category}</p>
                      <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{course.short_description || course.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {course.total_hours} Hours</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-gray-900">{formatCurrency(course.price)}</span>
                            {course.original_price && <span className="text-xs text-gray-400 line-through">{formatCurrency(course.original_price)}</span>}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── PROGRAMMES ──────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] pointer-events-none opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Curriculum</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Industry-Aligned Programmes</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Master the tools that build the modern world. Our curriculum is constantly updated to match global industry standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROGRAMS.map((prog, i) => (
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={prog.category} className="group relative rounded-[2.5rem] bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-500">
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${prog.color} opacity-10 blur-[40px] group-hover:opacity-20 transition-opacity duration-500`} />
                <div className="p-10 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-center mb-8">
                    <Layers className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{prog.title}</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">{prog.desc}</p>
                  
                  <div className="space-y-4 mb-10">
                    {prog.modules.map((m) => (
                      <div key={m} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">{m}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                      <Clock className="w-5 h-5" /> {prog.hours}h Duration
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENT LIFECYCLE ───────────────────────────────── */}
      <section className="py-32 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Your Path to Success</h2>
            <p className="text-xl text-gray-500">A structured, proven journey from enrollment to certification.</p>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-100 via-cyan-200 to-blue-100 -translate-y-1/2 hidden md:block" />
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 relative z-10">
              {LIFECYCLE.map((item, i) => (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={item.step} className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-50 flex items-center justify-center mb-6 relative group-hover:-translate-y-2 transition-transform duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    <item.icon className="h-8 w-8 text-blue-600 relative z-10" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 mb-1">Step {item.step}</span>
                  <span className="text-xs font-medium text-gray-500 text-center uppercase tracking-wider">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PREMIUM CTA ─────────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-[#1A5276] to-indigo-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">Ready to Transform Your Career?</h2>
              <p className="text-xl text-blue-200 mb-12 font-medium">Join thousands of successful alumni who started their journey here. Enroll today and take the first step towards mastery.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth/register" className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-gray-50 rounded-full px-10 h-16 text-lg font-bold transition-transform hover:scale-105 shadow-xl">
                  Enroll Now
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-16 text-lg font-bold backdrop-blur-md transition-transform hover:scale-105">
                  Talk to an Advisor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
