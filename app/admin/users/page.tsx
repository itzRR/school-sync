"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search } from "lucide-react"
import { getUsers, updateUserRole, toggleUserActive } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"

const ROLES = ['admin','academic_manager','trainer','student','coordinator'] as const

const ROLE_COLORS: Record<string, string> = {
  admin:            "bg-red-100 text-red-800",
  academic_manager: "bg-purple-100 text-purple-800",
  trainer:          "bg-blue-100 text-blue-800",
  student:          "bg-green-100 text-green-800",
  coordinator:      "bg-orange-100 text-orange-800",
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUsers().then(data => { setUsers(data); setFiltered(data) }).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    let list = users
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter)
    setFiltered(list.filter(u =>
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.student_id || "").toLowerCase().includes(q)
    ))
  }, [search, roleFilter, users])

  const changeRole = async (id: string, role: string) => {
    await updateUserRole(id, role)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const toggleActive = async (id: string, current: boolean) => {
    await toggleUserActive(id, !current)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage all system users and their roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> All Users ({filtered.length})</CardTitle>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No users found</td></tr>
                  ) : filtered.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.full_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{user.student_id || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge className={ROLE_COLORS[user.role] || "bg-gray-100 text-gray-800"}>
                          {user.role?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(user.created_at)}</td>
                      <td className="py-3 px-4 flex gap-2 flex-wrap">
                        <select
                          className="text-xs border rounded px-2 py-1"
                          value={user.role}
                          onChange={e => changeRole(user.id, e.target.value)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                        </select>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(user.id, user.is_active)}>
                          {user.is_active ? "Deactivate" : "Activate"}
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
