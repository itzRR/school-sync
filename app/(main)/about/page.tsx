"use client"

import { motion } from "framer-motion"
import { GraduationCap, Users, Award, BookOpen, Target, Heart, ArrowRight } from "lucide-react"
import Link from "next/link"

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

export default function AboutPage() {
  const stats = [
    { value: "500+", label: "Students Trained" },
    { value: "50+", label: "Courses Offered" },
    { value: "20+", label: "Expert Instructors" },
    { value: "95%", label: "Satisfaction Rate" },
  ]

  const team = [
    { name: "Mr. Imamdeen", role: "Lead Web Development Instructor", bio: "Full-stack developer with 10+ years experience in React, Node.js, and cloud architecture." },
    { name: "Ms. Hiruni Piyumika", role: "Data Science Lead", bio: "Data scientist and ML engineer with expertise in Python, TensorFlow, and enterprise analytics." },
    { name: "Ms. Amaya Silva", role: "UI/UX Design Instructor", bio: "Product designer who has worked with leading tech companies across South Asia." },
  ]

  const values = [
    { icon: Target, title: "Excellence", desc: "We set the highest standards in curriculum design and teaching quality." },
    { icon: Heart, title: "Student-First", desc: "Every decision we make puts our students' growth and success at the center." },
    { icon: Users, title: "Community", desc: "Learning is better together — we foster a collaborative, inclusive environment." },
    { icon: Award, title: "Industry-Relevant", desc: "Our curriculum evolves with the industry to ensure you learn what employers need." },
  ]

  return (
    <div className="min-h-screen bg-[#050B14] text-white selection:bg-blue-500/30">
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/80 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl mb-8 backdrop-blur-sm shadow-2xl">
              <GraduationCap className="h-10 w-10 text-blue-400" />
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Scholar Sync</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-blue-100/70 max-w-3xl mx-auto leading-relaxed font-medium">
              We are Sri Lanka{"'"}s premier technology education platform, dedicated to transforming careers through world-class training, mentorship, and community.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS SECTION ───────────────────────────────────────────── */}
      <section className="relative py-12 px-4 z-20 -mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
              {stats.map(({ value, label }, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={label} className="text-center px-4">
                  <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">{value}</p>
                  <p className="text-white/60 font-medium uppercase tracking-wider text-sm">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION & VISION ─────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
                Our Mission
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Empowering the Next Generation of Tech Leaders</h2>
              <p className="text-lg text-white/60 leading-relaxed mb-6">
                Founded with the vision of democratising quality technology education in Sri Lanka, Scholar Sync bridges the gap between academic learning and industry demands.
              </p>
              <p className="text-lg text-white/60 leading-relaxed">
                Our programmes are designed alongside industry partners to ensure every graduate is job-ready from day one. We believe education should be transformative, practical, and accessible.
              </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 h-full">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30">
                  <BookOpen className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Our Vision</h3>
                <p className="text-xl text-blue-100/70 leading-relaxed">
                  To become South Asia{"'"}s most trusted technology education platform, producing graduates who lead innovation in global companies and local startups alike.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/5 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={title} className="bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 hover:bg-white/5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300 border border-white/5 group-hover:border-blue-500/30">
                  <Icon className="h-7 w-7 text-white/70 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Meet Our Instructors</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">Industry professionals committed to your growth</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map(({ name, role, bio }, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={name} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 text-center hover:-translate-y-2 transition-transform duration-300 group">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-[2rem] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 rotate-3 group-hover:rotate-0">
                  {name.split(" ").pop()?.charAt(0)}
                </div>
                <h3 className="font-bold text-white text-2xl mb-1">{name}</h3>
                <p className="text-blue-400 font-medium mb-4">{role}</p>
                <p className="text-white/60 leading-relaxed">{bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-[#1A5276] to-cyan-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Start Your Journey?</h2>
              <p className="text-xl text-blue-100 mb-10 font-medium">Join hundreds of students transforming their careers with Scholar Sync</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/courses" className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-gray-50 rounded-full px-10 h-16 text-lg font-bold transition-transform hover:scale-105 shadow-xl">
                  Browse Courses <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-16 text-lg font-bold backdrop-blur-md transition-transform hover:scale-105">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
