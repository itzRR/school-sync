"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, Search } from "lucide-react"
import { getEnrollments, updateEnrollmentStatus } from "@/lib/data"
import { formatCurrency, formatDateTime } from "@/lib/utils"

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getEnrollments().then(data => {
      setEnrollments(data)
      setFiltered(data)
    }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    let list = enrollments
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter)
    setFiltered(list.filter(e =>
      (e.profiles?.full_name || "").toLowerCase().includes(q) ||
      (e.profiles?.student_id || "").toLowerCase().includes(q) ||
      (e.courses?.title || "").toLowerCase().includes(q)
    ))
  }, [search, statusFilter, enrollments])

  const changeStatus = async (id: string, status: string) => {
    await updateEnrollmentStatus(id, status)
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  const statusColor = (s: string) =>
    s === "completed" ? "bg-green-100 text-green-800" :
    s === "confirmed" ? "bg-blue-100 text-blue-800" :
    s === "cancelled" ? "bg-red-100 text-red-800" :
    "bg-yellow-100 text-yellow-800"

  const paymentColor = (s: string) =>
    s === "paid" ? "bg-green-100 text-green-800" :
    s === "pending" ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enrollments</h1>
        <p className="text-gray-600 mt-1">View and manage all student course enrollments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> All Enrollments ({filtered.length})
          </CardTitle>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search by student name, ID or course..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Batch</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Enrolled</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-500">No enrollments found</td></tr>
                  ) : filtered.map(e => (
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{e.profiles?.full_name || "—"}</td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{e.profiles?.student_id || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{e.courses?.title || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{e.batches?.name || "—"}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(e.amount_paid)}</td>
                      <td className="py-3 px-4">
                        <Badge className={paymentColor(e.payment_status)}>{e.payment_status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColor(e.status)}>{e.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(e.created_at)}</td>
                      <td className="py-3 px-4">
                        <select
                          className="text-xs border rounded px-2 py-1"
                          value={e.status}
                          onChange={ev => changeStatus(e.id, ev.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
