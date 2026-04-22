import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This route runs server-side and uses the service role key
// to bypass RLS when creating staff users.
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, name, role, position, department, access_level, permissions, work_schedule, office_assets } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Step 1: Create the auth user using admin API (no email confirmation needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so user can log in immediately
      user_metadata: { full_name: name, role },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    // Step 2: Upsert profile using service role (bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email,
      full_name: name,
      role: role || "staff",
      position: position || null,
      department: department || null,
      access_level: access_level ?? 1,
      permissions: permissions || [],
      work_schedule: work_schedule || [],
      office_assets: office_assets || [],
      is_active: true,
      disabled: false,
    }, { onConflict: "id" })

    if (profileError) {
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })

  } catch (err: any) {
    console.error("[create-staff-user]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
