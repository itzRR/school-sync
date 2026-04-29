"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Phone, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldError } from "@/components/ui/field-error"
import { signUp } from "@/lib/auth"
import { sanitizeName, isValidName, isValidEmail, isValidSriLankanPhone, formatSriLankanPhone, getPasswordStrength } from "@/lib/validation"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [education, setEducation] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Real-time field errors (only shown after field is touched/blurred)
  const fieldErrors: Record<string, string> = {}
  if (touched.fullName && fullName.trim() && !isValidName(fullName)) {
    fieldErrors.fullName = "Name can only contain letters, spaces, and hyphens"
  }
  if (touched.fullName && !fullName.trim()) {
    fieldErrors.fullName = "Full name is required"
  }
  if (touched.email && email.trim() && !isValidEmail(email)) {
    fieldErrors.email = "Please enter a valid email (e.g. name@example.com)"
  }
  if (touched.email && !email.trim()) {
    fieldErrors.email = "Email is required"
  }
  if (touched.phone && phone.trim() && !isValidSriLankanPhone(phone)) {
    fieldErrors.phone = "Enter a valid Sri Lankan number (e.g. 071 234 5678)"
  }
  if (touched.password && password && password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters"
  }
  if (touched.confirmPassword && confirmPassword && confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords do not match"
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const handleNameChange = (value: string) => {
    // Auto-strip invalid characters as user types
    setFullName(sanitizeName(value))
  }

  const handlePhoneChange = (value: string) => {
    setPhone(formatSriLankanPhone(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Mark all fields touched to show any remaining errors
    setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true })

    // Validate
    if (!fullName.trim()) { setError("Full name is required"); return }
    if (!isValidName(fullName)) { setError("Name can only contain letters, spaces, and hyphens"); return }
    if (!isValidEmail(email)) { setError("Please enter a valid email address"); return }
    if (phone.trim() && !isValidSriLankanPhone(phone)) { setError("Please enter a valid Sri Lankan phone number"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (password !== confirmPassword) { setError("Passwords do not match"); return }

    setIsLoading(true)
    const { user, error: authError } = await signUp(email, password, fullName)
    setIsLoading(false)

    if (authError) { setError(authError); return }

    if (user) {
      setSuccess("Account created! Please check your email to verify your account, then sign in.")
      setTimeout(() => router.push("/auth/login"), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CADD Centre Lanka</h1>
          <p className="text-gray-500 text-sm mt-1">Academic & Student Management System</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create Student Account</CardTitle>
            <CardDescription className="text-center">Register to access your student portal</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={e => handleNameChange(e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    className={`pl-10 ${fieldErrors.fullName ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    required
                  />
                </div>
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={`pl-10 ${fieldErrors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    required
                  />
                </div>
                <FieldError message={fieldErrors.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="071 234 5678"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    className={`pl-10 ${fieldErrors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  />
                </div>
                <FieldError message={fieldErrors.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education Background</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="education" type="text" placeholder="e.g. A/L, Diploma, BSc" value={education} onChange={e => setEducation(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`pl-10 pr-10 ${fieldErrors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
                {passwordStrength && password.length >= 1 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 1 ? "bg-red-500" : passwordStrength.score <= 2 ? "bg-yellow-500" : passwordStrength.score <= 3 ? "bg-blue-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`pl-10 ${fieldErrors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    required
                  />
                </div>
                <FieldError message={fieldErrors.confirmPassword} />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
