import { supabase } from './supabase'
import type {
  Profile, MarketingLead, MarketingCampaign,
  ImsPayment, ImsInvoice, ImsExpense,
  HrLeaveRequest, HrSalaryPayout, HrPerformanceReview, HrRoster,
  OpsTask, OpsMinuteTracker, OpsMinuteTrackerTask,
  ImsLoginHistory, ImsSystemCommand, IMSDashboardStats, UserRole
} from '@/types'

// ── PROFILES / STAFF ─────────────────────────────────────────

export async function getIMSStaff(): Promise<Profile[]> {
  const imsRoles = ['admin','super_admin','branch_manager','marketing_staff','academic_staff','finance_officer','hr_officer','staff']
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', imsRoles)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateProfileRole(id: string, updates: Partial<{
  role: UserRole
  position: string
  department: string
  access_level: number
  task_delete_permission: boolean
  permissions: string[]
  work_schedule: { startTime: string, durationHours: number }[]
  office_assets: { item: string, serialNo?: string, issuedDate?: string }[]
  disabled: boolean
  full_name: string
  phone: string
  avatar_url: string
  documents: any[]
}>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createStaffUser(params: {
  email: string
  password: string
  name: string
  role: UserRole
  position: string
  department?: string
  access_level?: number
  permissions?: string[]
  work_schedule?: { startTime: string, durationHours: number }[]
  office_assets?: { item: string, serialNo?: string, issuedDate?: string }[]
}) {
  // Calls the server-side API route which uses the service role key
  // to bypass RLS policies on the profiles table.
  const { data: { session } } = await supabase.auth.getSession()
  
  const res = await fetch("/api/ims/create-staff-user", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      name: params.name,
      role: params.role,
      position: params.position,
      department: params.department || null,
      access_level: params.access_level ?? 1,
      permissions: params.permissions || [],
      work_schedule: params.work_schedule || [],
      office_assets: params.office_assets || [],
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to create user")
  return json.user
}


// ── IMS DASHBOARD STATS ──────────────────────────────────────

export async function getIMSDashboardStats(): Promise<IMSDashboardStats> {
  const [
    { count: totalStaff },
    { count: totalStudents },
    { count: activeLeads },
    { count: convertedLeads },
    { count: pendingLeaves },
    { count: openTasks },
    revenueResult,
    pendingPaymentsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin','super_admin','branch_manager','marketing_staff','academic_staff','finance_officer','hr_officer','staff']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('status', 'eq', 'Converted').not('status', 'eq', 'Lost'),
    supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', 'Converted'),
    supabase.from('hr_leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('ops_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('ims_payments').select('amount'),
    supabase.from('ims_invoices').select('total').eq('status', 'Unpaid'),
  ])

  const totalRevenue = (revenueResult.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const pendingPayments = (pendingPaymentsResult.data || []).reduce((sum: number, i: any) => sum + (i.total || 0), 0)

  return {
    totalStaff: totalStaff || 0,
    totalStudents: totalStudents || 0,
    activeLeads: activeLeads || 0,
    convertedLeads: convertedLeads || 0,
    pendingLeaves: pendingLeaves || 0,
    openTasks: openTasks || 0,
    totalRevenue,
    pendingPayments,
  }
}

// ── MARKETING LEADS ──────────────────────────────────────────

export async function getMarketingLeads(): Promise<MarketingLead[]> {
  const { data, error } = await supabase
    .from('marketing_leads')
    .select('*, assignee:profiles!assigned_to(id,full_name,email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, follow_ups: d.follow_ups || [] }))
}

export async function createMarketingLead(lead: Omit<MarketingLead, 'id' | 'created_at' | 'updated_at' | 'assignee'> & { created_by?: string | null }): Promise<MarketingLead> {
  const { data, error } = await supabase
    .from('marketing_leads')
    .insert({ ...lead, follow_ups: lead.follow_ups || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, follow_ups: data.follow_ups || [] }
}

export async function updateMarketingLead(id: string, updates: Partial<MarketingLead>): Promise<MarketingLead> {
  const { assignee, ...rest } = updates as any
  const { data, error } = await supabase
    .from('marketing_leads')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, follow_ups: data.follow_ups || [] }
}

export async function deleteMarketingLead(id: string): Promise<void> {
  const { error } = await supabase.from('marketing_leads').delete().eq('id', id)
  if (error) throw error
}

export async function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMarketingCampaign(campaign: Omit<MarketingCampaign, 'id' | 'created_at'>): Promise<MarketingCampaign> {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMarketingCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
  if (error) throw error
}

// ── FINANCE ──────────────────────────────────────────────────

export async function getImsPayments(): Promise<ImsPayment[]> {
  const { data, error } = await supabase
    .from('ims_payments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createImsPayment(payment: Omit<ImsPayment, 'id' | 'created_at'>): Promise<ImsPayment> {
  const { data, error } = await supabase
    .from('ims_payments')
    .insert(payment)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteImsPayment(id: string): Promise<void> {
  const { error } = await supabase.from('ims_payments').delete().eq('id', id)
  if (error) throw error
}

export async function getImsInvoices(): Promise<ImsInvoice[]> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .select('*')
    .order('generated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, items: d.items || [] }))
}

export async function createImsInvoice(invoice: Omit<ImsInvoice, 'id' | 'generated_at'>): Promise<ImsInvoice> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .insert({ ...invoice, items: invoice.items || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, items: data.items || [] }
}

export async function updateImsInvoice(id: string, updates: Partial<ImsInvoice>): Promise<ImsInvoice> {
  const { data, error } = await supabase
    .from('ims_invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, items: data.items || [] }
}

export async function deleteImsInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('ims_invoices').delete().eq('id', id)
  if (error) throw error
}

export async function getImsExpenses(): Promise<ImsExpense[]> {
  const { data, error } = await supabase
    .from('ims_expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createImsExpense(expense: Omit<ImsExpense, 'id' | 'created_at'>): Promise<ImsExpense> {
  const { data, error } = await supabase
    .from('ims_expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteImsExpense(id: string): Promise<void> {
  const { error } = await supabase.from('ims_expenses').delete().eq('id', id)
  if (error) throw error
}

// ── HR ───────────────────────────────────────────────────────

export async function getHrLeaveRequests(): Promise<HrLeaveRequest[]> {
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .select('*, employee:profiles!user_id(id,full_name,position,department)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrLeaveRequest(req: Omit<HrLeaveRequest, 'id' | 'created_at' | 'updated_at' | 'employee'>): Promise<HrLeaveRequest> {
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .insert(req)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHrLeaveRequest(id: string, updates: Partial<HrLeaveRequest>): Promise<HrLeaveRequest> {
  const { employee, ...rest } = updates as any
  const { data, error } = await supabase
    .from('hr_leave_requests')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase.from('hr_leave_requests').delete().eq('id', id)
  if (error) throw error
}

export async function getHrSalaryPayouts(): Promise<HrSalaryPayout[]> {
  const { data, error } = await supabase
    .from('hr_salary_payouts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrSalaryPayout(payout: Omit<HrSalaryPayout, 'id' | 'created_at'>): Promise<HrSalaryPayout> {
  const { data, error } = await supabase
    .from('hr_salary_payouts')
    .insert(payout)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrSalaryPayout(id: string): Promise<void> {
  const { error } = await supabase.from('hr_salary_payouts').delete().eq('id', id)
  if (error) throw error
}

export async function getHrPerformanceReviews(): Promise<HrPerformanceReview[]> {
  const { data, error } = await supabase
    .from('hr_performance_reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrPerformanceReview(review: Omit<HrPerformanceReview, 'id' | 'created_at'>): Promise<HrPerformanceReview> {
  const { data, error } = await supabase
    .from('hr_performance_reviews')
    .insert(review)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrPerformanceReview(id: string): Promise<void> {
  const { error } = await supabase.from('hr_performance_reviews').delete().eq('id', id)
  if (error) throw error
}

export async function getHrRoster(): Promise<HrRoster[]> {
  const { data, error } = await supabase
    .from('hr_roster')
    .select('*, assignee:profiles!assigned_to(id,full_name,position)')
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createHrRoster(entry: Omit<HrRoster, 'id' | 'created_at' | 'assignee'>): Promise<HrRoster> {
  const { data, error } = await supabase
    .from('hr_roster')
    .insert(entry)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHrRoster(id: string): Promise<void> {
  const { error } = await supabase.from('hr_roster').delete().eq('id', id)
  if (error) throw error
}

// ── TASKS ────────────────────────────────────────────────────

export async function getOpsTasks(): Promise<OpsTask[]> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({
    ...d,
    assigned_to: d.assigned_to || [],
    completed_by: d.completed_by || [],
  }))
}

export async function createOpsTask(task: Omit<OpsTask, 'id' | 'created_at' | 'updated_at'>): Promise<OpsTask> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .insert({ ...task, assigned_to: task.assigned_to || [], completed_by: task.completed_by || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, assigned_to: data.assigned_to || [], completed_by: data.completed_by || [] }
}

export async function updateOpsTask(id: string, updates: Partial<OpsTask>): Promise<OpsTask> {
  const { data, error } = await supabase
    .from('ops_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, assigned_to: data.assigned_to || [], completed_by: data.completed_by || [] }
}

export async function deleteOpsTask(id: string): Promise<void> {
  const { error } = await supabase.from('ops_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function completeOpsTask(taskId: string, userId: string): Promise<void> {
  const { data } = await supabase.from('ops_tasks').select('completed_by').eq('id', taskId).single()
  const completedBy: string[] = data?.completed_by || []
  if (!completedBy.includes(userId)) completedBy.push(userId)
  const { error } = await supabase
    .from('ops_tasks')
    .update({ status: 'completed', completed_by: completedBy, updated_at: new Date().toISOString() })
    .eq('id', taskId)
  if (error) throw error
}

// ── MINUTE TRACKERS ──────────────────────────────────────────

export async function getMinuteTrackers(): Promise<OpsMinuteTracker[]> {
  const { data, error } = await supabase
    .from('ops_minute_trackers')
    .select('*, tasks:ops_minute_tracker_tasks(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(d => ({ ...d, members: d.members || [], tasks: d.tasks || [] }))
}

export async function createMinuteTracker(tracker: Omit<OpsMinuteTracker, 'id' | 'created_at' | 'tasks'>): Promise<OpsMinuteTracker> {
  const { data, error } = await supabase
    .from('ops_minute_trackers')
    .insert({ ...tracker, members: tracker.members || [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, members: data.members || [], tasks: [] }
}

export async function deleteMinuteTracker(id: string): Promise<void> {
  const { error } = await supabase.from('ops_minute_trackers').delete().eq('id', id)
  if (error) throw error
}

export async function addMinuteTrackerTask(task: Omit<OpsMinuteTrackerTask, 'id' | 'created_at'>): Promise<OpsMinuteTrackerTask> {
  const { data, error } = await supabase
    .from('ops_minute_tracker_tasks')
    .insert(task)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── SYSTEM / ADMIN ────────────────────────────────────────────

export async function getLoginHistory(): Promise<ImsLoginHistory[]> {
  const { data, error } = await supabase
    .from('ims_login_history')
    .select('*')
    .order('login_time', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function getSystemCommands(): Promise<ImsSystemCommand[]> {
  const { data, error } = await supabase
    .from('ims_system_commands')
    .select('*')
    .order('sent_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createSystemCommand(cmd: Omit<ImsSystemCommand, 'id' | 'sent_at'>): Promise<ImsSystemCommand> {
  const { data, error } = await supabase
    .from('ims_system_commands')
    .insert(cmd)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSystemCommandStatus(id: string, status: 'delivered' | 'cancelled'): Promise<void> {
  const { error } = await supabase
    .from('ims_system_commands')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function disableUser(userId: string, disabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ disabled, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

// ── ACADEMIC RESULTS ─────────────────────────────────────────

export interface AcademicResult {
  id: string
  student_id: string
  student_name: string
  course_id: string
  exam_name: string
  score: number
  max_score: number
  passed: boolean
  date: string
  created_at: string
}

export async function getAcademicResults(): Promise<AcademicResult[]> {
  const { data, error } = await supabase
    .from('ims_academic_results')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAcademicResult(result: Omit<AcademicResult, 'id' | 'created_at' | 'passed'>): Promise<AcademicResult> {
  const { data, error } = await supabase
    .from('ims_academic_results')
    .insert({ ...result, passed: result.score >= result.max_score * 0.5 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAcademicResult(id: string): Promise<void> {
  const { error } = await supabase.from('ims_academic_results').delete().eq('id', id)
  if (error) throw error
}

// ── WORK CALENDAR EVENTS ─────────────────────────────────────

export interface WorkCalendarEvent {
  id: string
  uid: string
  user_name: string
  title: string
  date: string
  end_date?: string
  start_time?: string
  end_time?: string
  category: 'Work' | 'Meeting' | 'Deadline' | 'Leave' | 'Task' | 'Other'
  color: string
  notes?: string
  created_at: string
}

export async function getWorkCalendarEvents(uid: string): Promise<WorkCalendarEvent[]> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .select('*')
    .eq('uid', uid)
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createWorkCalendarEvent(event: Omit<WorkCalendarEvent, 'id' | 'created_at'>): Promise<WorkCalendarEvent> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .insert(event)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkCalendarEvent(id: string, updates: Partial<WorkCalendarEvent>): Promise<WorkCalendarEvent> {
  const { data, error } = await supabase
    .from('work_calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from('work_calendar_events').delete().eq('id', id)
  if (error) throw error
}

// ── STAFF ATTENDANCE ─────────────────────────────────────────

export interface StaffAttendanceSession {
  id: string
  user_id: string
  user_name: string
  date: string
  time_in: string
  time_out?: string | null
  status: 'present' | 'late' | 'active'
  daily_report?: string
  session_index: number
  created_at: string
}

export async function getMyAttendance(userId: string, limit = 90): Promise<StaffAttendanceSession[]> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .eq('user_id', userId)
    .order('time_in', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getAllAttendance(): Promise<StaffAttendanceSession[]> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .order('time_in', { ascending: false })
    .limit(500)
  if (error) throw error
  return data || []
}

export async function clockIn(params: { userId: string; userName: string; sessionIndex: number }): Promise<StaffAttendanceSession> {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  // Determine status: late if after 08:00 local time
  const localHour = new Date().getHours()
  const status: 'present' | 'late' = localHour > 8 ? 'late' : 'present'
  const { data, error } = await supabase
    .from('staff_attendance')
    .insert({
      user_id: params.userId,
      user_name: params.userName,
      date: today,
      time_in: now,
      status,
      session_index: params.sessionIndex,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function clockOut(sessionId: string, dailyReport: string): Promise<StaffAttendanceSession> {
  const { data, error } = await supabase
    .from('staff_attendance')
    .update({ time_out: new Date().toISOString(), daily_report: dailyReport })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── REALTIME SUBSCRIPTIONS ────────────────────────────────────

export function subscribeToMarketingLeads(callback: (leads: MarketingLead[]) => void) {
  const channel = supabase
    .channel('marketing_leads_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_leads' }, async () => {
      const leads = await getMarketingLeads()
      callback(leads)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToOpsTasks(callback: (tasks: OpsTask[]) => void): () => void {
  const channel = supabase
    .channel('ops_tasks_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_tasks' }, async () => {
      const tasks = await getOpsTasks()
      callback(tasks)
    })
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}

export function subscribeToSystemCommands(userId: string, callback: (cmd: ImsSystemCommand) => void): () => void {
  const channel = supabase
    .channel(`system_commands_${userId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ims_system_commands', filter: `target_user_id=eq.${userId}` },
      (payload) => callback(payload.new as ImsSystemCommand)
    )
    .subscribe()
  return (): void => { supabase.removeChannel(channel) }
}
