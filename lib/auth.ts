import { createBrowserClient } from '@supabase/ssr'
import type { UserRole } from '@/types'
import type { Permission } from '@/lib/permissions'
import { hasPermission as _hasPermission } from '@/lib/permissions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'

function getClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  position?: string
  department?: string
  access_level?: number
  disabled?: boolean
  permissions: Permission[]
  task_delete_permission?: boolean
  created_at?: string
  last_active?: string
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'student',
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (error) return { user: null, error: error.message }
    if (!data.user) return { user: null, error: 'Registration failed' }

    await supabase.from('profiles').upsert(
      { id: data.user.id, email, full_name: fullName, role, is_active: true },
      { onConflict: 'id', ignoreDuplicates: true },
    )

    return { user: { id: data.user.id, name: fullName, email, role, permissions: [] }, error: null }
  } catch (err) {
    console.error('signUp error:', err)
    return { user: null, error: 'An unexpected error occurred' }
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('signIn Supabase error:', error.message)
      if (error.message.includes("Email not confirmed")) {
        return { user: null, error: 'Your email is not confirmed. Please check your inbox or contact an admin.' }
      }
      return { user: null, error: 'Invalid email or password' }
    }
    if (!data.user) return { user: null, error: 'Login failed' }

    // Fetch basic profile first (always exists)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, position, department, access_level, disabled, created_at, last_active')
      .eq('id', data.user.id)
      .single()

    if (profile?.disabled) {
      await supabase.auth.signOut()
      return { user: null, error: 'Your account has been disabled. Contact an administrator.' }
    }

    // Try to fetch permissions columns (may not exist if migrations not run yet)
    let permissions: Permission[] = []
    let task_delete_permission = false
    const { data: extProfile, error: permError } = await supabase
      .from('profiles')
      .select('permissions, task_delete_permission')
      .eq('id', data.user.id)
      .single()
    if (!permError && extProfile) {
      permissions = (extProfile.permissions as Permission[]) || []
      task_delete_permission = extProfile.task_delete_permission || false
    }

    // Log login history for IMS users (fire and forget)
    const imsRoles = ['admin','super_admin','branch_manager','marketing_staff','academic_staff','finance_officer','hr_officer','staff']
    if (profile && imsRoles.includes(profile.role)) {
      // Fetch public IP address
      let ipAddress: string | null = null
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
        if (ipRes.ok) {
          const ipData = await ipRes.json()
          ipAddress = ipData.ip || null
        }
      } catch { /* IP lookup failed, continue without it */ }

      supabase.from('ims_login_history').insert({
        user_id: data.user.id,
        user_name: profile.full_name,
        email: data.user.email,
        ip_address: ipAddress,
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }).then(res => { if (res.error) console.error(res.error) })
    }

    // Update last_active (fire and forget)
    supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', data.user.id).then(res => { if (res.error) console.error(res.error) })

    if (!profile) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, email: data.user.email!, full_name: data.user.user_metadata?.full_name || email, role: 'student', is_active: true },
        { onConflict: 'id', ignoreDuplicates: false },
      )
      // Intentionally ignoring error for basic upsert failure

      return { user: { id: data.user.id, name: data.user.user_metadata?.full_name || email, email: data.user.email!, role: 'student', permissions: [] }, error: null }
    }

    return {
      user: {
        id: data.user.id,
        name: profile.full_name || email,
        email: data.user.email!,
        role: (profile.role as UserRole) || 'student',
        position: profile.position,
        department: profile.department,
        access_level: profile.access_level,
        disabled: profile.disabled,
        permissions,
        task_delete_permission,
        created_at: profile.created_at,
        last_active: profile.last_active,
      },
      error: null,
    }
  } catch (err) {
    console.error('signIn unexpected error:', err)
    return { user: null, error: 'An unexpected error occurred' }
  }
}

export async function signOut(): Promise<void> {
  await getClient().auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = getClient()
    // Use getSession() instead of getUser() - reads from localStorage, no browser lock
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return null

    // Fetch basic profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, position, department, access_level, disabled, created_at, last_active')
      .eq('id', user.id)
      .single()

    if (profile?.disabled) return null

    // Try permissions columns (may not exist if migrations not run)
    let permissions: Permission[] = []
    let task_delete_permission = false
    const { data: extProfile, error: permError } = await supabase
      .from('profiles')
      .select('permissions, task_delete_permission')
      .eq('id', user.id)
      .single()
    if (!permError && extProfile) {
      permissions = (extProfile.permissions as Permission[]) || []
      task_delete_permission = extProfile.task_delete_permission || false
    }

    return {
      id: user.id,
      name: profile?.full_name || user.user_metadata?.full_name || user.email!,
      email: user.email!,
      role: (profile?.role as UserRole) || 'student',
      position: profile?.position,
      department: profile?.department,
      access_level: profile?.access_level,
      permissions,
      task_delete_permission,
      created_at: profile?.created_at,
      last_active: profile?.last_active,
    }
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return null
  }
}

export async function getProfile(userId: string) {
  const { data } = await getClient().from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export function isIMSRole(role: UserRole): boolean {
  const imsRoles: UserRole[] = ['super_admin','branch_manager','marketing_staff','academic_staff','finance_officer','hr_officer','staff']
  return imsRoles.includes(role)
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin' || isIMSRole(role)
}

/**
 * Check if a user has a permission, considering role base + granted extras.
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return _hasPermission(user.role, user.permissions || [], permission)
}

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'student': return '/dashboard'
    case 'admin':
    case 'super_admin':
    case 'branch_manager': return '/admin'
    case 'marketing_staff': return '/admin/ims/marketing'
    case 'academic_staff': return '/admin/ims/academic'
    case 'finance_officer': return '/admin/ims/finance'
    case 'hr_officer': return '/admin/ims/hr'
    case 'staff': return '/admin/ims/dashboard'
    case 'academic_manager': return '/admin'
    case 'trainer': return '/admin/attendance'
    case 'coordinator': return '/admin/enrollments'
    default: return '/dashboard'
  }
}
