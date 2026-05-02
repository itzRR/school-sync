"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, BookOpen, Users, LogOut, ChevronLeft, ChevronRight,
  Home, MessageSquare, GraduationCap, CalendarDays, ClipboardList,
  Award, FileText, FolderOpen, UserCheck, BarChart3, Layers, PhoneCall,
  Building2, TrendingUp, DollarSign, UserCog, ListTodo, Calendar,
  Terminal, ChevronDown, ChevronUp, Megaphone, ShieldCheck, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"
import { hasPermission, ROLE_BASE_PERMISSIONS } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

/* ─── Grouped Academic System Navigation ─── */
interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const asmsGroups: NavGroup[] = [
  {
    label: "People",
    icon: Users,
    items: [
      { name: "Leads",      href: "/admin/leads",    icon: PhoneCall },
      { name: "Students",   href: "/admin/students", icon: Users },
      { name: "Trainers",   href: "/admin/trainers", icon: UserCheck },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    items: [
      { name: "Courses",     href: "/admin/courses",     icon: BookOpen },
      { name: "Modules",     href: "/admin/modules",     icon: Layers },
      { name: "Batches",     href: "/admin/batches",     icon: CalendarDays },
      { name: "Enrollments", href: "/admin/enrollments", icon: ClipboardList },
    ],
  },
  {
    label: "Operations",
    icon: ClipboardList,
    items: [
      { name: "Attendance",   href: "/admin/attendance",   icon: CalendarDays },
      { name: "Assessments",  href: "/admin/assessments",  icon: FileText },
      { name: "Certificates", href: "/admin/certificates", icon: Award },
      { name: "Resources",    href: "/admin/resources",    icon: FolderOpen },
    ],
  },
  {
    label: "Insights",
    icon: BarChart3,
    items: [
      { name: "Reports",  href: "/admin/reports",  icon: BarChart3 },
      { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    ],
  },
]

/* ─── IMS Navigation ─── */
const imsNavigationDefs: Array<{
  name: string
  href: string
  icon: React.ElementType
  permission: Permission
}> = [
  { name: "IMS Overview",  href: "/admin/ims",               icon: Building2,     permission: "ims_overview" },
  { name: "Marketing",     href: "/admin/ims/marketing",     icon: Megaphone,     permission: "ims_marketing" },
  { name: "Academic Ops",  href: "/admin/ims/academic",      icon: GraduationCap, permission: "ims_academic" },
  { name: "Finance",       href: "/admin/ims/finance",       icon: DollarSign,    permission: "ims_finance" },
  { name: "HR",            href: "/admin/ims/hr",            icon: UserCog,       permission: "ims_hr" },
  { name: "Staff Users",   href: "/admin/ims/users",         icon: Users,         permission: "ims_users" },
  { name: "Tasks",         href: "/admin/ims/tasks",         icon: ListTodo,      permission: "ims_tasks" },
  { name: "Roster",        href: "/admin/ims/roster",        icon: Calendar,      permission: "ims_roster" },
  { name: "Control Panel", href: "/admin/ims/control-panel", icon: Terminal,      permission: "ims_control_panel" },
]

const imsOnlyRoles = ['marketing_staff', 'academic_staff', 'finance_officer', 'hr_officer', 'staff']

/* ─── Helpers ─── */
function findActiveGroup(groups: NavGroup[], pathname: string): string | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (pathname.startsWith(item.href)) return g.label
    }
  }
  return null
}

/* ─── Component ─── */
interface AdminSidebarProps {
  currentUser?: AuthUser
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
}

