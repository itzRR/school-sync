import { supabase } from './supabase'

// ── COURSES ──────────────────────────────────────────────────────────────────

export async function getCourses(activeOnly = true) {
  let query = supabase.from('courses').select('*').order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getFeaturedCourses() {
  const { data, error } = await supabase
    .from('courses').select('*')
    .eq('is_active', true).eq('is_featured', true)
    .order('created_at', { ascending: false }).limit(6)
  if (error) throw error
  return data || []
}

export async function getCourseBySlug(slug: string) {
  const { data } = await supabase
    .from('courses').select('*, modules(*)').eq('slug', slug).single()
  return data
}

export async function getCourseById(id: string) {
  const { data } = await supabase
    .from('courses').select('*, modules(*)').eq('id', id).single()
  return data
}

export async function createCourse(course: {
  slug: string; title: string; description: string; short_description?: string
  price: number; original_price?: number; level: string; category: string
  total_hours: number; image_url?: string; tags: string[]
  is_active: boolean; is_featured: boolean
}) {
  const { data, error } = await supabase.from('courses').insert(course).select().single()
  if (error) throw error
  return data
}

export async function updateCourse(id: string, updates: Partial<{
  slug: string; title: string; description: string; short_description: string
  price: number; original_price: number; level: string; category: string
  total_hours: number; image_url: string; tags: string[]
  is_active: boolean; is_featured: boolean
}>) {
  const { data, error } = await supabase
    .from('courses').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}

// ── MODULES ──────────────────────────────────────────────────────────────────

export async function getModulesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('modules').select('*').eq('course_id', courseId).order('order_index')
  if (error) throw error
  return data || []
}

export async function createModule(module: {
  course_id: string; title: string; description?: string
  duration_hours: number; order_index: number; topics: string[]
}) {
  const { data, error } = await supabase.from('modules').insert(module).select().single()
  if (error) throw error
  return data
}

export async function updateModule(id: string, updates: Partial<{
  title: string; description: string; duration_hours: number
  order_index: number; topics: string[]; is_active: boolean
}>) {
  const { data, error } = await supabase
    .from('modules').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) throw error
}

// ── BATCHES ──────────────────────────────────────────────────────────────────

