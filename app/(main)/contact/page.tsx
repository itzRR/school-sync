"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from "lucide-react"
import { submitContactMessage } from "@/lib/data"

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await submitContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject,
        message: form.message,
      })
      setSuccess(true)
      setForm({ name: "", email: "", phone: "", subject: "", message: "" })
    } catch {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
  const labelClass = "text-sm font-bold text-gray-600 block mb-1.5"

  return (
    <div className="min-h-screen bg-white selection:bg-blue-500/20">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 blur-[120px] rounded-full pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-100 blur-[100px] rounded-full pointer-events-none opacity-40" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 border border-blue-200 rounded-3xl shadow-sm">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
            <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-sm px-5 py-2 rounded-full font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              We respond within 24 hours
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
              Have a question or want to enroll? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-auto text-white fill-current" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ── LEFT: Info Cards ─────────────────────────────── */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6">

              {/* Contact Info */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 mb-7">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail,   title: "Email",   value: "info@scholarsync.lk",            color: "text-blue-600",   bg: "bg-blue-50 border-blue-100" },
                    { icon: Phone,  title: "Phone",   value: "+94 11 234 5678",                 color: "text-green-600",  bg: "bg-green-50 border-green-100" },
                    { icon: MapPin, title: "Address", value: "123 Education Lane, Colombo 03, Sri Lanka", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                  ].map(({ icon: Icon, title, value, color, bg }) => (
                    <div key={title} className="flex items-start gap-4 group">
                      <div className={`p-3.5 rounded-2xl border flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{title}</p>
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-[2rem] p-8 text-white shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="h-5 w-5 text-blue-200" />
                  <h3 className="text-lg font-black">Office Hours</h3>
                </div>
                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between border-b border-white/20 pb-3">
                    <span className="text-blue-100">Monday – Friday</span>
                    <span className="font-bold">8:00 AM – 6:00 PM</span>
                  </div>
                  <div className="flex justify-between border-b border-white/20 pb-3">
                    <span className="text-blue-100">Saturday</span>
                    <span className="font-bold">9:00 AM – 2:00 PM</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-blue-100">Sunday</span>
                    <span className="text-red-300 font-bold">Closed</span>
                  </div>
                </div>
              </div>

              {/* Quick badges */}
              <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 space-y-3">
                {[
                  { label: "⚡ Fast Reply",   sub: "We reply within 24 hours" },
                  { label: "🎓 Free Counseling", sub: "Talk to our advisors" },
                  { label: "📍 Walk-in Welcome", sub: "During office hours" },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── RIGHT: Contact Form ───────────────────────────── */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="bg-white border border-gray-100 rounded-[2rem] p-8 md:p-12 shadow-sm">
                {success ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4">Message Sent!</h3>
                    <p className="text-gray-500 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                      Thank you for reaching out. We&apos;ve received your message and will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="px-8 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all border border-blue-200"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-gray-900 mb-8">Send a Message</h2>

                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Full Name <span className="text-blue-600">*</span></label>
                          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                            placeholder="John Doe" required className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Email Address <span className="text-blue-600">*</span></label>
                          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                            placeholder="john@example.com" required className={inputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Phone Number</label>
                          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                            placeholder="+94 71 234 5678" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Subject <span className="text-blue-600">*</span></label>
                          <input type="text" value={form.subject} onChange={(e) => set("subject", e.target.value)}
                            placeholder="How can we help?" required className={inputClass} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Message <span className="text-blue-600">*</span></label>
                        <textarea value={form.message} onChange={(e) => set("message", e.target.value)}
                          placeholder="Tell us more about your inquiry..." rows={6} required className={`${inputClass} resize-none`} />
                      </div>

                      <button type="submit" disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                      >
                        <Send className="h-5 w-5" />
                        {isLoading ? "Sending Message..." : "Send Message"}
                      </button>

                      <p className="text-center text-xs text-gray-400">
                        By submitting, you agree to our privacy policy. We&apos;ll never share your information.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MAP PLACEHOLDER ──────────────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-[2rem] h-64 flex items-center justify-center shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/grid.png')" }} />
            <div className="relative text-center">
              <MapPin className="h-10 w-10 text-blue-400 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">123 Education Lane, Colombo 03, Sri Lanka</p>
              <p className="text-blue-600 font-bold text-sm mt-1">Open in Google Maps →</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
