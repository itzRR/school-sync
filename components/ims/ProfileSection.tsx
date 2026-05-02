"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  User, Mail, Calendar as CalendarIcon, Crown, Star, Shield, Clock,
  Edit, Save, X, Lock, Key, ImageIcon, Link as LinkIcon, CheckCircle,
  AlertCircle, FileText, Plus, Building, Briefcase, Trash2
} from "lucide-react"

import type { Profile } from "@/types"
import { updateProfileRole } from "@/lib/ims-data"

// ── Google Drive link → thumbnail URL converter ────────────────────────────
const convertToThumbnail = (url: string): string => {
  if (!url?.trim()) return ""
  const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch) return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}=w1000`
  const driveOpenMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (driveOpenMatch && url.includes("drive.google.com")) return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}=w1000`
  return url
}

const isGoogleDriveLink = (url: string) => url.includes("drive.google.com") && !url.includes("thumbnail?id=")

export const Avatar = ({ photoURL, name, size = "lg", className = "" }: { photoURL?: string | null, name: string | null, size?: "sm"|"md"|"lg"|"xl", className?: string }) => {
  const [imgError, setImgError] = useState(false)
  const sizeMap = {
    sm: { outer: "w-8 h-8", text: "text-sm" },
    md: { outer: "w-10 h-10", text: "text-base" },
    lg: { outer: "w-32 h-32", text: "text-4xl" },
    xl: { outer: "w-40 h-40", text: "text-5xl" },
  }
  const s = sizeMap[size]
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  const resolvedUrl = photoURL ? convertToThumbnail(photoURL) : ""
  
  React.useEffect(() => { setImgError(false) }, [resolvedUrl])

  return (
    <div className={`${className || s.outer} rounded-2xl overflow-hidden flex-shrink-0 relative`}>
      {resolvedUrl && !imgError ? (
        <img src={resolvedUrl} alt={name || "Avatar"} className="w-full h-full object-cover" onError={() => setImgError(true)} referrerPolicy="no-referrer" crossOrigin="anonymous" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#02559c] to-[#3b9ced] flex items-center justify-center">
          <span className={`${s.text} font-bold text-white`}>{initials}</span>
        </div>
      )}
    </div>
  )
}

