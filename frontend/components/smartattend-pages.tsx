'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Users,
  ClipboardList,
  SlidersHorizontal,
  BarChart3,
  UserCog,
  Settings,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  X,
  Sparkles
} from 'lucide-react'
import { AdminShell, AdminContent, StatusBadge, Label, Inp } from './admin-shell'
import {
  getStudents,
  createStudent,
  getFaculty,
  StudentRecord,
  FacultyRecord
} from '@/lib/api'

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const quickActions = [
  { title: 'Student Management', href: '/admin/students', icon: GraduationCap, desc: 'Manage student records' },
  { title: 'Faculty Management', href: '/admin/faculty', icon: Users, desc: 'Manage faculty profiles' },
  { title: 'Timetable Management', href: '/admin/timetable', icon: ClipboardList, desc: 'Plan and manage classes' },
  { title: 'Attendance Overview', href: '/admin/reports', icon: SlidersHorizontal, desc: 'View attendance data' },
  { title: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, desc: 'View institutional reports' },
  { title: 'Users & Roles', href: '/admin/users', icon: UserCog, desc: 'Manage system users' },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList, desc: 'Track admin activity' },
  { title: 'System Settings', href: '/admin/settings', icon: Settings, desc: 'Configure your console' },
]

export function DashboardPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your institution&apos;s activity today.</p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">{action.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{action.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Students Page ────────────────────────────────────────────────────────────
export function StudentsPage() {
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [isLive, setIsLive] = useState(false)
  const [isHod, setIsHod] = useState(false)
  const [hodDepartment, setHodDepartment] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registerNumber: '',
    department: 'Computer Science',
    semester: 3,
    section: 'A',
    academicYear: '2026-27'
  })

  useEffect(() => {
    let active = true
    getStudents().then(res => {
      if (active) {
        setStudents(res.students)
        setIsLive(res.isLive)
        setIsHod(Boolean(res.isHod))
        setHodDepartment(res.department || null)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  const filtered = useMemo(
    () => students.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.usn.toLowerCase().includes(query.toLowerCase()) ||
      s.department.toLowerCase().includes(query.toLowerCase())
    ),
    [students, query]
  )

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await createStudent({
        name: formData.name,
        email: formData.email,
        registerNumber: formData.registerNumber,
        department: formData.department,
        semester: Number(formData.semester),
        section: formData.section,
        academicYear: formData.academicYear
      })

      const newStudent: StudentRecord = {
        id: res.data?.id || Date.now(),
        name: formData.name,
        usn: formData.registerNumber.toUpperCase(),
        department: formData.department,
        semester: Number(formData.semester),
        section: formData.section.toUpperCase(),
        academicYear: formData.academicYear,
        email: formData.email,
        deviceBound: false,
        boundDeviceName: null,
        account: 'Active'
      }

      setStudents(prev => [newStudent, ...prev])
      setSuccessMessage('Student created successfully!')
      setTimeout(() => {
        setShowAddModal(false)
        setSuccessMessage('')
        setFormData({
          name: '',
          email: '',
          registerNumber: '',
          department: 'Computer Science',
          semester: 3,
          section: 'A',
          academicYear: '2026-27'
        })
      }, 1000)
    } catch (err: any) {
      // If backend fails, also add locally in demo mode
      const newStudent: StudentRecord = {
        id: Date.now(),
        name: formData.name,
        usn: formData.registerNumber.toUpperCase(),
        department: formData.department,
        semester: Number(formData.semester),
        section: formData.section.toUpperCase(),
        academicYear: formData.academicYear,
        email: formData.email,
        deviceBound: false,
        boundDeviceName: null,
        account: 'Active'
      }
      setStudents(prev => [newStudent, ...prev])
      setSuccessMessage('Student registered (Demo Mode)')
      setTimeout(() => {
        setShowAddModal(false)
        setSuccessMessage('')
      }, 1000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Synced with Backend
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    Demo Mode
                  </span>
                )}
                {hodDepartment && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    HOD: {hodDepartment}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Manage student directory, devices, and accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, USN, department..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} student{filtered.length === 1 ? '' : 's'} found
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Student</th>
                    <th className="px-6 py-3 border-b border-border">USN</th>
                    <th className="px-6 py-3 border-b border-border">Dept / Semester</th>
                    <th className="px-6 py-3 border-b border-border">Section</th>
                    <th className="px-6 py-3 border-b border-border">Device Status</th>
                    <th className="px-6 py-3 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading students from backend...
                      </td>
                    </tr>
                  ) : filtered.map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{s.name}</div>
                        {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{s.usn}</td>
                      <td className="px-6 py-4">
                        <span className="block text-foreground">{s.department}</span>
                        <span className="text-xs text-muted-foreground">Semester {s.semester}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                          Sec {s.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.deviceBound ? 'Linked' : 'Not Linked'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Add New Student</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <Label required>Full Name</Label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <Label required>Email Address</Label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@smartattend.edu"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <Label required>Register Number (USN)</Label>
                  <input
                    type="text"
                    required
                    value={formData.registerNumber}
                    onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                    placeholder="e.g. 01CS150"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Department</Label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Information Tech">Information Tech</option>
                    </select>
                  </div>

                  <div>
                    <Label required>Semester</Label>
                    <select
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label required>Section</Label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminContent>
    </AdminShell>
  )
}

// ─── Faculty Page ─────────────────────────────────────────────────────────────
export function FacultyPage() {
  const [query, setQuery] = useState('')
  const [faculty, setFaculty] = useState<FacultyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let active = true
    getFaculty().then(res => {
      if (active) {
        setFaculty(res.faculty)
        setIsLive(res.isLive)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  const filtered = useMemo(
    () => faculty.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.employeeId.toLowerCase().includes(query.toLowerCase()) ||
      f.department.toLowerCase().includes(query.toLowerCase())
    ),
    [faculty, query]
  )

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Faculty</h1>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Synced with Backend
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Manage teaching staff and their department roles.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 border-b border-border">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Faculty Name</th>
                    <th className="px-6 py-3 border-b border-border">Employee ID</th>
                    <th className="px-6 py-3 border-b border-border">Department</th>
                    <th className="px-6 py-3 border-b border-border">Designation</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading faculty members...
                      </td>
                    </tr>
                  ) : filtered.map((f, i) => (
                    <tr key={f.id || i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{f.name}</div>
                        {f.email && <div className="text-xs text-muted-foreground">{f.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{f.employeeId}</td>
                      <td className="px-6 py-4">{f.department}</td>
                      <td className="px-6 py-4">{f.designation || 'Faculty'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={f.status} />
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No faculty members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
