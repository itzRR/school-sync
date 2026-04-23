"use client"

import { motion } from "framer-motion"
import { GraduationCap, Users, Award, BookOpen, Target, Heart, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

export default function AboutPage() {
  const stats = [
    { value: "500+", label: "Students Trained" },
    { value: "50+",  label: "Courses Offered" },
    { value: "20+",  label: "Expert Instructors" },
    { value: "95%",  label: "Satisfaction Rate" },
  ]

  const team = [
    { name: "Mr. Imamdeen",       role: "Lead Web Development Instructor", bio: "Full-stack developer with 10+ years experience in React, Node.js, and cloud architecture." },
    { name: "Ms. Hiruni Piyumika", role: "Data Science Lead",               bio: "Data scientist and ML engineer with expertise in Python, TensorFlow, and enterprise analytics." },
    { name: "Ms. Amaya Silva",     role: "UI/UX Design Instructor",         bio: "Product designer who has worked with leading tech companies across South Asia." },
  ]

  const values = [
    { icon: Target,   title: "Excellence",        desc: "We set the highest standards in curriculum design and teaching quality." },
    { icon: Heart,    title: "Student-First",      desc: "Every decision we make puts our students' growth and success at the center." },
    { icon: Users,    title: "Community",          desc: "Learning is better together — we foster a collaborative, inclusive environment." },
    { icon: Award,    title: "Industry-Relevant",  desc: "Our curriculum evolves with the industry to ensure you learn what employers need." },
  ]

  const milestones = [
    { year: "2015", text: "Founded with a vision to democratise tech education in Sri Lanka." },
    { year: "2018", text: "Launched BIM & CAD programmes, partnering with industry leaders." },
    { year: "2021", text: "Reached 500+ alumni milestone across 10+ corporate batch programmes." },
    { year: "2024", text: "Launched digital student portal — Scholar Sync — for seamless learning." },
  ]

  return (
    <div className="min-h-screen bg-white selection:bg-blue-500/20">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 blur-[120px] rounded-full pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100 blur-[100px] rounded-full pointer-events-none opacity-40" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 border border-blue-200 rounded-3xl mb-8 shadow-sm">
              <GraduationCap className="h-10 w-10 text-blue-600" />
            </motion.div>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-sm px-5 py-2 rounded-full mb-6 font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Sri Lanka&apos;s Premier Tech Education Platform
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Scholar Sync</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium">
              We are dedicated to transforming careers through world-class training, mentorship, and a thriving community of learners.
            </motion.p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-auto text-white fill-current" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-3xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-4xl md:text-5xl font-black text-blue-600 mb-2">{value}</p>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xs">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ─────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-sm font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Empowering the Next Generation of Tech Leaders
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-5">
                Founded with the vision of democratising quality technology education in Sri Lanka, Scholar Sync bridges the gap between academic learning and real industry demands.
              </p>
              <p className="text-lg text-gray-500 leading-relaxed">
                Our programmes are designed alongside industry partners to ensure every graduate is job-ready from day one.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="bg-white border border-blue-100 rounded-[2.5rem] p-10 shadow-xl shadow-blue-900/5 hover:shadow-2xl transition-shadow duration-500">
                <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mb-8">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-xl text-gray-500 leading-relaxed">
                  To become South Asia&apos;s most trusted technology education platform, producing graduates who lead innovation in global companies and local startups alike.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MILESTONES ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">Our Journey</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Key Milestones</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-blue-100 hidden md:block" />
            <div className="space-y-10">
              {milestones.map(({ year, text }, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow inline-block text-left">
                      <p className="text-gray-600 leading-relaxed">{text}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm z-10 shadow-lg shadow-blue-600/30">
                    {year}
                  </div>
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">What Drives Us</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                  <Icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4 block">The People Behind It</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Meet Our Instructors</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Industry professionals committed to your growth</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map(({ name, role, bio }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-sky-400 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 rotate-3 group-hover:rotate-0">
                  {name.split(" ").pop()?.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-1">{name}</h3>
                <p className="text-blue-600 font-semibold text-sm mb-4">{role}</p>
                <p className="text-gray-500 leading-relaxed text-sm">{bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-sky-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Ready to Start Your Journey?</h2>
              <p className="text-xl text-blue-100 mb-10 font-medium">Join hundreds of students transforming their careers with Scholar Sync</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/courses" className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-gray-50 rounded-full px-10 h-14 text-base font-bold transition-transform hover:scale-105 shadow-xl">
                  Browse Courses <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center border-2 border-white/40 text-white hover:bg-white/10 rounded-full px-10 h-14 text-base font-bold transition-transform hover:scale-105">
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
