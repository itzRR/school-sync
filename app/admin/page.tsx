"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, BookOpen, CalendarDays, UserCheck, ClipboardList,
  Award, ArrowUpRight, TrendingUp, BarChart3
} from "lucide-react"
import { getDashboardStats } from "@/lib/data"
import { formatCurrency, formatDateTime } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError("Failed to load stats"))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return <div className="text-red-500 p-4">{error || "No data available"}</div>
  }

  const statCards = [
    { title: "Total Students",   value: stats.totalStudents.toString(),    icon: Users,         color: "text-blue-600",   bgColor: "bg-blue-100",   href: "/admin/students" },
    { title: "Active Courses",   value: stats.totalCourses.toString(),     icon: BookOpen,      color: "text-purple-600", bgColor: "bg-purple-100", href: "/admin/courses" },
    { title: "Active Batches",   value: stats.totalBatches.toString(),     icon: CalendarDays,  color: "text-cyan-600",   bgColor: "bg-cyan-100",   href: "/admin/batches" },
    { title: "Trainers",         value: stats.totalTrainers.toString(),    icon: UserCheck,     color: "text-orange-600", bgColor: "bg-orange-100", href: "/admin/trainers" },
    { title: "Total Enrollments",value: stats.totalEnrollments.toString(), icon: ClipboardList, color: "text-green-600",  bgColor: "bg-green-100",  href: "/admin/enrollments" },
    { title: "Certificates",     value: stats.certificatesIssued.toString(),icon: Award,        color: "text-yellow-600", bgColor: "bg-yellow-100", href: "/admin/certificates" },
    { title: "Total Revenue",    value: formatCurrency(stats.totalRevenue),icon: TrendingUp,    color: "text-emerald-600",bgColor: "bg-emerald-100",href: "/admin/reports" },
    { title: "Attendance Rate",  value: `${stats.attendanceRate}%`,        icon: BarChart3,     color: "text-rose-600",   bgColor: "bg-rose-100",   href: "/admin/attendance" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ASMS Dashboard</h1>
          <p className="text-gray-600 mt-1">CADD Centre Lanka — Academic & Student Management System</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild><Link href="/admin/students">Add Student</Link></Button>
          <Button asChild><Link href="/admin/batches">Manage Batches</Link></Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link href={stat.href} key={i}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600 ml-1">Live</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyRevenue.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-16">{month.month}</span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max((month.revenue / (Math.max(...stats.monthlyRevenue.map(m => m.revenue)) || 1)) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-28 text-right">{formatCurrency(month.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Enrollments
              <Button variant="ghost" size="sm" asChild><Link href="/admin/enrollments">View All</Link></Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEnrollments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No enrollments yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentEnrollments.slice(0, 6).map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {enrollment.profiles?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {enrollment.courses?.title || "Unknown course"}
                        {enrollment.batches?.name ? ` · ${enrollment.batches.name}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900">{formatCurrency(enrollment.amount_paid)}</p>
                      <Badge className={`text-xs mt-1 ${
                        enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        enrollment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{enrollment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Lifecycle Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Student Lifecycle Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { step: "1", label: "Registration",       href: "/admin/students" },
              { step: "2", label: "Course Enrollment",  href: "/admin/enrollments" },
              { step: "3", label: "Batch Allocation",   href: "/admin/batches" },
              { step: "4", label: "Module Learning",    href: "/admin/modules" },
              { step: "5", label: "Attendance",         href: "/admin/attendance" },
              { step: "6", label: "Assessment",         href: "/admin/assessments" },
              { step: "7", label: "Certification",      href: "/admin/certificates" },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-center gap-2">
                <Link href={item.href}>
                  <div className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      {item.step}
                    </span>
                    {item.label}
                  </div>
                </Link>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollment Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Batch</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEnrollments.map((e: any) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{e.profiles?.full_name || "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{e.profiles?.student_id || "—"}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{e.courses?.title || "—"}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{e.batches?.name || "—"}</td>
                    <td className="py-3 px-4 font-semibold">{formatCurrency(e.amount_paid)}</td>
                    <td className="py-3 px-4">
                      <Badge className={
                        e.status === "completed" ? "bg-green-100 text-green-800" :
                        e.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }>{e.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDateTime(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
