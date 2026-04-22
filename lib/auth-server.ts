import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { AuthUser } from './auth'
import type { UserRole } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Middleware handles refresh for server-rendered requests.
        }
      },
    },
  })
}

export async function getServerCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

    return {
      id: user.id,
      name: profile?.full_name || user.user_metadata?.full_name || user.email!,
      email: user.email!,
      role: (profile?.role as UserRole) || 'student',
      permissions: [],
    }
  } catch (err) {
    console.error('getServerCurrentUser error:', err)
    return null
  }
}
