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
  Sparkles,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Check,
  Smartphone,
  Key
} from 'lucide-react'
import { AdminShell, AdminContent, StatusBadge, Label, Inp } from './admin-shell'
import {
  getStudents,
  createStudent,
  getFaculty,
  previewImportStudents,
  commitImportStudents,
  previewAssignDivision,
  commitAssignDivision,
  AssignDivisionPreviewResult,
  StudentRecord,
  FacultyRecord,
  ImportPreviewResult,
  updateStudentAdmin,
  deleteStudentAdmin,
  getStudentDeviceAdmin,
  resetStudentDeviceAdmin,
  StudentDeviceDetail
} from '@/lib/api'

// Helper for USN range matching (handles alphanumeric prefixes, numeric suffixes, and lexicographical ranges)
function isUsnInRange(usn: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const sUsn = String(usn || '').trim().toUpperCase()
  const cFrom = String(from || '').trim().toUpperCase()
  const cTo = String(to || '').trim().toUpperCase()

  if (cFrom && cTo) {
    const isFromNum = /^\d+$/.test(cFrom)
    const isToNum = /^\d+$/.test(cTo)

    if (isFromNum && isToNum) {
      const match = sUsn.match(/(\d+)$/)
      if (match) {
        const usnNum = parseInt(match[1], 10)
        const fromNum = parseInt(cFrom, 10)
        const toNum = parseInt(cTo, 10)
        return usnNum >= fromNum && usnNum <= toNum
      }
    }

    const fromPrefix = cFrom.replace(/\d+$/, '')
    const toPrefix = cTo.replace(/\d+$/, '')
    const usnPrefix = sUsn.replace(/\d+$/, '')

    if (fromPrefix && fromPrefix === toPrefix && usnPrefix === fromPrefix) {
      const fromNumMatch = cFrom.match(/(\d+)$/)
      const toNumMatch = cTo.match(/(\d+)$/)
      const usnNumMatch = sUsn.match(/(\d+)$/)
      if (fromNumMatch && toNumMatch && usnNumMatch) {
        const usnNum = parseInt(usnNumMatch[1], 10)
        const fromNum = parseInt(fromNumMatch[1], 10)
        const toNum = parseInt(toNumMatch[1], 10)
        return usnNum >= fromNum && usnNum <= toNum
      }
    }

    return sUsn >= cFrom && sUsn <= cTo
  }

  if (cFrom && !cTo) {
    if (/^\d+$/.test(cFrom)) {
      const match = sUsn.match(/(\d+)$/)
      if (match) return parseInt(match[1], 10) >= parseInt(cFrom, 10)
    }
    return sUsn >= cFrom || sUsn.includes(cFrom)
  }

  if (!cFrom && cTo) {
    if (/^\d+$/.test(cTo)) {
      const match = sUsn.match(/(\d+)$/)
      if (match) return parseInt(match[1], 10) <= parseInt(cTo, 10)
    }
    return sUsn <= cTo
  }

  return true
}