export async function getBatches(activeOnly = true) {
  let query = supabase.from('batches').select('*, courses(title, level)').order('start_date', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getBatchById(id: string) {
  const { data } = await supabase
    .from('batches').select('*, courses(*), trainer_allocations(*, profiles(full_name, specialization), modules(title))')
    .eq('id', id).single()
  return data
}

export async function createBatch(batch: {
  course_id: string; name: string; start_date: string; end_date?: string
  schedule: string; mode: string; venue?: string; seats: number
}) {
  const { data, error } = await supabase.from('batches').insert(batch).select().single()
  if (error) throw error
  return data
}

export async function updateBatch(id: string, updates: Partial<{
  name: string; start_date: string; end_date: string; schedule: string
  mode: string; venue: string; seats: number; is_active: boolean
}>) {
  const { data, error } = await supabase
    .from('batches').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── TRAINER ALLOCATIONS ──────────────────────────────────────────────────────

export async function allocateTrainer(batchId: string, trainerId: string, moduleId?: string) {
  const { data, error } = await supabase
    .from('trainer_allocations')
    .insert({ batch_id: batchId, trainer_id: trainerId, module_id: moduleId || null })
    .select().single()
  if (error) throw error
  return data
}

export async function removeTrainerAllocation(id: string) {
  const { error } = await supabase.from('trainer_allocations').delete().eq('id', id)
  if (error) throw error
}

// ── STUDENTS ─────────────────────────────────────────────────────────────────

export async function getStudents() {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('role', 'student')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getTrainers() {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('role', 'trainer')
    .order('full_name')
  if (error) throw error
  return data || []
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId).select().single()
  if (error) throw error
  return data
}

// ── ENROLLMENTS ──────────────────────────────────────────────────────────────

export async function enrollStudent(userId: string, courseId: string, batchId: string | null, amountPaid: number) {
  const { data, error } = await supabase.from('enrollments').insert({
    user_id: userId, course_id: courseId, batch_id: batchId,
    status: 'confirmed', payment_status: 'paid', amount_paid: amountPaid,
  }).select().single()
  if (error) throw error
  if (batchId) await supabase.rpc('increment_batch_enrolled', { p_batch_id: batchId })
  return data
}

export async function getEnrollments() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles(full_name, email, student_id), courses(title, level), batches(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getUserEnrollments(userId: string) {
  const { data, error } = await supabase
    .from('enrollments').select('*, courses(*, modules(*)), batches(*)')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function checkUserEnrollment(userId: string, courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments').select('id')
    .eq('user_id', userId).eq('course_id', courseId).single()
  return !!data
}

export async function updateEnrollmentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('enrollments').update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function getAttendanceByBatch(batchId: string, date?: string) {
  let query = supabase.from('attendance')
    .select('*, enrollments(profiles(full_name, student_id))')
    .eq('batch_id', batchId)
  if (date) query = query.eq('date', date)
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function markAttendance(records: {
  enrollment_id: string; batch_id: string; date: string
  status: string; marked_by: string; notes?: string
}[]) {
  const { data, error } = await supabase.from('attendance').upsert(records, {
    onConflict: 'enrollment_id,date'
  }).select()
  if (error) throw error
  return data
}

export async function getStudentAttendance(enrollmentId: string) {
  const { data, error } = await supabase
    .from('attendance').select('*').eq('enrollment_id', enrollmentId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

// ── MODULE PROGRESS ──────────────────────────────────────────────────────────

export async function getModuleProgress(enrollmentId: string) {
  const { data, error } = await supabase
    .from('module_progress').select('*, modules(title, duration_hours, order_index)')
    .eq('enrollment_id', enrollmentId).order('modules(order_index)')
  if (error) throw error
  return data || []
}

export async function upsertModuleProgress(progress: {
  enrollment_id: string; module_id: string; status: string
  score?: number; practical_score?: number; theory_score?: number
  completed_at?: string
}) {
  const { data, error } = await supabase
    .from('module_progress').upsert(progress, { onConflict: 'enrollment_id,module_id' })
    .select().single()
  if (error) throw error
  return data
}

// ── ASSESSMENTS ──────────────────────────────────────────────────────────────

export async function getAssessmentsByEnrollment(enrollmentId: string) {
  const { data, error } = await supabase
    .from('assessments').select('*, modules(title)')
    .eq('enrollment_id', enrollmentId).order('conducted_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAssessment(assessment: {
  enrollment_id: string; module_id?: string; type: string; title: string
  marks_obtained?: number; total_marks: number; grade?: string
  conducted_at?: string; notes?: string
}) {
  const { data, error } = await supabase.from('assessments').insert(assessment).select().single()
  if (error) throw error
  return data
}

export async function updateAssessment(id: string, updates: Partial<{
  marks_obtained: number; grade: string; notes: string
}>) {
  const { data, error } = await supabase
    .from('assessments').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── CERTIFICATES ─────────────────────────────────────────────────────────────

export async function getCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(full_name, email, student_id), courses(title, level)')
    .order('issued_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCertificateByNumber(certNumber: string) {
  const { data } = await supabase
    .from('certificates')
    .select('*, profiles(full_name, email), courses(title, level)')
    .eq('certificate_number', certNumber).single()
  return data
}

export async function issueCertificate(cert: {
  enrollment_id: string; user_id: string; course_id: string
  certificate_number: string; type: string; qr_code_data: string; pdf_url?: string
}) {
  const { data, error } = await supabase.from('certificates').insert(cert).select().single()
  if (error) throw error
  return data
}

// ── LEARNING RESOURCES ────────────────────────────────────────────────────────

export async function getResourcesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('learning_resources').select('*, modules(title)')
    .eq('course_id', courseId).eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllResources() {
  const { data, error } = await supabase
    .from('learning_resources')
    .select('*, modules(title), courses(title)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createResource(resource: {
  module_id?: string; course_id?: string; title: string; description?: string
  type: string; url: string
}) {
  const { data, error } = await supabase.from('learning_resources').insert(resource).select().single()
  if (error) throw error
  return data
}

// ── CONTACT MESSAGES ─────────────────────────────────────────────────────────

export async function submitContactMessage(msg: {
  name: string; email: string; phone?: string; subject: string; message: string
}) {
  const { data, error } = await supabase.from('contact_messages').insert(msg).select().single()
  if (error) throw error
  return data
}

export async function getContactMessages() {
  const { data, error } = await supabase
    .from('contact_messages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function markMessageAsRead(id: string) {
  const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

// ── DASHBOARD STATS ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    { count: totalStudents },
    { count: totalCourses },
    { count: totalBatches },
    { count: totalTrainers },
    { count: totalEnrollments },
    { count: certificatesIssued },
    { data: enrollmentRevenue },
    { data: recentEnrollments },
    { data: attendanceData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('batches').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('amount_paid, created_at'),
    supabase.from('enrollments')
      .select('*, profiles(full_name, email, student_id), courses(title, level), batches(name)')
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('attendance').select('status'),
  ])

  const totalRevenue = enrollmentRevenue?.reduce((sum, e) => sum + (e.amount_paid || 0), 0) || 0

  const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0
  const totalAttendance = attendanceData?.length || 0
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  const now = new Date()
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const month = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    const revenue = enrollmentRevenue?.filter(e => {
      const ed = new Date(e.created_at)
      return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
    }).reduce((sum, e) => sum + (e.amount_paid || 0), 0) || 0
    return { month, revenue }
  })

  return {
    totalStudents: totalStudents || 0,
    totalCourses: totalCourses || 0,
    totalBatches: totalBatches || 0,
    totalTrainers: totalTrainers || 0,
    totalEnrollments: totalEnrollments || 0,
    certificatesIssued: certificatesIssued || 0,
    totalRevenue,
    attendanceRate,
    monthlyRevenue,
    recentEnrollments: recentEnrollments || [],
  }
}


// ── EVENTS ──────────────────────────────────────────────────────────────────

export async function getEvents(activeOnly = true) {
  let query = supabase.from('events').select('*').order('start_date', { ascending: true })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getEventById(id: string) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createEvent(event: {
  slug: string; title: string; description: string; short_description?: string
  start_date: string; end_date?: string; start_time?: string; end_time?: string
  venue: string; capacity: number; price: number; category: string; organizer: string
  image_url?: string; tags?: string[]; agenda?: unknown[]; speakers?: unknown[]
  is_active: boolean; is_featured: boolean
}) {
  const payload = {
    ...event,
    tags: event.tags || [],
    agenda: event.agenda || [],
    speakers: event.speakers || [],
  }
  const { data, error } = await supabase.from('events').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateEvent(id: string, updates: Partial<{
  slug: string; title: string; description: string; short_description: string
  start_date: string; end_date: string; start_time: string; end_time: string
  venue: string; capacity: number; price: number; category: string; organizer: string
  image_url: string; tags: string[]; agenda: unknown[]; speakers: unknown[]
  is_active: boolean; is_featured: boolean
}>) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export async function checkUserEventRegistration(userId: string, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()
  if (error) throw error
  return !!data
}


// ── STUDENT LEADS ───────────────────────────────────────────────────────────

export async function getStudentLeads() {
  const { data, error } = await supabase
    .from('student_leads')
    .select('*, profiles!student_leads_assigned_to_fkey(full_name, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createStudentLead(lead: {
  full_name: string; email: string; phone?: string; interested_course?: string
  preferred_level?: string; status?: string; notes?: string; assigned_to?: string
}) {
  const { data, error } = await supabase.from('student_leads').insert(lead).select().single()
  if (error) throw error
  return data
}

export async function updateStudentLead(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('student_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── ACADEMIC RECORDS ────────────────────────────────────────────────────────

export async function getAcademicRecordsByEnrollment(enrollmentId: string) {
  const { data, error } = await supabase
    .from('academic_records')
    .select('*, modules(title, duration_hours, order_index)')
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAcademicRecord(record: {
  enrollment_id: string; module_id?: string; type: string; title: string; status?: string
  score?: number; max_score?: number; notes?: string; evidence_url?: string; assessed_at?: string
}) {
  const { data, error } = await supabase
    .from('academic_records')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAcademicRecord(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('academic_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getCertificateVerification(certificateNumber: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(full_name, student_id, email), courses(title, level)')
    .eq('certificate_number', certificateNumber)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getTrainerPerformance() {
  const { data: trainers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, specialization, is_active')
    .eq('role', 'trainer')
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: allocations } = await supabase
    .from('trainer_allocations')
    .select('trainer_id, batch_id, module_id')
  const { data: attendance } = await supabase
    .from('attendance')
    .select('marked_by, status')
  const { data: progress } = await supabase
    .from('module_progress')
    .select('score, practical_score, theory_score, completed_at')

  return (trainers || []).map((trainer: any) => {
    const trainerAllocs = (allocations || []).filter((a: any) => a.trainer_id === trainer.id)
    const trainerAttendance = (attendance || []).filter((a: any) => a.marked_by === trainer.id)
    const presentCount = trainerAttendance.filter((a: any) => a.status === 'present').length
    const avgAttendance = trainerAttendance.length ? Math.round((presentCount / trainerAttendance.length) * 100) : 0
    const completedProgress = (progress || []).filter((p: any) => p.completed_at)
    const progressScores = completedProgress
      .map((p: any) => p.score ?? p.practical_score ?? p.theory_score)
      .filter((x: any) => typeof x === 'number')
    const avgScore = progressScores.length ? Math.round(progressScores.reduce((a: number, b: number) => a + b, 0) / progressScores.length) : null
    return {
      ...trainer,
      assigned_batches: new Set(trainerAllocs.map((a: any) => a.batch_id)).size,
      assigned_modules: trainerAllocs.filter((a: any) => a.module_id).length,
      attendance_rate: avgAttendance,
      average_score: avgScore,
    }
  })
}
