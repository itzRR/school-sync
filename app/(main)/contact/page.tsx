"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-[#050B14] text-white selection:bg-blue-500/30">
      {/* ── PREMIUM HERO ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/80 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl mb-8 backdrop-blur-sm shadow-2xl">
              <Mail className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100/70 max-w-3xl mx-auto leading-relaxed font-medium">
              We'd love to hear from you. Send us a message and we'll respond within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT SECTION ─────────────────────────────────────────── */}
      <section className="pb-32 px-4 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail, title: "Email", value: "info@scholarsync.lk", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { icon: Phone, title: "Phone", value: "+94 11 234 5678", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                    { icon: MapPin, title: "Address", value: "123 Education Lane, Colombo 03, Sri Lanka", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                  ].map(({ icon: Icon, title, value, color, bg }) => (
                    <div key={title} className="flex items-start gap-5 group">
                      <div className={`p-4 rounded-2xl border flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${bg}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-white/90 text-lg">{title}</p>
                        <p className="text-white/50 mt-1 leading-relaxed">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 backdrop-blur-xl rounded-[2rem] p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-20 blur transition duration-1000" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-4">Office Hours</h3>
                  <div className="space-y-3 text-blue-100/70 font-medium">
                    <p className="flex justify-between border-b border-white/5 pb-2"><span>Monday – Friday</span> <span className="text-white">8:00 AM – 6:00 PM</span></p>
                    <p className="flex justify-between border-b border-white/5 pb-2"><span>Saturday</span> <span className="text-white">9:00 AM – 2:00 PM</span></p>
                    <p className="flex justify-between pt-1"><span>Sunday</span> <span className="text-red-400">Closed</span></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative">
                {success ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-16">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Message Sent!</h3>
                    <p className="text-white/60 mb-10 text-lg max-w-md mx-auto">Thank you for reaching out. We've received your message and will get back to you within 24 hours.</p>
                    <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10">
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-white mb-8">Send a Message</h2>
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-medium">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-white/70">Full Name <span className="text-blue-400">*</span></label>
                          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-white/70">Email Address <span className="text-blue-400">*</span></label>
                          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-white/70">Phone Number</label>
                          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+94 71 234 5678"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-white/70">Subject <span className="text-blue-400">*</span></label>
                          <input type="text" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-white/70">Message <span className="text-blue-400">*</span></label>
                        <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us more about your inquiry..." rows={6} required
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" />
                      </div>
                      <button type="submit" disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
                        <Send className="h-5 w-5" />
                        {isLoading ? "Sending Message..." : "Send Message"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
