"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDays, Search, Plus } from "lucide-react"
import { getBatches } from "@/lib/data"

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getBatches(false).then(data => {
      setBatches(data)
      setFiltered(data)
    }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(batches.filter(b =>
      (b.name || "").toLowerCase().includes(q) ||
      (b.courses?.title || "").toLowerCase().includes(q) ||
      (b.mode || "").toLowerCase().includes(q)
    ))
  }, [search, batches])

  const modeColor = (mode: string) => {
    if (mode === "online") return "bg-blue-100 text-blue-800"
    if (mode === "hybrid") return "bg-purple-100 text-purple-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-600 mt-1">Manage batch scheduling, timetables and trainer allocation</p>
        </div>
        <Button asChild>
          <Link href="/admin/batches/new"><Plus className="h-4 w-4 mr-2" /> New Batch</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            All Batches ({filtered.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search batches..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Batch Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Mode</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Seats</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Enrolled</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-500">No batches found</td></tr>
                  ) : filtered.map(batch => (
                    <tr key={batch.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{batch.name}</td>
                      <td className="py-3 px-4 text-gray-600">{batch.courses?.title || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge className={modeColor(batch.mode)}>{batch.mode}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-[160px] truncate">{batch.schedule}</td>
                      <td className="py-3 px-4 text-gray-600">{batch.start_date}</td>
                      <td className="py-3 px-4 text-center">{batch.seats}</td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-700">{batch.enrolled_count}</td>
                      <td className="py-3 px-4">
                        <Badge className={batch.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {batch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/batches/${batch.id}/edit`}>Edit</Link>
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