const PhotoEditor = ({ uid, currentPhotoURL, name, onClose, onUpdate }: { uid: string, currentPhotoURL?: string | null, name: string | null, onClose: () => void, onUpdate: (url: string) => void }) => {
  const [url, setUrl] = useState(currentPhotoURL || "")
  const [preview, setPreview] = useState(currentPhotoURL ? convertToThumbnail(currentPhotoURL) : "")
  const [previewError, setPreviewError] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setPreviewError(false)
    setPreview(val.trim() ? convertToThumbnail(val.trim()) : "")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const resolvedURL = url.trim() ? convertToThumbnail(url.trim()) : ""
      await updateProfileRole(uid, { avatar_url: resolvedURL })
      toast.success("Profile photo updated!")
      onUpdate(resolvedURL)
      onClose()
    } catch {
      toast.error("Failed to update photo")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await updateProfileRole(uid, { avatar_url: "" })
      toast.success("Profile photo removed")
      onUpdate("")
      onClose()
    } catch {
      toast.error("Failed to remove photo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-500" /> Update Profile Photo</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/10 shadow-lg">
              {preview && !previewError ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewError(true)} referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#02559c] to-[#3b9ced] flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{(name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3 mb-5">
          <label className="block text-sm font-medium text-gray-600">Image URL or Google Drive share link</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          {isGoogleDriveLink(url) && <p className="text-xs text-blue-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Drive link detected.</p>}
        </div>
        <div className="flex gap-2">
          {currentPhotoURL && <button onClick={handleRemove} disabled={saving} className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-all">Remove</button>}
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-600 flex justify-center items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Photo</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const DocumentEditor = ({ uid, existingDocs = [], onClose, onUpdate }: { uid: string, existingDocs: any[], onClose: () => void, onUpdate: (docs: any[]) => void }) => {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [preview, setPreview] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setPreviewError(false)
    setPreview(val.trim() ? convertToThumbnail(val.trim()) : "")
  }

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return toast.error("Please provide title and URL")
    setSaving(true)
    try {
      const newDoc = { id: Date.now().toString(), title: title.trim(), url: url.trim(), addedAt: new Date().toISOString() }
      const updatedDocs = [...existingDocs, newDoc]
      await updateProfileRole(uid, { documents: updatedDocs })
      toast.success("Document added successfully!")
      onUpdate(updatedDocs)
      onClose()
    } catch {
      toast.error("Failed to add document")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-[2rem] p-8 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Add Document
            </h3>
            <p className="text-gray-500 text-sm mt-1">Upload a certificate or important file link</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Document Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Degree Certificate" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600">Image URL / Drive Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            </div>
          </div>
          
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 h-48 flex items-center justify-center relative group">
                {!previewError ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={() => setPreviewError(true)} />
                ) : (
                  <div className="flex flex-col items-center text-white/20 gap-3">
                    <FileText className="w-12 h-12" />
                    <span className="text-xs font-bold uppercase tracking-widest">No Preview Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !url.trim()} 
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> Add Document</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfileSection({ userData, onUpdateProfile }: { userData: Profile, onUpdateProfile?: (data: Partial<Profile>) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(userData.full_name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [showDocEditor, setShowDocEditor] = useState(false)
  const [localUser, setLocalUser] = useState<Profile>(userData)

  const handleSave = async () => {
    if (!editedName.trim()) return toast.error("Name cannot be empty")
    setIsLoading(true)
    try {
      await updateProfileRole(localUser.id, { full_name: editedName.trim() })
      toast.success("Profile updated")
      setIsEditing(false)
      setLocalUser(prev => ({ ...prev, full_name: editedName.trim() }))
      if (onUpdateProfile) onUpdateProfile({ full_name: editedName.trim() })
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm("Remove this document?")) return
    try {
      const updatedDocs = (localUser.documents || []).filter(d => d.id !== docId)
      await updateProfileRole(localUser.id, { documents: updatedDocs })
      toast.success("Document removed")
      setLocalUser(prev => ({ ...prev, documents: updatedDocs }))
      if (onUpdateProfile) onUpdateProfile({ documents: updatedDocs })
    } catch {
      toast.error("Failed to remove document")
    }
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showPhotoEditor && <PhotoEditor uid={localUser.id} currentPhotoURL={localUser.avatar_url} name={localUser.full_name} onClose={() => setShowPhotoEditor(false)} onUpdate={(url) => { setLocalUser(p => ({ ...p, avatar_url: url })); if(onUpdateProfile) onUpdateProfile({ avatar_url: url }) }} />}
        {showDocEditor && <DocumentEditor uid={localUser.id} existingDocs={localUser.documents || []} onClose={() => setShowDocEditor(false)} onUpdate={(docs) => { setLocalUser(p => ({ ...p, documents: docs })); if(onUpdateProfile) onUpdateProfile({ documents: docs }) }} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl md:text-2xl text-gray-900 font-bold">My Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your account details and settings.</p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-white/5 text-white/80 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={isLoading} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0 flex flex-col items-center gap-4 lg:w-1/4">
            <motion.div whileHover={{ scale: 1.05 }} className="relative group cursor-pointer shadow-xl rounded-2xl" onClick={() => setShowPhotoEditor(true)}>
              <div className="p-1.5 bg-gradient-to-br from-blue-500/50 to-purple-500/50 rounded-3xl">
                <Avatar photoURL={localUser.avatar_url} name={localUser.full_name} className="w-40 h-40 md:w-48 md:h-48 rounded-2xl shadow-inner border-2 border-white/10" />
              </div>
              <div className="absolute inset-1.5 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                <ImageIcon className="w-8 h-8 text-white" />
                <span className="text-white text-sm font-medium">Update Photo</span>
              </div>
            </motion.div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">{localUser.full_name || "Anonymous"}</h3>
              <p className="text-blue-600 font-medium text-sm mt-1">{localUser.position || "Member"}</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 bg-white/10 text-white rounded-full text-xs font-semibold border border-white/5">
                <Shield className="w-3.5 h-3.5" /> <span className="capitalize">{localUser.role.replace('_', ' ')}</span>
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Full Name</label>
                  {isEditing ? (
                    <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full bg-white border border-blue-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                  ) : (
                    <p className="text-base font-semibold text-gray-800 bg-white px-4 py-2.5 rounded-xl border border-gray-100">{localUser.full_name || "-"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Email Address</label>
                  <p className="text-base font-semibold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> <span className="truncate">{localUser.email}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><CalendarIcon className="w-5 h-5" /></div>
                  <div><p className="text-xs text-blue-500 font-medium">Member Since</p><p className="text-sm font-bold text-blue-800">{localUser.created_at ? format(new Date(localUser.created_at), 'MMM d, yyyy') : 'Unknown'}</p></div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700"><Clock className="w-5 h-5" /></div>
                  <div><p className="text-xs text-emerald-600 font-medium">Last Active</p><p className="text-sm font-bold text-emerald-800">{localUser.last_active ? format(new Date(localUser.last_active), 'MMM d, yyyy') : 'Recently'}</p></div>
                </div>
                {localUser.department && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Building className="w-5 h-5" /></div>
                    <div><p className="text-xs text-purple-500 font-medium">Department</p><p className="text-sm font-bold text-purple-800">{localUser.department}</p></div>
                  </div>
                )}
                {localUser.access_level !== undefined && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Key className="w-5 h-5" /></div>
                    <div><p className="text-xs text-amber-600 font-medium">Access Level</p><p className="text-sm font-bold text-amber-800">Level {localUser.access_level}</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* Office Assets */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" /> Office Assets
              </h3>
              {!localUser.office_assets || localUser.office_assets.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-white">
                  <p className="text-gray-400 text-sm font-medium">No assets assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localUser.office_assets.map((asset, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 text-sm">{asset.item}</span>
                      {asset.serialNo && <span className="text-xs text-gray-500">SN: <span className="font-mono">{asset.serialNo}</span></span>}
                      {asset.issuedDate && <span className="text-xs text-gray-400">Issued: {asset.issuedDate}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-500" /> My Documents</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your certificates and important files.</p>
          </div>
          <button onClick={() => setShowDocEditor(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> New Document
          </button>
        </div>

        {!localUser.documents?.length ? (
          <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No documents found</p>
            <p className="text-gray-300 text-xs mt-1">Add certificates or files to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {localUser.documents.map((docItem) => {
              const previewUrl = convertToThumbnail(docItem.url)
              return (
                <motion.div key={docItem.id} whileHover={{ y: -5 }} className="relative group bg-white rounded-[1.5rem] overflow-hidden border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                  <div className="h-44 bg-black/40 overflow-hidden relative">
                    <img src={previewUrl} alt={docItem.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as any).style.display='none' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1628] via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="p-5 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-[15px] truncate leading-tight mb-1" title={docItem.title}>{docItem.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(docItem.addedAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <a href={docItem.url} target="_blank" rel="noreferrer" className="w-8 h-8 bg-blue-500/20 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-gray-900 transition-all border border-blue-500/20 shadow-lg shadow-blue-500/20" title="Open Link">
                          <LinkIcon className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleDeleteDoc(docItem.id)} className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-gray-900 transition-all border border-red-200 shadow-lg shadow-red-500/20" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}


