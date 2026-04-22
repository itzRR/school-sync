"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarDays, CheckCircle, XCircle, Clock } from "lucide-react"
import { getBatches, getAttendanceByBatch } from "@/lib/data"

export default function AttendancePage() {
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getBatches(true).then(setBatches) }, [])

  useEffect(() => {
    if (!selectedBatch) return
    setIsLoading(true)
    getAttendanceByBatch(selectedBatch, selectedDate)
      .then(setAttendance)
      .finally(() => setIsLoading(false))
  }, [selectedBatch, selectedDate])

  const stats = {
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.status === "late").length,
    total: attendance.length,
  }

  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  const statusColor = (s: string) =>
    s === "present" ? "bg-green-100 text-green-800" :
    s === "late"    ? "bg-yellow-100 text-yellow-800" :
    s === "excused" ? "bg-blue-100 text-blue-800" :
    "bg-red-100 text-red-800"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">View and manage daily attendance records with manual / biometric source tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Batch</Label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Choose a batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} — {b.courses?.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {selectedBatch && attendance.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Present", value: stats.present, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "Absent",  value: stats.absent,  icon: XCircle,     color: "text-red-600",   bg: "bg-red-50" },
            { label: "Late",    value: stats.late,    icon: Clock,       color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Attendance %", value: `${pct}%`, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(stat => (
            <Card key={stat.label} className={stat.bg}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Attendance Records {selectedDate && `— ${selectedDate}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedBatch ? (
            <p className="text-center text-gray-400 py-12">Select a batch to view attendance</p>
          ) : isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : attendance.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No attendance records for {selectedDate}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Entry Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{record.enrollments?.profiles?.full_name || "—"}</td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{record.enrollments?.profiles?.student_id || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{record.date}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColor(record.status)}>{record.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{record.entry_method || "manual"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{record.notes || "—"}</td>
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