export function AdminSidebar({ currentUser, mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Auto-expand the group that contains the active page
  const activeGroup = findActiveGroup(asmsGroups, pathname)
  const imsActive = pathname.startsWith("/admin/ims")

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    asmsGroups.forEach(g => { init[g.label] = g.label === activeGroup })
    init["Institute Mgmt"] = imsActive
    return init
  })

  // Keep active group expanded when navigating
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev }
      if (activeGroup) next[activeGroup] = true
      next["Institute Mgmt"] = imsActive
      return next
    })
  }, [activeGroup, imsActive])

  const userRole = currentUser?.role || 'admin'
  const userPermissions = currentUser?.permissions || []
  const isIMSOnly = imsOnlyRoles.includes(userRole)

  const showASMS = hasPermission(userRole, userPermissions, 'asms_full') ||
    ['admin', 'super_admin', 'branch_manager', 'academic_manager', 'trainer', 'coordinator'].includes(userRole)

  const showIMS = !['student', 'trainer', 'coordinator'].includes(userRole) ||
    userPermissions.some(p => p.startsWith('ims_'))

  const canSeeImsItem = (permission: Permission) =>
    hasPermission(userRole, userPermissions, permission)

  const isAdminRole = ['admin', 'super_admin', 'branch_manager'].includes(userRole)

  const visibleImsItems = imsNavigationDefs.filter(item => {
    if (!canSeeImsItem(item.permission)) return false
    // Admins only see Overview, Staff Users, Tasks, Roster, Control Panel in the sidebar
    if (isAdminRole && ['ims_marketing', 'ims_academic', 'ims_finance', 'ims_hr'].includes(item.permission)) {
      return false
    }
    return true
  })

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" :
    href === "/admin/ims" ? pathname === "/admin/ims" :
    pathname.startsWith(href)

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  /* ─── Collapsed icon-only view: show group icon as a divider ─── */
  if (collapsed) {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen?.(false)} />
        )}
        <div className={cn(
          "flex flex-col h-full bg-[#0A1A2F] text-white transition-all duration-300 flex-shrink-0 w-16",
          "fixed md:static inset-y-0 left-0 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
        {/* Logo */}
        <div className="flex items-center justify-center p-4 border-b border-white/10">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Dashboard */}
          {showASMS && (
            <Link
              href="/admin"
              title="Dashboard"
              className={cn(
                "flex items-center justify-center p-2.5 rounded-xl text-sm font-medium transition-all",
                isActive("/admin") ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          )}

          {/* Grouped ASMS */}
          {showASMS && asmsGroups.map(group => (
            <div key={group.label}>
              <div className="flex items-center justify-center py-2 mt-1">
                <div className="w-6 h-px bg-white/10" />
              </div>
              {group.items.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(item.href) ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ))}

          {/* IMS collapsed */}
          {showIMS && visibleImsItems.length > 0 && (
            <div>
              <div className="flex items-center justify-center py-2 mt-1">
                <div className="w-6 h-px bg-emerald-500/30" />
              </div>
              {visibleImsItems.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(item.href) ? "bg-emerald-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10 space-y-0.5">
          {!isIMSOnly && (
            <Link
              href="/"
              title="View Site"
              className="flex items-center justify-center p-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Home className="h-4 w-4" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-600/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      </>
    )
  }

  /* ─── Full expanded sidebar ─── */
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen?.(false)} />
      )}
      <div className={cn(
        "flex flex-col h-full bg-[#0A1A2F] text-white transition-all duration-300 flex-shrink-0 w-64",
        "fixed md:static inset-y-0 left-0 z-50",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm leading-none">CADD Centre</span>
            <p className="text-xs text-gray-400">
              {isIMSOnly ? "IMS Portal" : "Admin Panel"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 sidebar-nav">

        {/* Dashboard - always top-level */}
        {showASMS && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive("/admin")
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            Dashboard
          </Link>
        )}

        {/* ASMS Grouped sections */}
        {showASMS && asmsGroups.map(group => {
          const isGroupExpanded = expandedGroups[group.label] ?? false
          const hasActive = group.items.some(item => isActive(item.href))

          return (
            <div key={group.label} className="mt-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                  hasActive && !isGroupExpanded
                    ? "text-blue-400 bg-blue-600/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <group.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{group.label}</span>
                  {hasActive && !isGroupExpanded && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-gray-500 transition-transform duration-200",
                  isGroupExpanded && "rotate-180"
                )} />
              </button>

              {/* Expandable items */}
              <div className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                isGroupExpanded ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0"
              )}>
                <div className="ml-3 pl-3 border-l border-white/5 space-y-0.5">
                  {group.items.map(item => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                        isActive(item.href)
                          ? "bg-blue-600 text-white shadow-md font-medium"
                          : "text-gray-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* IMS Section - collapsible group */}
        {showIMS && visibleImsItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <button
              onClick={() => toggleGroup("Institute Mgmt")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                imsActive
                  ? "text-emerald-400 bg-emerald-600/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>Institute Mgmt</span>
                {imsActive && !expandedGroups["Institute Mgmt"] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-gray-500 transition-transform duration-200",
                expandedGroups["Institute Mgmt"] && "rotate-180"
              )} />
            </button>

            <div className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              expandedGroups["Institute Mgmt"] ? "max-h-[500px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
            )}>
              <div className="ml-3 pl-3 border-l border-emerald-500/10 space-y-0.5">
                {visibleImsItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                      isActive(item.href)
                        ? "bg-emerald-600 text-white shadow-md font-medium"
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* User Info + Bottom Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        {currentUser && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 capitalize">{currentUser.role.replace(/_/g, ' ')}</p>
            {/* Show extra permission badges if any */}
            {(currentUser.permissions || []).length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">{currentUser.permissions.length} extra access</span>
              </div>
            )}
          </div>
        )}
        {!isIMSOnly && (
          <Link
            href="/admin/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              isActive("/admin/profile")
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            My Profile
          </Link>
        )}
        {!isIMSOnly && (
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            View Site
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-600/20 transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
    </>
  )
}
