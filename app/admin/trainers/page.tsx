"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserCheck, Search, UserPlus } from "lucide-react"
import { getTrainerPerformance, toggleUserActive } from "@/lib/data"

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getTrainerPerformance().then(data => {
      setTrainers(data)
      setFiltered(data)
    }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(trainers.filter(t =>
      (t.full_name || "").toLowerCase().includes(q) ||
      (t.specialization || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q)
    ))
  }, [search, trainers])

  const toggleActive = async (id: string, current: boolean) => {
    await toggleUserActive(id, !current)
    setTrainers(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-600 mt-1">Manage trainer profiles and course assignments</p>
        </div>
        <Button><UserPlus className="h-4 w-4 mr-2" /> Add Trainer</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            All Trainers ({filtered.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search trainers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Specialization</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Assigned</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Performance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No trainers found</td></tr>
                  ) : filtered.map(trainer => (
                    <tr key={trainer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{trainer.full_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{trainer.email}</td>
                      <td className="py-3 px-4 text-gray-600">{trainer.phone || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{trainer.specialization || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{trainer.assigned_batches || 0} batches · {trainer.assigned_modules || 0} modules</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">Attendance {trainer.attendance_rate || 0}%{trainer.average_score != null ? ` · Avg ${trainer.average_score}` : ""}</td>
                      <td className="py-3 px-4">
                        <Badge className={trainer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {trainer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" onClick={() => toggleActive(trainer.id, trainer.is_active)}>
                          {trainer.is_active ? "Deactivate" : "Activate"}
                        </Button>
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
