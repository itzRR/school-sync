"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BookOpen, Clock, ArrowRight, Filter, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCourses } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import type { Course } from "@/types"

const LEVELS = ["All", "Proficient Certificate", "Master Certificate", "Expert Certificate"]
const CATEGORIES = ["All", "BIM", "CAD", "Project Management"]

const levelColor = (l: string) => l === "Expert Certificate" ? "bg-purple-100 text-purple-800" : l === "Master Certificate" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filtered, setFiltered] = useState<Course[]>([])
  const [search, setSearch] = useState("")
  const [level, setLevel] = useState("All")
  const [category, setCategory] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getCourses(true).then(data => {
      setCourses(data)
      setFiltered(data)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    let res = courses
    if (search) res = res.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.short_description || "").toLowerCase().includes(search.toLowerCase()))
    if (level !== "All") res = res.filter(c => c.level === level)
    if (category !== "All") res = res.filter(c => c.category === category)
    setFiltered(res)
  }, [search, level, category, courses])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 bg-[#050B14] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
              <BookOpen className="w-4 h-4" /> Academic Catalog
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">CADD <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Programmes</span></h1>
            <p className="text-lg md:text-xl text-blue-100/70 mb-10 leading-relaxed">
              Industry-oriented BIM, CAD and Project Management training with practical software-based learning and international certification.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl">
                <Search className="w-6 h-6 text-white/50 ml-3 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="What do you want to learn?"
                  className="w-full bg-transparent text-white placeholder-white/50 text-lg focus:outline-none px-2 py-3"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="p-2 text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── FILTERS SIDEBAR ──────────────────────────────────────── */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /> Filters</h3>
                {(level !== "All" || category !== "All") && (
                  <button onClick={() => { setLevel("All"); setCategory("All") }} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Clear All</button>
                )}
              </div>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Category</h4>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(c)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${category === c ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Certification Level</h4>
                  <div className="flex flex-col gap-2">
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => setLevel(l)} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${level === l ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}>
                        {l}
                        {level === l && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── COURSE LISTINGS ──────────────────────────────────────── */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-500 font-medium">Showing <span className="font-bold text-gray-900">{filtered.length}</span> results</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-96 border border-gray-100 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500 max-w-md mx-auto">We couldn't find any courses matching your current search and filter criteria. Try adjusting them.</p>
                <Button onClick={() => { setSearch(""); setLevel("All"); setCategory("All") }} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {filtered.map((course, i) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} key={course.id}>
                      <Link href={`/courses/${course.slug}`} className="group block bg-white rounded-[2rem] border border-gray-100 p-3 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
                        <div className="h-56 rounded-3xl overflow-hidden relative mb-5 flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
                          {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                              <BookOpen className="h-16 w-16 text-white/30" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 z-20">
                            <Badge className={`${levelColor(course.level)} border-none shadow-sm backdrop-blur-md px-3 py-1 font-bold`}>{course.level}</Badge>
                          </div>
                          {course.is_featured && (
                            <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-yellow-300 flex items-center gap-1">
                              <span>⭐</span> Hot
                            </div>
                          )}
                        </div>
                        <div className="px-5 pb-5 flex flex-col flex-1">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {course.category}
                          </p>
                          <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                          <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">{course.short_description || course.description}</p>
                          <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.total_hours} Hours</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(course.price)}</span>
                                {course.original_price && <span className="text-sm font-medium text-gray-400 line-through">{formatCurrency(course.original_price)}</span>}
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-600/30">
                              <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
