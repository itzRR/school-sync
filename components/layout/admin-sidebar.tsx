"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, BookOpen, Users, LogOut, ChevronLeft, ChevronRight,
  Home, MessageSquare, GraduationCap, CalendarDays, ClipboardList,
  Award, FileText, FolderOpen, UserCheck, BarChart3, Layers, PhoneCall,
  Building2, TrendingUp, DollarSign, UserCog, ListTodo, Calendar,
  Terminal, ChevronDown, ChevronUp, Megaphone, ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"
import { hasPermission, ROLE_BASE_PERMISSIONS } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

const asmsNavigation = [
  { name: "Dashboard",     href: "/admin",             icon: LayoutDashboard },
  { name: "Leads",         href: "/admin/leads",       icon: PhoneCall },
  { name: "Students",      href: "/admin/students",    icon: Users },
  { name: "Courses",       href: "/admin/courses",     icon: BookOpen },
  { name: "Modules",       href: "/admin/modules",     icon: Layers },
  { name: "Batches",       href: "/admin/batches",     icon: CalendarDays },
  { name: "Trainers",      href: "/admin/trainers",    icon: UserCheck },
  { name: "Enrollments",   href: "/admin/enrollments", icon: ClipboardList },
  { name: "Attendance",    href: "/admin/attendance",  icon: CalendarDays },
  { name: "Assessments",   href: "/admin/assessments", icon: FileText },
  { name: "Certificates",  href: "/admin/certificates",icon: Award },
  { name: "Resources",     href: "/admin/resources",   icon: FolderOpen },
  { name: "Reports",       href: "/admin/reports",     icon: BarChart3 },
  { name: "Messages",      href: "/admin/messages",    icon: MessageSquare },
]

// Each IMS nav item maps to a required permission key
const imsNavigationDefs: Array<{
  name: string
  href: string
  icon: React.ElementType
  permission: Permission
}> = [
  { name: "IMS Overview",   href: "/admin/ims",                 icon: Building2,      permission: "ims_overview" },
  { name: "Marketing",      href: "/admin/ims/marketing",       icon: Megaphone,      permission: "ims_marketing" },
  { name: "Academic Ops",   href: "/admin/ims/academic",        icon: GraduationCap,  permission: "ims_academic" },
  { name: "Finance",        href: "/admin/ims/finance",         icon: DollarSign,     permission: "ims_finance" },
  { name: "HR",             href: "/admin/ims/hr",              icon: UserCog,        permission: "ims_hr" },
  { name: "Staff Users",    href: "/admin/ims/users",           icon: Users,          permission: "ims_users" },
  { name: "Tasks",          href: "/admin/ims/tasks",           icon: ListTodo,       permission: "ims_tasks" },
  { name: "Roster",         href: "/admin/ims/roster",          icon: Calendar,       permission: "ims_roster" },
  { name: "Control Panel",  href: "/admin/ims/control-panel",   icon: Terminal,       permission: "ims_control_panel" },
]

const imsOnlyRoles = ['marketing_staff', 'academic_staff', 'finance_officer', 'hr_officer', 'staff']

interface AdminSidebarProps {
  currentUser?: AuthUser
}

export function AdminSidebar({ currentUser }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [imsExpanded, setImsExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const userRole = currentUser?.role || 'admin'
  const userPermissions = currentUser?.permissions || []
  const isIMSOnly = imsOnlyRoles.includes(userRole)

  // ASMS shown if user has asms_full permission OR is a full admin / academic role
  const showASMS = hasPermission(userRole, userPermissions, 'asms_full') ||
    ['admin', 'super_admin', 'branch_manager', 'academic_manager', 'trainer', 'coordinator'].includes(userRole)

  // IMS section shown if they have any IMS permission
  const showIMS = !['student', 'trainer', 'coordinator'].includes(userRole) ||
    userPermissions.some(p => p.startsWith('ims_'))

  const handleLogout = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" :
    href === "/admin/ims" ? pathname === "/admin/ims" :
    pathname.startsWith(href)

  // Show IMS nav item if user has the required permission (via role base or granted extra)
  const canSeeImsItem = (permission: Permission) =>
    hasPermission(userRole, userPermissions, permission)

  const visibleImsItems = imsNavigationDefs.filter(item => canSeeImsItem(item.permission))

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#0A1A2F] text-white transition-all duration-300 flex-shrink-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
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
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">

        {/* ASMS Section */}
        {showASMS && (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-1">
                Academic System
              </p>
            )}
            {asmsNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/10",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && item.name}
              </Link>
            ))}
          </>
        )}

        {/* IMS Section */}
        {showIMS && visibleImsItems.length > 0 && (
          <>
            {!collapsed && (
              <button
                onClick={() => setImsExpanded(!imsExpanded)}
                className="w-full flex items-center justify-between px-3 mb-1 mt-4"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Institute Mgmt
                </p>
                {imsExpanded
                  ? <ChevronUp className="h-3 w-3 text-gray-500" />
                  : <ChevronDown className="h-3 w-3 text-gray-500" />
                }
              </button>
            )}
            {(imsExpanded || collapsed) && visibleImsItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/10",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Info + Bottom Actions */}
      <div className="p-3 border-t border-white/10 space-y-1">
        {!collapsed && currentUser && (
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
            href="/"
            title={collapsed ? "View Site" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all",
              collapsed && "justify-center"
            )}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            {!collapsed && "View Site"}
          </Link>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-600/20 transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  )
}