function matchesDivision(studentSection: string | undefined, selectedDiv: string): boolean {
  if (!selectedDiv) return true
  const sSec = String(studentSection || '').trim().toUpperCase()
  const sel = selectedDiv.trim().toUpperCase()
  return sSec === sel || sSec === `SEC ${sel}` || sSec === `DIVISION ${sel}` || sSec === `DIV ${sel}`
}

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

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importYear, setImportYear] = useState<number>(3)
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  // USN Range & Division assignment state
  const [startUsn, setStartUsn] = useState('')
  const [endUsn, setEndUsn] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [checkingRange, setCheckingRange] = useState(false)
  const [showDivisionConfirmModal, setShowDivisionConfirmModal] = useState(false)
  const [divisionPreviewData, setDivisionPreviewData] = useState<AssignDivisionPreviewResult | null>(null)
  const [assigningDivision, setAssigningDivision] = useState(false)
  const [divisionActionMessage, setDivisionActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Actions menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<number | string | null>(null)

  // Global toast message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Update Student Modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updatingStudent, setUpdatingStudent] = useState<StudentRecord | null>(null)
  const [updateName, setUpdateName] = useState('')
  const [updateDeviceStatus, setUpdateDeviceStatus] = useState('Registered')
  const [updateSubmitting, setUpdateSubmitting] = useState(false)
  const [updateError, setUpdateError] = useState('')

  // Device Management Modal state
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [deviceStudent, setDeviceStudent] = useState<StudentRecord | null>(null)
  const [deviceDetail, setDeviceDetail] = useState<StudentDeviceDetail | null>(null)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [deviceResetting, setDeviceResetting] = useState(false)
  const [deviceMessage, setDeviceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete Student Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Close action menu on click outside
  useEffect(() => {
    const handleDocumentClick = () => setOpenActionMenuId(null)
    if (openActionMenuId !== null) {
      document.addEventListener('click', handleDocumentClick)
      return () => document.removeEventListener('click', handleDocumentClick)
    }
  }, [openActionMenuId])

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

  const handleOpenUpdateModal = (student: StudentRecord) => {
    setUpdatingStudent(student)
    setUpdateName(student.name || '')
    setUpdateDeviceStatus(student.deviceBound ? 'Registered' : 'Not Registered')
    setUpdateError('')
    setShowUpdateModal(true)
  }

  const handleSaveUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatingStudent) return
    const cleanName = updateName.trim()
    if (!cleanName) {
      setUpdateError('Student name cannot be empty')
      return
    }

    setUpdateSubmitting(true)
    setUpdateError('')

    try {
      await updateStudentAdmin(updatingStudent.id, {
        name: cleanName,
        deviceStatus: updateDeviceStatus,
      })

      setShowUpdateModal(false)
      setToastMessage({
        type: 'success',
        text: 'Student updated successfully.',
      })
      setTimeout(() => setToastMessage(null), 5000)

      // Refresh list
      const res = await getStudents()
      if (res?.students) setStudents(res.students)
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update student')
    } finally {
      setUpdateSubmitting(false)
    }
  }

  const handleOpenDeviceModal = async (student: StudentRecord) => {
    setDeviceStudent(student)
    setDeviceDetail(null)
    setDeviceMessage(null)
    setShowDeviceModal(true)
    setDeviceLoading(true)

    try {
      const data = await getStudentDeviceAdmin(student.id)
      setDeviceDetail(data)
    } catch (err: any) {
      setDeviceMessage({
        type: 'error',
        text: err.message || 'Failed to load device details',
      })
    } finally {
      setDeviceLoading(false)
    }
  }

  const handleResetStudentDevice = async () => {
    if (!deviceStudent) return
    setDeviceResetting(true)
    setDeviceMessage(null)

    try {
      const res = await resetStudentDeviceAdmin(deviceStudent.id)
      setDeviceMessage({
        type: 'success',
        text: res.message || 'Device binding reset successfully.',
      })

      // Reload device details
      const updatedData = await getStudentDeviceAdmin(deviceStudent.id)
      setDeviceDetail(updatedData)

      // Refresh student list
      const listRes = await getStudents()
      if (listRes?.students) setStudents(listRes.students)
    } catch (err: any) {
      setDeviceMessage({
        type: 'error',
        text: err.message || 'Failed to reset device binding',
      })
    } finally {
      setDeviceResetting(false)
    }
  }

  const handleOpenDeleteModal = (student: StudentRecord) => {
    setDeletingStudent(student)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return
    setDeleteSubmitting(true)
    setDeleteError('')

    try {
      await deleteStudentAdmin(deletingStudent.id)
      setShowDeleteModal(false)
      setToastMessage({
        type: 'success',
        text: 'Student deleted successfully.',
      })
      setTimeout(() => setToastMessage(null), 5000)

      // Refresh student list
      const res = await getStudents()
      if (res?.students) setStudents(res.students)
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete student')
    } finally {
      setDeleteSubmitting(false)
    }
  }


  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.usn.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))

      if (!matchesQuery) return false
      return true
    })
  }, [students, query])

  const handleApplyDivision = async () => {
    setRangeError('')
    const cleanStart = startUsn.trim().toUpperCase()
    const cleanEnd = endUsn.trim().toUpperCase()

    if (!cleanStart) {
      setRangeError('Please enter Beginning USN')
      return
    }
    if (!cleanEnd) {
      setRangeError('Please enter Ending USN')
      return
    }
    if (!selectedDivision) {
      setRangeError('Please select a Division (A, B, C, or D)')
      return
    }

    setCheckingRange(true)
    try {
      const data = await previewAssignDivision({
        startUsn: cleanStart,
        endUsn: cleanEnd,
        division: selectedDivision,
      })

      if (!data.affectedCount || data.affectedCount === 0) {
        setRangeError(`No students found in USN range ${cleanStart} to ${cleanEnd} for ${data.departmentName || 'your department'}.`)
        return
      }

      setDivisionPreviewData(data)
      setShowDivisionConfirmModal(true)
    } catch (err: any) {
      // In local dev/fallback if backend is offline, calculate preview locally
      const matched = students.filter(s => isUsnInRange(s.usn, cleanStart, cleanEnd))
      if (matched.length === 0) {
        setRangeError(`No students found in USN range ${cleanStart} to ${cleanEnd}.`)
        return
      }
      setDivisionPreviewData({
        success: true,
        preview: true,
        startUsn: cleanStart,
        endUsn: cleanEnd,
        division: selectedDivision,
        department: hodDepartment || 'CSE',
        departmentName: hodDepartment || 'Department',
        affectedCount: matched.length,
        students: matched.map(s => ({
          id: s.id,
          usn: s.usn,
          name: s.name,
          currentDivision: s.section || 'A',
          newDivision: selectedDivision,
          semester: s.semester,
        })),
      })
      setShowDivisionConfirmModal(true)
    } finally {
      setCheckingRange(false)
    }
  }

  const handleConfirmAssignDivision = async () => {
    if (!divisionPreviewData) return
    setAssigningDivision(true)

    try {
      const result = await commitAssignDivision({
        startUsn: divisionPreviewData.startUsn,
        endUsn: divisionPreviewData.endUsn,
        division: divisionPreviewData.division,
      })

      setShowDivisionConfirmModal(false)
      setDivisionActionMessage({
        type: 'success',
        text: result.message || `Division ${divisionPreviewData.division} assigned to ${divisionPreviewData.affectedCount} students.`,
      })

      // Update student section in local state
      setStudents(prev =>
        prev.map(s => {
          if (isUsnInRange(s.usn, divisionPreviewData.startUsn, divisionPreviewData.endUsn)) {
            return { ...s, section: divisionPreviewData.division }
          }
          return s
        })
      )

      // Refresh from backend
      getStudents().then(refreshed => {
        if (refreshed?.students) {
          setStudents(refreshed.students)
        }
      })

      // Clear input fields
      setStartUsn('')
      setEndUsn('')
      setSelectedDivision('')
      setDivisionPreviewData(null)
    } catch (err: any) {
      setDivisionActionMessage({
        type: 'error',
        text: err.message || 'Failed to assign division',
      })
      setShowDivisionConfirmModal(false)
    } finally {
      setAssigningDivision(false)
      setTimeout(() => setDivisionActionMessage(null), 6000)
    }
  }

  const handleExportStudents = () => {
    if (students.length === 0) return
    const headers = ['USN', 'Name', 'Department', 'Semester', 'Section', 'Academic Year', 'Email', 'Device Status']
    const csvRows = [
      headers.join(','),
      ...filtered.map(s => [
        `"${s.usn || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.department || ''}"`,
        s.semester || '',
        `"${s.section || ''}"`,
        `"${s.academicYear || ''}"`,
        `"${s.email || ''}"`,
        s.deviceBound ? 'Linked' : 'Not Linked'
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `students_${hodDepartment || 'all'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePreviewImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      setImportError('Please select an Excel or PDF file')
      return
    }
    setImportSubmitting(true)
    setImportError('')
    try {
      const data = await previewImportStudents(importFile, importYear)
      setPreviewData(data)
      setImportStep('preview')
    } catch (err: any) {
      setImportError(err.message || 'Failed to preview file')
    } finally {
      setImportSubmitting(false)
    }
  }

  const handleCommitImport = async () => {
    if (!importFile) return
    setImportSubmitting(true)
    setImportError('')
    try {
      const result = await commitImportStudents(importFile, importYear)
      setImportSuccess(result.message)
      setImportStep('success')
      // Refresh students from backend
      const res = await getStudents()
      setStudents(res.students)
      setTimeout(() => {
        setShowImportModal(false)
        setImportStep('upload')
        setImportFile(null)
        setPreviewData(null)
        setImportSuccess('')
      }, 2000)
    } catch (err: any) {
      setImportError(err.message || 'Failed to import students')
    } finally {
      setImportSubmitting(false)
    }
  }

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
                onClick={() => {
                  setShowImportModal(true)
                  setImportStep('upload')
                  setImportFile(null)
                  setPreviewData(null)
                  setImportError('')
                  setImportSuccess('')
                }}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Students
              </button>
              <button 
                onClick={handleExportStudents}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
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
            <div className="p-4 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* Left: Search Bar */}
              <div className="relative w-full xl:w-64 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, USN, dept..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Compact Section: USN Range & Division Assignment */}
              <div className="flex flex-wrap items-center gap-2.5 p-2 bg-muted/40 rounded-xl border border-border">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap px-1">USN Range:</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Beginning USN</span>
                  <input
                    type="text"
                    placeholder="e.g. 2VD23CS001"
                    value={startUsn}
                    onChange={e => {
                      setStartUsn(e.target.value)
                      setRangeError('')
                    }}
                    className="h-8 w-28 sm:w-32 rounded-md border border-input bg-background px-2.5 text-xs font-mono uppercase outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Ending USN</span>
                  <input
                    type="text"
                    placeholder="e.g. 2VD23CS023"
                    value={endUsn}
                    onChange={e => {
                      setEndUsn(e.target.value)
                      setRangeError('')
                    }}
                    className="h-8 w-28 sm:w-32 rounded-md border border-input bg-background px-2.5 text-xs font-mono uppercase outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">Division</span>
                  <select
                    value={selectedDivision}
                    onChange={e => {
                      setSelectedDivision(e.target.value)
                      setRangeError('')
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplyDivision}
                  disabled={!startUsn || !endUsn || !selectedDivision || checkingRange}
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {checkingRange ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Apply
                </button>

                {(startUsn || endUsn || selectedDivision) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartUsn('')
                      setEndUsn('')
                      setSelectedDivision('')
                      setRangeError('')
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                    title="Clear range"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-[11px]">Clear</span>
                  </button>
                )}
              </div>

              {/* Student count */}
              <div className="text-xs text-muted-foreground shrink-0 self-end xl:self-auto">
                {filtered.length} student{filtered.length === 1 ? '' : 's'} found
              </div>
            </div>

            {/* Error or Success feedback banner */}
            {rangeError && (
              <div className="p-3 px-4 text-xs bg-rose-50 text-rose-800 border-b border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{rangeError}</span>
                </div>
                <button type="button" onClick={() => setRangeError('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {divisionActionMessage && (
              <div className={`p-3 px-4 text-xs border-b flex items-center justify-between ${
                divisionActionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{divisionActionMessage.text}</span>
                </div>
                <button type="button" onClick={() => setDivisionActionMessage(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {toastMessage && (
              <div className={`p-3 px-4 text-xs border-b flex items-center justify-between ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{toastMessage.text}</span>
                </div>
                <button type="button" onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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
                        <StatusBadge status={s.deviceBound ? 'Registered' : 'Not Registered'} />
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionMenuId(openActionMenuId === s.id ? null : s.id)
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openActionMenuId === s.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-6 top-10 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg z-30 text-xs animate-in fade-in zoom-in-95 text-left"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null)
                                handleOpenUpdateModal(s)
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              Update Student
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null)
                                handleOpenDeviceModal(s)
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                            >
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                              Device Management
                            </button>
                            <div className="my-1 border-t border-border" />
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null)
                                handleOpenDeleteModal(s)
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Student
                            </button>
                          </div>
                        )}
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

        {/* Import Students Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {importStep === 'preview' ? 'Import Preview' : importStep === 'success' ? 'Import Successful' : 'Import Students'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {importStep === 'preview' 
                      ? 'Review extracted student records before inserting into PostgreSQL.'
                      : importStep === 'success'
                      ? 'The verified student records have been saved.'
                      : 'Bulk register students from an Excel (.xlsx, .xls) or PDF (.pdf) file.'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {importError && (
                <div className="mx-6 mt-4 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Step 1: Upload Step */}
              {importStep === 'upload' && (
                <form onSubmit={handlePreviewImport} className="p-6 space-y-5 overflow-y-auto">
                  <div className="p-3.5 bg-muted/50 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Target Department: <span className="font-semibold text-foreground">{hodDepartment || 'Assigned Department'}</span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                      Auto-enforced from HOD Account
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label required>Year of Study</Label>
                    <p className="text-xs text-muted-foreground">
                      The selected year will automatically be assigned to every student in the uploaded file.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { y: 1, label: '1st Year', sem: 'Sem 1' },
                        { y: 2, label: '2nd Year', sem: 'Sem 3' },
                        { y: 3, label: '3rd Year', sem: 'Sem 5' },
                        { y: 4, label: '4th Year', sem: 'Sem 7' },
                      ].map(opt => (
                        <button
                          key={opt.y}
                          type="button"
                          onClick={() => setImportYear(opt.y)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            importYear === opt.y
                              ? 'border-primary bg-primary/5 text-primary font-semibold shadow-xs ring-1 ring-primary'
                              : 'border-input bg-background hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <div className="text-sm">{opt.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{opt.sem}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label required>Upload Student List</Label>
                    <div className="relative border-2 border-dashed border-input hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/20">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.pdf"
                        onChange={e => {
                          const file = e.target.files?.[0] || null;
                          setImportFile(file);
                          setImportError('');
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="size-6" />
                        </div>
                        {importFile ? (
                          <div>
                            <p className="text-sm font-semibold text-foreground">{importFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Accepted: Excel (.xlsx, .xls) and PDF (.pdf)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importSubmitting}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {importSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Preview Students
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Preview Step */}
              {importStep === 'preview' && (
                <div className="flex flex-col flex-1 overflow-hidden p-6 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <div className="text-xs text-muted-foreground">Total Found</div>
                      <div className="text-xl font-bold text-foreground">{previewData?.totalFound || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Ready to Import</div>
                      <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{previewData?.readyToImport || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Already Exists</div>
                      <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{previewData?.alreadyExists || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                      <div className="text-xs text-orange-700 dark:text-orange-400 font-medium">Duplicates / Invalid</div>
                      <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                        {(previewData?.duplicatesInFile || 0) + (previewData?.invalidRows || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
                    <span>Department: <strong className="text-foreground">{previewData?.department}</strong></span>
                    <span>Year of Study: <strong className="text-foreground">{previewData?.year} Year (Sem {previewData ? previewData.year * 2 - 1 : ''})</strong></span>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-border rounded-lg max-h-[300px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/80 sticky top-0 font-semibold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">USN</th>
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Year</th>
                          <th className="px-4 py-2.5">Dept</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData?.students.map((st, idx) => (
                          <tr key={idx} className={st.status !== 'READY' ? 'bg-muted/30' : 'hover:bg-muted/20'}>
                            <td className="px-4 py-2.5 font-mono font-medium">{st.usn}</td>
                            <td className="px-4 py-2.5">{st.name}</td>
                            <td className="px-4 py-2.5">{st.year} Year</td>
                            <td className="px-4 py-2.5">{st.department}</td>
                            <td className="px-4 py-2.5">
                              {st.status === 'READY' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Ready
                                </span>
                              ) : st.status === 'ALREADY_EXISTS' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title={st.reason || ''}>
                                  Already in DB
                                </span>
                              ) : st.status === 'DUPLICATE_IN_FILE' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200" title={st.reason || ''}>
                                  Duplicate in File
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200" title={st.reason || ''}>
                                  Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setImportStep('upload')}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCommitImport}
                        disabled={!previewData || previewData.readyToImport === 0 || importSubmitting}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors"
                      >
                        {importSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Import {previewData?.readyToImport || 0} Students
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Success Step */}
              {importStep === 'success' && (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Import Complete!</h3>
                  <p className="text-sm text-muted-foreground max-w-md">{importSuccess}</p>
                  <p className="text-xs text-muted-foreground">Refreshing student directory...</p>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Division Assignment Confirmation / Preview Modal */}
        {showDivisionConfirmModal && divisionPreviewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Confirm Division Assignment</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Review the affected student records before committing to the database.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-muted/40 rounded-lg p-3.5 border border-border/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground font-medium">Beginning USN:</span>
                    <span className="font-mono font-semibold text-foreground">{divisionPreviewData.startUsn}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground font-medium">Ending USN:</span>
                    <span className="font-mono font-semibold text-foreground">{divisionPreviewData.endUsn}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground font-medium">Target Division:</span>
                    <span className="font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                      Division {divisionPreviewData.division}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground font-medium">Department:</span>
                    <span className="font-medium text-foreground">{divisionPreviewData.departmentName || divisionPreviewData.department}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold">
                      Students affected: {divisionPreviewData.affectedCount} student{divisionPreviewData.affectedCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                    Ready
                  </span>
                </div>

                {/* Scrollable list preview of affected students */}
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
                  {divisionPreviewData.students.map((st, i) => (
                    <div key={st.id || i} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <span className="font-mono font-medium text-foreground mr-2">{st.usn}</span>
                        <span className="text-muted-foreground">{st.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-muted-foreground">Sec {st.currentDivision}</span>
                        <span>→</span>
                        <span className="font-semibold text-primary">Sec {st.newDivision}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDivisionConfirmModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-md border border-input hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignDivision}
                  disabled={assigningDivision}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                >
                  {assigningDivision ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Assign Division {divisionPreviewData.division}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Student Modal */}
        {showUpdateModal && updatingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Update Student</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit student name and device authorization.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUpdateStudent} className="p-5 space-y-4">
                {updateError && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* Read-only reference information */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USN:</span>
                    <span className="font-mono font-semibold text-foreground">{updatingStudent.usn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium text-foreground">{updatingStudent.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Semester / Section:</span>
                    <span className="text-foreground">Sem {updatingStudent.semester} (Sec {updatingStudent.section})</span>
                  </div>
                </div>

                {/* Editable field 1: Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Student Name</label>
                  <input
                    type="text"
                    required
                    value={updateName}
                    onChange={(e) => setUpdateName(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Full student name"
                  />
                </div>

                {/* Editable field 2: Device Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Device Status</label>
                  <select
                    value={updateDeviceStatus}
                    onChange={(e) => setUpdateDeviceStatus(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Not Registered">Not Registered</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Synchronized with mobile device registration for BLE attendance verification.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSubmitting || !updateName.trim()}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {updateSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Device Management Modal */}
        {showDeviceModal && deviceStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Device Management</h2>
                    <p className="text-xs text-muted-foreground">Security & hardware binding for mobile BLE attendance.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {deviceMessage && (
                  <div className={`p-3 text-xs rounded-md border flex items-center gap-2 ${
                    deviceMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'
                  }`}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{deviceMessage.text}</span>
                  </div>
                )}

                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-semibold text-foreground">{deviceStudent.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">USN:</span>
                    <span className="font-mono font-semibold text-foreground">{deviceStudent.usn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Binding Status:</span>
                    <StatusBadge status={deviceDetail?.isBound ? 'Registered' : 'Not Registered'} />
                  </div>
                </div>

                {deviceLoading ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Fetching device security credentials...
                  </div>
                ) : deviceDetail && deviceDetail.devices && deviceDetail.devices.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Registered Device Credentials</h3>
                    {deviceDetail.devices.map((d, idx) => (
                      <div key={d.id || idx} className="p-3 rounded-lg border border-border bg-background space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Device #{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            d.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                          }`}>
                            {d.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
                          <span>Key: {d.publicKeyFingerprint}</span>
                          <span>Registered: {new Date(d.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        Security Policy
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Attendance marks verify cryptographic device binding. If this student lost or replaced their phone, reset this binding so they can register their new mobile device.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed border-border text-center space-y-1.5">
                    <Smartphone className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-xs font-medium text-foreground">No Mobile Device Registered</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      This student has not yet bound a mobile device. Device binding occurs securely when the student logs in from the SmartAttend mobile application.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowDeviceModal(false)}
                    className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Close
                  </button>
                  {deviceDetail?.isBound && (
                    <button
                      type="button"
                      disabled={deviceResetting}
                      onClick={handleResetStudentDevice}
                      className="h-9 px-4 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {deviceResetting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Reset / Unbind Device
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Student Confirmation Modal */}
        {showDeleteModal && deletingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Delete Student?</h2>
                    <p className="text-xs text-muted-foreground">Permanent deletion confirmation</p>
                  </div>
                </div>

                {deleteError && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2 text-xs">
                  <p className="text-muted-foreground font-medium">Are you sure you want to delete:</p>
                  <div className="pl-2 border-l-2 border-primary space-y-1">
                    <div className="font-semibold text-sm text-foreground">{deletingStudent.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">USN: {deletingStudent.usn}</div>
                    <div className="text-xs text-muted-foreground">{deletingStudent.department} • Semester {deletingStudent.semester}</div>
                  </div>
                </div>

                <p className="text-xs text-destructive font-medium">
                  ⚠️ This action cannot be undone. If this student has active attendance history, deletion will be blocked to preserve audit records.
                </p>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={handleConfirmDeleteStudent}
                    className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deleteSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Delete Student
                  </button>
                </div>
              </div>
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
