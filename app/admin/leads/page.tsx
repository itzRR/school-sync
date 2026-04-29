"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldError } from "@/components/ui/field-error"
import { createStudentLead, getStudentLeads, updateStudentLead } from "@/lib/data"
import { createMarketingLead } from "@/lib/ims-data"
import { PhoneCall, Plus, Search } from "lucide-react"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone } from "@/lib/validation"

const STATUSES = ['new','contacted','qualified','enrolled','lost']

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', interested_course: '', preferred_level: 'Proficient Certificate', notes: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => { getStudentLeads().then(setLeads).catch((e: any) => setError(e.message)) }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter((lead: any) => [lead.full_name, lead.email, lead.interested_course, lead.phone, lead.status].join(' ').toLowerCase().includes(q))
  }, [leads, search])

  // Real-time validation errors
  const fieldErrors: Record<string, string> = {}
  if (touched.full_name && !form.full_name.trim()) {
    fieldErrors.full_name = "Name is required"
  } else if (touched.full_name && form.full_name.trim() && !isValidName(form.full_name)) {
    fieldErrors.full_name = "Name can only contain letters, spaces, and hyphens"
  }
  if (touched.email && !form.email.trim()) {
    fieldErrors.email = "Email is required"
  } else if (touched.email && form.email.trim() && !isValidEmail(form.email)) {
    fieldErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (touched.phone && form.phone.trim() && !isValidSriLankanPhone(form.phone)) {
    fieldErrors.phone = "Enter a valid Sri Lankan number (e.g. 077 123 4567)"
  }

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ full_name: true, email: true, phone: true })

    // Validate before submit
    if (!form.full_name.trim() || !isValidName(form.full_name)) {
      setError("Please enter a valid name (letters only)")
      return
    }
    if (!form.email.trim() || !isValidEmail(form.email)) {
      setError("Please enter a valid email address")
      return
    }
    if (form.phone.trim() && !isValidSriLankanPhone(form.phone)) {
      setError("Please enter a valid Sri Lankan phone number")
      return
    }

    try {
      const created = await createStudentLead(form as any)
      setLeads(prev => [created, ...prev])
      // Also sync to IMS Marketing Leads so it shows in the marketing section
      try {
        await createMarketingLead({
          name: form.full_name,
          contact: form.phone || null,
          email: form.email || null,
          dob: null, nic: null, occupation: null,
          course_interested: form.interested_course || null,
          source: 'Website' as const,
          status: 'New' as const,
          assigned_to: null,
          campaign_id: null,
          follow_ups: [],
          notes: form.notes || null,
        })
      } catch { /* marketing sync is best-effort */ }
      setForm({ full_name: '', email: '', phone: '', interested_course: '', preferred_level: 'Proficient Certificate', notes: '' })
      setTouched({})
      setShowForm(false)
    } catch (err: any) { setError(err.message || 'Failed to create lead') }
  }

  const updateStatus = async (id: string, status: string) => {
    const updated = await updateStudentLead(id, { status })
    setLeads(prev => prev.map((lead: any) => lead.id === id ? updated : lead))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Student Leads</h1><p className="text-gray-600 mt-1">Manage the lead to enrollment stage of the student lifecycle</p></div><Button onClick={() => setShowForm(v => !v)}><Plus className="h-4 w-4 mr-2" /> New Lead</Button></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Lead</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: sanitizeName(e.target.value) })}
                  onBlur={() => handleBlur("full_name")}
                  placeholder="Letters only"
                  className={fieldErrors.full_name ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                <FieldError message={fieldErrors.full_name} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onBlur={() => handleBlur("email")}
                  placeholder="name@example.com"
                  className={fieldErrors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: formatSriLankanPhone(e.target.value) })}
                  onBlur={() => handleBlur("phone")}
                  placeholder="077 123 4567"
                  className={fieldErrors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                <FieldError message={fieldErrors.phone} />
              </div>
              <div className="space-y-2"><Label>Interested Course</Label><Input value={form.interested_course} onChange={e => setForm({ ...form, interested_course: e.target.value })} /></div>
              <div className="space-y-2"><Label>Preferred Level</Label><select className="w-full border rounded-md px-3 py-2 text-sm" value={form.preferred_level} onChange={e => setForm({ ...form, preferred_level: e.target.value })}><option>Proficient Certificate</option><option>Master Certificate</option><option>Expert Certificate</option></select></div>
              <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2 flex gap-3"><Button type="submit">Save Lead</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setTouched({}) }}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5" /> Lead Pipeline ({filtered.length})</CardTitle><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input className="pl-9" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left py-3 px-4">Name</th><th className="text-left py-3 px-4">Email</th><th className="text-left py-3 px-4">Phone</th><th className="text-left py-3 px-4">Course</th><th className="text-left py-3 px-4">Level</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Actions</th></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">No leads found</td></tr> : filtered.map((lead: any) => <tr key={lead.id} className="border-b hover:bg-gray-50"><td className="py-3 px-4 font-medium">{lead.full_name}</td><td className="py-3 px-4 text-gray-600">{lead.email}</td><td className="py-3 px-4 text-gray-600">{lead.phone || '—'}</td><td className="py-3 px-4 text-gray-600">{lead.interested_course || '—'}</td><td className="py-3 px-4 text-gray-600">{lead.preferred_level || '—'}</td><td className="py-3 px-4"><Badge className="bg-blue-100 text-blue-800">{lead.status}</Badge></td><td className="py-3 px-4"><select className="border rounded px-2 py-1 text-xs" value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  )
}
