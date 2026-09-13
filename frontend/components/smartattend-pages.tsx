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
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Key,
  TrendingUp,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Smartphone,
  AlertCircle,
  Check,
  Loader2,
  X
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { AdminShell, AdminContent, StatusBadge, Label, Inp } from './admin-shell'
import {
  getFaculty,
  createFacultyAdmin,
  updateFacultyAdmin,
  deleteFacultyAdmin,
  downloadFacultyExport,
  FacultyRecord,
} from '@/lib/api'

export function compareUsn(a: string | undefined, b: string | undefined): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
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
                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
interface Student {
  name: string
  usn: string
  dept: string
  year: string
  semester: string
  section: string
  account: string
  device: string
  email?: string
  password?: string | null
  Lab?: string
  lab?: string
  deviceBound?: boolean
  boundDeviceName?: string | null
}

const students: Student[] = []

export interface ImportPreviewItem {
  usn: string
  name: string
  email?: string
  department: string
  year: string
  semester: string
  section: string
  labBatch: string
  status: 'READY' | 'ALREADY_EXISTS' | 'OTHER_DEPT' | 'DUPLICATE_IN_FILE' | 'INVALID'
  reason?: string
}

export interface ImportPreviewData {
  totalFound: number
  readyToImport: number
  alreadyExists: number
  otherDeptCount: number
  duplicatesInFile: number
  invalidRows: number
  department: string
  year: string
  semester: string
  students: ImportPreviewItem[]
}

// Helper to match student department, handling aliases (e.g. EC/ECE, CV/CIVIL, ME/MECH, AIML/AI, DS/AIDS)
export function isStudentInDept(studentDept?: string | null, targetDept?: string | null): boolean {
  if (!studentDept || !targetDept) return false
  const s = studentDept.trim().toUpperCase()
  const t = targetDept.trim().toUpperCase()
  if (s === t) return true

  // CSE / CS
  if ((s === 'CSE' || s === 'CS') && (t === 'CSE' || t === 'CS')) return true
  // EC / ECE
  if ((s === 'EC' || s === 'ECE') && (t === 'EC' || t === 'ECE')) return true
  // EEE / EE
  if ((s === 'EEE' || s === 'EE') && (t === 'EEE' || t === 'EE')) return true
  // CV / CIVIL
  if ((s === 'CV' || s === 'CIVIL') && (t === 'CV' || t === 'CIVIL')) return true
  // ME / MECH / MECHANICAL
  if ((s === 'ME' || s === 'MECH' || s === 'MECHANICAL') && (t === 'ME' || t === 'MECH' || t === 'MECHANICAL')) return true
  // AIML / AI
  if ((s === 'AIML' || s === 'AI') && (t === 'AIML' || t === 'AI')) return true
  // DS / AIDS / DATA SCIENCE
  if ((s === 'DS' || s === 'AIDS' || s === 'DATA SCIENCE') && (t === 'DS' || t === 'AIDS' || t === 'DATA SCIENCE')) return true
  // ISE / IS
  if ((s === 'ISE' || s === 'IS') && (t === 'ISE' || t === 'IS')) return true

  return false
}

// Helper to extract standard branch code from department name (e.g. CSE -> CS, ECE -> EC)
export function getDeptCodeFromDept(dept?: string | null): string {
  if (!dept) return 'CS'
  const d = dept.trim().toUpperCase()
  if (d === 'CSE' || d === 'CS') return 'CS'
  if (d === 'ECE' || d === 'EC') return 'EC'
  if (d === 'EEE' || d === 'EE') return 'EE'
  if (d === 'CV' || d === 'CIVIL') return 'CV'
  if (d === 'ME' || d === 'MECH' || d === 'MECHANICAL') return 'ME'
  if (d === 'AIML' || d === 'AI') return 'AI'
  if (d === 'DS' || d === 'AIDS' || d === 'DATA SCIENCE') return 'DS'
  if (d === 'ISE' || d === 'IS') return 'IS'
  return d.slice(0, 2)
}

// Helper to calculate admission year digits (e.g. '23', '24') from academic year
export function getAdmissionYearFromAcademicYear(acadYear?: string | null): string {
  if (!acadYear) return '23'
  const y = acadYear.trim()
  if (y.includes('1')) return '24'
  if (y.includes('2')) return '23'
  if (y.includes('3')) return '22'
  if (y.includes('4')) return '21'
  return '23'
}

// Helper to verify if a section belongs to the target department (e.g. "ECE 2A" for ECE)
// Generic sections like "Section A", "A", or "2A" without a foreign department prefix belong to targetDept
export function isSectionInDept(section?: string | null, targetDept?: string | null): boolean {
  if (!section || !targetDept) return true
  const sec = section.trim().toUpperCase()

  const knownDepts = [
    'CSE', 'CS', 'ECE', 'EC', 'EEE', 'EE', 'CV', 'CIVIL',
    'ME', 'MECH', 'MECHANICAL', 'AIML', 'AI', 'DS', 'AIDS', 'DATA SCIENCE', 'ISE', 'IS'
  ]
  for (const kd of knownDepts) {
    if (
      sec.startsWith(kd + ' ') ||
      sec.startsWith(kd + '-') ||
      sec.startsWith(kd + '_') ||
      (sec.length > kd.length && sec.startsWith(kd) && /\d/.test(sec[kd.length]))
    ) {
      return isStudentInDept(kd, targetDept)
    }
  }

  return true
}

// Helper to normalize any semester input (e.g. "3", "3 Sem", "3rd", "3rd Sem") into canonical "3rd Sem"
export function normalizeSemesterString(sem?: string | null): string {
  if (!sem) return '1st Sem'
  const trimmed = sem.trim()
  const numMatch = trimmed.match(/\d+/)
  if (!numMatch) return trimmed
  const n = parseInt(numMatch[0])
  const suffixes: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th',
  }
  const prefix = suffixes[n] || `${n}th`
  return `${prefix} Sem`
}

// Helper to verify if a USN belongs to the target department (e.g. 2VD23CS009 for CSE, 01EC203 for ECE)
export function isUsnInDept(usn?: string | null, targetDept?: string | null): boolean {
  if (!usn || !targetDept) return false
  const cleanUsn = usn.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const deptCode = getDeptCodeFromDept(targetDept)
  const fullDept = targetDept.trim().toUpperCase()

  // Match VTU standard pattern: e.g. 2VD 23 CS 009
  const vtuMatch = cleanUsn.match(/^[0-9A-Z]{3}\d{2}([A-Z]{2,4})\d+$/)
  if (vtuMatch) {
    const branch = vtuMatch[1]
    if (branch === deptCode || branch === fullDept || isStudentInDept(branch, targetDept)) {
      return true
    }
    return false
  }

  // Autonomous / college roll pattern: e.g. 01EC203, 23EC009, 2VDEC001
  const fallbackRegex = new RegExp(`(?:2VD|\\d{1,4})(${deptCode}|${fullDept})\\d+`, 'i')
  if (fallbackRegex.test(cleanUsn)) return true

  // Direct prefix pattern: e.g. EC001, ECE001
  if (cleanUsn.startsWith(deptCode) || cleanUsn.startsWith(fullDept)) return true

  const branchInUsn = cleanUsn.match(/[0-9]+([A-Z]{2,4})[0-9]*/)
  if (branchInUsn && (branchInUsn[1] === deptCode || isStudentInDept(branchInUsn[1], targetDept))) {
    return true
  }

  return false
}

// Client-side Excel (.xlsx, .xls) and CSV parser matching zoattendence
export async function parseStudentFileClient(
  file: File,
  dept: string,
  targetYear: string,
  targetSem: string,
  existingStudents: Student[]
): Promise<ImportPreviewData> {
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch (err: any) {
    throw new Error('Could not read the uploaded file. Please ensure it is a valid .xlsx, .xls, or .csv file.')
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded spreadsheet contains no sheets.')
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (!rows || rows.length === 0) {
    throw new Error('The uploaded spreadsheet is empty.')
  }

  // Column matching heuristics (as in zoattendence studentFileParser)
  let usnColIndex = -1
  let nameColIndex = -1
  let secColIndex = -1
  let labColIndex = -1
  let emailColIndex = -1
  let semColIndex = -1
  let deptColIndex = -1
  let headerRowIndex = -1

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase()
      if (
        usnColIndex === -1 &&
        (cell === 'usn' || cell === 'usn no' || cell === 'usn number' ||
         cell === 'university seat number' || cell === 'roll no' ||
         cell === 'register number' || cell === 'reg no' || cell.includes('usn'))
      ) {
        usnColIndex = c
      }

      if (
        nameColIndex === -1 &&
        (cell === 'name' || cell === 'student name' || cell === 'candidate name' ||
         cell === 'full name' || cell === 'student_name' ||
         (cell.includes('name') && !cell.includes('father') && !cell.includes('college') && !cell.includes('dept')))
      ) {
        nameColIndex = c
      }

      if (
        deptColIndex === -1 &&
        (cell === 'department' || cell === 'dept' || cell === 'branch' || cell === 'course')
      ) {
        deptColIndex = c
      }

      if (
        secColIndex === -1 &&
        (cell === 'section' || cell === 'sec' || cell === 'division' || cell === 'div')
      ) {
        secColIndex = c
      }

      if (
        labColIndex === -1 &&
        (cell === 'lab' || cell === 'batch' || cell === 'lab batch' || cell === 'labbatch' || cell === 'lab group')
      ) {
        labColIndex = c
      }

      if (
        emailColIndex === -1 &&
        (cell === 'email' || cell === 'mail' || cell === 'email id' || cell === 'email address')
      ) {
        emailColIndex = c
      }

      if (
        semColIndex === -1 &&
        (cell === 'sem' || cell === 'semester')
      ) {
        semColIndex = c
      }
    }

    if (usnColIndex !== -1 && nameColIndex !== -1) {
      headerRowIndex = r
      break
    }
  }

  const extractedList: Array<{
    rawUsn: string
    rawName: string
    rawSection?: string
    rawLab?: string
    rawEmail?: string
    rawSem?: string
    rawDept?: string
  }> = []

  if (usnColIndex !== -1 && nameColIndex !== -1) {
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r]
      if (!Array.isArray(row) || row.length === 0) continue

      const rawUsn = String(row[usnColIndex] || '').trim()
      const rawName = String(row[nameColIndex] || '').trim()
      const rawSection = secColIndex !== -1 ? String(row[secColIndex] || '').trim() : undefined
      const rawLab = labColIndex !== -1 ? String(row[labColIndex] || '').trim() : undefined
      const rawEmail = emailColIndex !== -1 ? String(row[emailColIndex] || '').trim() : undefined
      const rawSem = semColIndex !== -1 ? String(row[semColIndex] || '').trim() : undefined
      const rawDept = deptColIndex !== -1 ? String(row[deptColIndex] || '').trim() : undefined

      if (!rawUsn && !rawName) continue
      extractedList.push({ rawUsn, rawName, rawSection, rawLab, rawEmail, rawSem, rawDept })
    }
  } else {
    // Fallback: row-by-row scanner
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (!Array.isArray(row) || row.length === 0) continue

      let candidateUsn = ''
      let candidateName = ''

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim()
        if (!cell) continue

        const match = cell.match(/\b([0-9][A-Z]{2}[0-9]{2}[A-Z]{2,3}[0-9]{3})\b/i) || cell.match(/\b([0-9A-Z]{4,10})\b/i)
        if (match && !candidateUsn && /[0-9]/.test(cell) && /[A-Za-z]/.test(cell) && cell.length <= 12) {
          candidateUsn = match[0]
        } else if (!candidateName && /[a-zA-Z]{2,}/.test(cell) && !/\d/.test(cell) && cell.length >= 2 && cell.length <= 60) {
          candidateName = cell
        }
      }

      if (candidateUsn || candidateName) {
        extractedList.push({ rawUsn: candidateUsn, rawName: candidateName })
      }
    }
  }

  if (extractedList.length === 0) {
    throw new Error('No students found in the file. Please ensure the file contains USN and Name columns.')
  }

  const seenInFile = new Set<string>()
  const parsedStudents: ImportPreviewItem[] = []

  let readyCount = 0
  let alreadyExistsCount = 0
  let otherDeptCount = 0
  let duplicatesInFileCount = 0
  let invalidRowsCount = 0

  for (const item of extractedList) {
    // USN must be cleaned, uppercased, and capped to 10 chars (VARCHAR(10))
    let cleanedUsn = item.rawUsn
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10)

    let cleanedName = item.rawName
      .replace(/[0-9\t\r\n\|]/g, ' ')
      .replace(/[^\w\s\.\,\']/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()

    const assignedSem = item.rawSem ? normalizeSemesterString(item.rawSem) : targetSem
    const semToYear: Record<string, string> = {
      '1st Sem': '1st Year',
      '2nd Sem': '1st Year',
      '3rd Sem': '2nd Year',
      '4th Sem': '2nd Year',
      '5th Sem': '3rd Year',
      '6th Sem': '3rd Year',
      '7th Sem': '4th Year',
      '8th Sem': '4th Year'
    }
    const resolvedYear = semToYear[assignedSem] || targetYear
    const resolvedYearNum = resolvedYear.match(/\d/)?.[0] || '1'

    let assignedSection = `${dept} ${resolvedYearNum}A`
    if (item.rawSection) {
      const secLetter = getSectionLetter(item.rawSection)
      assignedSection = `${dept} ${resolvedYearNum}${secLetter}`
    }

    const secLetter = getSectionLetter(assignedSection)
    let assignedLab = `${secLetter}1`
    if (item.rawLab) {
      let rawL = item.rawLab.toUpperCase().replace(/^LAB\s*/i, '').trim()
      if (rawL) {
        assignedLab = rawL.startsWith(secLetter) ? rawL : `${secLetter}${rawL.replace(/[^0-9]/g, '') || '1'}`
      }
    }

    let status: ImportPreviewItem['status'] = 'READY'
    let reason: string | undefined = undefined

    if (!cleanedUsn || cleanedUsn.length < 3 || cleanedUsn.length > 10) {
      status = 'INVALID'
      reason = 'USN must be between 3 and 10 alphanumeric characters'
      invalidRowsCount++
    } else if (!cleanedName || cleanedName.length < 2) {
      status = 'INVALID'
      reason = 'Student name is missing or too short'
      invalidRowsCount++
    } else if ((item.rawDept && !isStudentInDept(item.rawDept, dept)) || !isUsnInDept(cleanedUsn, dept)) {
      status = 'OTHER_DEPT'
      const branchLabel = item.rawDept || 'Other Branch'
      reason = `Other branch (${branchLabel}) - Skipped`
      otherDeptCount++
    } else if (seenInFile.has(cleanedUsn)) {
      status = 'DUPLICATE_IN_FILE'
      reason = 'Duplicate USN in uploaded file'
      duplicatesInFileCount++
    } else if (existingStudents.some(s => s.usn.toUpperCase() === cleanedUsn)) {
      status = 'ALREADY_EXISTS'
      reason = 'Already registered in database (will update year/semester/section)'
      alreadyExistsCount++
      seenInFile.add(cleanedUsn)
    } else {
      status = 'READY'
      readyCount++
      seenInFile.add(cleanedUsn)
    }

    parsedStudents.push({
      usn: cleanedUsn || item.rawUsn,
      name: cleanedName || item.rawName,
      email: item.rawEmail || (cleanedUsn ? `${cleanedUsn.toLowerCase()}@klsvdit.edu.in` : ''),
      department: dept,
      year: resolvedYear,
      semester: assignedSem,
      section: assignedSection,
      labBatch: assignedLab,
      status,
      reason
    })
  }

  return {
    totalFound: parsedStudents.length,
    readyToImport: readyCount,
    alreadyExists: alreadyExistsCount,
    otherDeptCount,
    duplicatesInFile: duplicatesInFileCount,
    invalidRows: invalidRowsCount,
    department: dept,
    year: targetYear,
    semester: targetSem,
    students: parsedStudents
  }
}

const DEFAULT_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const YEAR_SEMESTERS: Record<string, string[]> = {
  '1st Year': ['1st Sem', '2nd Sem'],
  '2nd Year': ['3rd Sem', '4th Sem'],
  '3rd Year': ['5th Sem', '6th Sem'],
  '4th Year': ['7th Sem', '8th Sem'],
}

// Progression mapping for bulk promotion to next semester and year
export const SEMESTER_PROGRESSION: Record<string, { nextSem: string; nextYear: string }> = {
  '1st Sem': { nextSem: '2nd Sem', nextYear: '1st Year' },
  '2nd Sem': { nextSem: '3rd Sem', nextYear: '2nd Year' },
  '3rd Sem': { nextSem: '4th Sem', nextYear: '2nd Year' },
  '4th Sem': { nextSem: '5th Sem', nextYear: '3rd Year' },
  '5th Sem': { nextSem: '6th Sem', nextYear: '3rd Year' },
  '6th Sem': { nextSem: '7th Sem', nextYear: '4th Year' },
  '7th Sem': { nextSem: '8th Sem', nextYear: '4th Year' },
}

export const isOddSemester = (sem?: string | null): boolean => {
  if (!sem) return true
  const num = parseInt(sem.replace(/\D/g, '')) || 1
  return num % 2 !== 0
}

export const isSemesterActive = (sem: string, cycle: 'ODD' | 'EVEN'): boolean => {
  const isOdd = isOddSemester(sem)
  return cycle === 'ODD' ? isOdd : !isOdd
}

// Helper to extract clean Section Letter (A, B, C...)
export function getSectionLetter(section?: string | null): string {
  if (!section) return 'A'
  const match = section.trim().match(/([A-Za-z])$/)
  return match ? match[1].toUpperCase() : section.trim().toUpperCase()
}

// Helper to format Section for display (Section A, Section B)
export function getSectionDisplayName(section?: string | null): string {
  if (!section || section === 'ALL') return 'All Sections'
  const letter = getSectionLetter(section)
  return `Section ${letter}`
}

// Helper to format Section and Lab Batch cleanly as A/A1
export function formatSectionLab(section?: string | null, lab?: string | null): string {
  const secLetter = getSectionLetter(section)
  let rawLab = (lab || '').trim()
  if (rawLab.toUpperCase().startsWith('LAB')) {
    rawLab = rawLab.replace(/^LAB\s*/i, '').trim()
  }
  let labCode = rawLab
  if (!labCode || !/[A-Za-z]/.test(labCode)) {
    const num = labCode.replace(/[^0-9]/g, '') || '1'
    labCode = `${secLetter}${num}`
  } else {
    labCode = labCode.toUpperCase()
  }
  return `${secLetter}/${labCode}`
}

export function StudentsPage({ adminDept: initialAdminDept = 'CSE' }: { adminDept?: string } = {}) {
  const [query, setQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedSem, setSelectedSem] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>('ALL')
  const [selectedLabBatch, setSelectedLabBatch] = useState<string>('ALL')
  const [openYearDropdown, setOpenYearDropdown] = useState<string | null>(null)
  const [students_data, setStudentsData] = useState<Student[]>(students)
  const [isStudentsLoaded, setIsStudentsLoaded] = useState(false)

  // Custom lab batches mapped by section letter (admin can create new batches)
  const [customLabBatches, setCustomLabBatches] = useState<Record<string, string[]>>({})

  // Custom sections mapped by year_sem key
  const [customSections, setCustomSections] = useState<Record<string, string[]>>({})

  // Helper to persist students_data and custom metadata to both localStorage and server API
  const persistStudents = (
    updatedStudents: Student[],
    updatedSections?: Record<string, string[]>,
    updatedBatches?: Record<string, string[]>
  ) => {
    try {
      localStorage.setItem('smartattend_students_data', JSON.stringify(updatedStudents))
      if (updatedSections) {
        localStorage.setItem('smartattend_custom_sections', JSON.stringify(updatedSections))
      }
      if (updatedBatches) {
        localStorage.setItem('smartattend_custom_lab_batches', JSON.stringify(updatedBatches))
      }
    } catch (e) {
      console.error('Failed to persist students to localStorage:', e)
    }

    // Persist to server API in background
    fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: updatedStudents,
        customSections: updatedSections || customSections,
        customLabBatches: updatedBatches || customLabBatches
      })
    }).catch(() => {})
  }

  // Restore students and metadata on initial mount (from localStorage and/or server)
  useEffect(() => {
    let localFound = false
    try {
      const stored = localStorage.getItem('smartattend_students_data')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudentsData(parsed)
          localFound = true
        }
      }

      const storedSections = localStorage.getItem('smartattend_custom_sections')
      if (storedSections) {
        const parsedSec = JSON.parse(storedSections)
        if (parsedSec && typeof parsedSec === 'object') {
          setCustomSections(parsedSec)
        }
      }

      const storedBatches = localStorage.getItem('smartattend_custom_lab_batches')
      if (storedBatches) {
        const parsedBatches = JSON.parse(storedBatches)
        if (parsedBatches && typeof parsedBatches === 'object') {
          setCustomLabBatches(parsedBatches)
        }
      }
    } catch (e) {
      console.error('Failed to restore students from localStorage:', e)
    }

    // Also synchronize with /api/admin/students
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(res => {
        let loadedStudents: any[] = []
        let loadedSections: Record<string, string[]> = {}
        let loadedBatches: Record<string, string[]> = {}

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          loadedStudents = res.data
          setStudentsData(res.data)
          try {
            localStorage.setItem('smartattend_students_data', JSON.stringify(res.data))
          } catch {}
        }
        if (res.meta?.customSections && Object.keys(res.meta.customSections).length > 0) {
          loadedSections = res.meta.customSections
        }
        if (res.meta?.customLabBatches && Object.keys(res.meta.customLabBatches).length > 0) {
          loadedBatches = res.meta.customLabBatches
        }

        // Prune stale empty sections/batches immediately after loading from server
        const studentsForPrune = loadedStudents.length > 0 ? loadedStudents : []
        const prunedSecs: Record<string, string[]> = {}
        Object.entries(loadedSections).forEach(([key, secs]) => {
          const [yr, sm] = key.split('_')
          const active = (secs as string[]).filter((sec: string) => {
            const letter = sec.replace(/.*?([A-Z])\s*$/, '$1').toUpperCase()
            return studentsForPrune.some((s: any) => {
              const sLetter = (s.section || '').replace(/.*?([A-Z])\s*$/, '$1').toUpperCase()
              return s.year === yr && s.semester === sm && sLetter === letter
            })
          })
          if (active.length > 0) prunedSecs[key] = active
        })
        const prunedBatches: Record<string, string[]> = {}
        Object.entries(loadedBatches).forEach(([secLetter, batches]) => {
          const active = (batches as string[]).filter((batch: string) => {
            const batchNorm = batch.toUpperCase().replace(/^LAB\s*/i, '').trim()
            return studentsForPrune.some((s: any) => {
              const sLetter = (s.section || '').replace(/.*?([A-Z])\s*$/, '$1').toUpperCase()
              if (sLetter !== secLetter) return false
              const sLab = (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim()
              return sLab === batchNorm
            })
          })
          if (active.length > 0) prunedBatches[secLetter] = active
        })

        setCustomSections(prunedSecs)
        setCustomLabBatches(prunedBatches)
        try {
          localStorage.setItem('smartattend_custom_sections', JSON.stringify(prunedSecs))
          localStorage.setItem('smartattend_custom_lab_batches', JSON.stringify(prunedBatches))
        } catch {}

        // Also persist pruned meta to server
        if (studentsForPrune.length > 0) {
          fetch('/api/admin/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              students: studentsForPrune,
              customSections: prunedSecs,
              customLabBatches: prunedBatches
            })
          }).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsStudentsLoaded(true)
      })
  }, [])

  // Auto-sync students_data changes to storage after initial load
  useEffect(() => {
    if (!isStudentsLoaded) return
    persistStudents(students_data, customSections, customLabBatches)
  }, [students_data, isStudentsLoaded])

  // Per-Year Semester Cycle State ('ODD' | 'EVEN' per year), persisted across reloads in localStorage
  const [semCycleByYear, setSemCycleByYear] = useState<Record<string, 'ODD' | 'EVEN'>>({
    '1st Year': 'ODD',
    '2nd Year': 'ODD',
    '3rd Year': 'ODD',
    '4th Year': 'ODD',
  })
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promotingSubmitting, setPromotingSubmitting] = useState(false)

  // Initialize semCycleByYear from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartattend_sem_cycle_by_year')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setSemCycleByYear(prev => ({ ...prev, ...parsed }))
          return
        }
      }
      // Migration fallback from old single semCycle if present
      const oldGlobal = localStorage.getItem('smartattend_sem_cycle')
      if (oldGlobal === 'ODD' || oldGlobal === 'EVEN') {
        setSemCycleByYear({
          '1st Year': oldGlobal,
          '2nd Year': oldGlobal,
          '3rd Year': oldGlobal,
          '4th Year': oldGlobal,
        })
      }
    } catch {
      // localStorage may not be accessible in some environments
    }
  }, [])

  const handleToggleYearSemCycle = (year: string, newCycle: 'ODD' | 'EVEN') => {
    setSemCycleByYear(prev => {
      const updated = { ...prev, [year]: newCycle }
      try {
        localStorage.setItem('smartattend_sem_cycle_by_year', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  // Create Lab Batch Modal state (admin privileges)
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
  const [newBatchSection, setNewBatchSection] = useState('A')
  const [newBatchName, setNewBatchName] = useState('')
  const [newBatchError, setNewBatchError] = useState('')

  // Create Section Modal state (admin privileges)
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false)
  const [newSectionLetter, setNewSectionLetter] = useState('')
  const [newSectionError, setNewSectionError] = useState('')

  // Actions menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)

  // Global toast feedback message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Update Student Modal state (as in zattendence)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updatingStudent, setUpdatingStudent] = useState<Student | null>(null)
  const [updateName, setUpdateName] = useState('')
  const [updateDeviceStatus, setUpdateDeviceStatus] = useState('Registered')
  const [updateSubmitting, setUpdateSubmitting] = useState(false)
  const [updateError, setUpdateError] = useState('')

  // Device Management Modal state (as in zattendence)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [deviceStudent, setDeviceStudent] = useState<Student | null>(null)
  const [deviceResetting, setDeviceResetting] = useState(false)
  const [deviceMessage, setDeviceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete Student Modal state (as in zattendence)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<any>(null)
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  const [newStudentPassword, setNewStudentPassword] = useState('')
  const [selectedStudentForCredentials, setSelectedStudentForCredentials] = useState<any>(null)
  const [lastAddedStudent, setLastAddedStudent] = useState<Student | null>(null)

  // Import Students Modal state (1st page right side, as in zoattendence)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload')
  const [importYear, setImportYear] = useState<string>('1st Year')
  const [importSemester, setImportSemester] = useState<string>('1st Sem')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null)

  // Close action menu on click outside
  useEffect(() => {
    const handleDocumentClick = () => setOpenActionMenuId(null)
    if (openActionMenuId !== null) {
      document.addEventListener('click', handleDocumentClick)
      return () => document.removeEventListener('click', handleDocumentClick)
    }
  }, [openActionMenuId])

  // Action handlers
  const handleOpenUpdateModal = (student: Student) => {
    setUpdatingStudent(student)
    setUpdateName(student.name || '')
    setUpdateDeviceStatus(
      student.device === 'Linked' || student.device === 'Registered' ? 'Registered' : 'Not Registered'
    )
    setUpdateError('')
    setShowUpdateModal(true)
  }

  const handleSaveUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!updatingStudent) return
    const cleanName = updateName.trim()
    if (!cleanName) {
      setUpdateError('Student name cannot be empty')
      return
    }

    setUpdateSubmitting(true)
    setUpdateError('')

    const updatedDevice = updateDeviceStatus === 'Registered' ? 'Linked' : 'Not Linked'

    setStudentsData(prev => prev.map(s => {
      if (s.usn === updatingStudent.usn) {
        return {
          ...s,
          name: cleanName,
          device: updatedDevice
        }
      }
      return s
    }))

    setShowUpdateModal(false)
    setUpdateSubmitting(false)
    setToastMessage({
      type: 'success',
      text: `Student "${cleanName}" updated successfully.`
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const handleOpenDeviceModal = (student: Student) => {
    setDeviceStudent(student)
    setDeviceMessage(null)
    setShowDeviceModal(true)
  }

  const handleResetStudentDevice = () => {
    if (!deviceStudent) return
    setDeviceResetting(true)
    setDeviceMessage(null)

    setTimeout(() => {
      setStudentsData(prev => prev.map(s => {
        if (s.usn === deviceStudent.usn) {
          return {
            ...s,
            device: 'Not Linked'
          }
        }
        return s
      }))
      setDeviceStudent(prev => prev ? { ...prev, device: 'Not Linked' } : null)
      setDeviceResetting(false)
      setDeviceMessage({
        type: 'success',
        text: 'Device binding reset successfully. Student can now register a new device.'
      })
      setToastMessage({
        type: 'success',
        text: `Device binding for ${deviceStudent.name} (${deviceStudent.usn}) reset.`
      })
      setTimeout(() => setToastMessage(null), 5000)
    }, 400)
  }

  const handleOpenDeleteModal = (student: Student) => {
    setDeletingStudent(student)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  // Helper: prune sections and lab batches that have zero students left after a deletion
  const pruneEmptySectionsAndBatches = (remainingStudents: any[], currentSections: Record<string, string[]>, currentBatches: Record<string, string[]>) => {
    const prunedSections: Record<string, string[]> = {}
    Object.entries(currentSections).forEach(([key, secs]) => {
      const [yr, sm] = key.split('_')
      const activeSecs = secs.filter(sec => {
        const letter = getSectionLetter(sec)
        return remainingStudents.some(
          s => s.year === yr && s.semester === sm && getSectionLetter(s.section) === letter && isStudentInDept(s.dept, adminDept)
        )
      })
      if (activeSecs.length > 0) {
        prunedSections[key] = activeSecs
      }
    })

    const prunedBatches: Record<string, string[]> = {}
    Object.entries(currentBatches).forEach(([secLetter, batches]) => {
      const activeBatches = batches.filter(batch => {
        const batchNorm = batch.toUpperCase().replace(/^LAB\s*/i, '').trim()
        return remainingStudents.some(s => {
          const sLetter = getSectionLetter(s.section)
          if (sLetter !== secLetter) return false
          const sLab = (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim()
          return sLab === batchNorm
        })
      })
      if (activeBatches.length > 0) {
        prunedBatches[secLetter] = activeBatches
      }
    })

    return { prunedSections, prunedBatches }
  }

  const handleConfirmDeleteStudent = () => {
    if (!deletingStudent) return
    setDeleteSubmitting(true)
    setDeleteError('')

    setTimeout(() => {
      const remainingStudents = students_data.filter(s => s.usn !== deletingStudent.usn)
      setStudentsData(remainingStudents)

      // If the deleted student was the last student in the currently selected section, reset to ALL
      if (selectedSection && selectedSection !== 'ALL') {
        const hasStudentsLeft = remainingStudents.some(
          s => s.year === selectedYear && s.semester === selectedSem && getSectionLetter(s.section) === getSectionLetter(selectedSection) && isStudentInDept(s.dept, adminDept)
        )
        if (!hasStudentsLeft) {
          setSelectedSection('ALL')
          setSelectedLabBatch('ALL')
        }
      }

      // If the deleted student was the last student in the currently selected lab batch, reset to ALL
      if (selectedLabBatch && selectedLabBatch !== 'ALL') {
        const delBatch = (deletingStudent.Lab || deletingStudent.lab || `${getSectionLetter(deletingStudent.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim()
        if (selectedLabBatch.toUpperCase() === delBatch) {
          const hasBatchStudentsLeft = remainingStudents.some(
            s => s.year === selectedYear &&
                 s.semester === selectedSem &&
                 (selectedSection === 'ALL' || getSectionLetter(s.section) === getSectionLetter(selectedSection)) &&
                 ((s.Lab || s.lab || `${getSectionLetter(s.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim() === delBatch) &&
                 isStudentInDept(s.dept, adminDept)
          )
          if (!hasBatchStudentsLeft) {
            setSelectedLabBatch('ALL')
          }
        }
      }

      // Prune any sections and lab batches that now have zero students
      const { prunedSections, prunedBatches } = pruneEmptySectionsAndBatches(remainingStudents, customSections, customLabBatches)
      setCustomSections(prunedSections)
      setCustomLabBatches(prunedBatches)

      persistStudents(remainingStudents, prunedSections, prunedBatches)
      setDeleteSubmitting(false)
      setShowDeleteModal(false)
      setDeletingStudent(null)

      setToastMessage({
        type: 'success',
        text: `Student "${deletingStudent.name}" removed from directory.`
      })
      setTimeout(() => setToastMessage(null), 5000)
    }, 400)
  }

  // Add Student Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    usn: '',
    year: '',
    semester: '',
    section: '',
    labBatch: '',
    account: 'Active',
    device: 'Not Registered',
    password: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Dynamic admin department from authenticated session
  const [adminDept, setAdminDept] = useState<string>(initialAdminDept)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('smartattend_admin_dept')
      if (stored) setAdminDept(stored.toUpperCase())
    } catch {}

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.authenticated && data?.user?.dept) {
          const dept = data.user.dept.toUpperCase()
          setAdminDept(dept)
          try {
            localStorage.setItem('smartattend_admin_dept', dept)
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  // Helper to safely extract value from either string or ChangeEvent
  const updateFormField = (field: string, valOrEvent: any) => {
    let value = valOrEvent && typeof valOrEvent === 'object' && 'target' in valOrEvent
      ? valOrEvent.target.value
      : (typeof valOrEvent === 'string' ? valOrEvent : '')
    if (field === 'usn') {
      value = value.slice(0, 10).toUpperCase()
    }
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => {
      if (!prev[field]) return prev
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Helper to get available sections for any year and semester (empty sections removed automatically, deduplicated canonically)
  const getSectionsForYearAndSem = (year: string, sem: string) => {
    if (!year) return []
    const yearNum = year.match(/\d/)?.[0] || '1'

    // 1. Only include sections that contain at least 1 student belonging to adminDept
    const fromData = students_data
      .filter(s => s.year === year && (!sem || s.semester === sem) && isStudentInDept(s.dept, adminDept))
      .map(s => s.section)
      .filter(Boolean)

    const rawCandidates = new Set<string>(fromData)

    // 2. Include custom sections created by admin, strictly filtered to current department
    const key = `${year}_${sem}`
    if (customSections[key]) {
      customSections[key].forEach(sec => {
        if (isSectionInDept(sec, adminDept)) {
          rawCandidates.add(sec)
        }
      })
    }

    // 3. Keep active selected section visible if user is currently viewing/creating it in this year & sem
    if (year === selectedYear && sem === selectedSem && selectedSection && selectedSection !== 'ALL') {
      if (isSectionInDept(selectedSection, adminDept)) {
        rawCandidates.add(selectedSection)
      }
    }

    // 4. Canonical deduplication by section letter (A, B, C, etc.)
    // Ensures there is NEVER more than ONE Section A, Section B, etc.
    const byLetter = new Map<string, string>()
    rawCandidates.forEach(sec => {
      const letter = getSectionLetter(sec)
      if (!letter) return
      const current = byLetter.get(letter)
      if (!current) {
        byLetter.set(letter, sec)
      } else if (sec.toUpperCase().includes(adminDept.toUpperCase()) && !current.toUpperCase().includes(adminDept.toUpperCase())) {
        byLetter.set(letter, sec)
      }
    })

    // If there are no sections at all yet for this year & sem, provide default Section A (e.g. ECE 2A)
    if (byLetter.size === 0) {
      byLetter.set('A', `${adminDept} ${yearNum}A`)
    }

    // Return list sorted alphabetically by section letter
    return Array.from(byLetter.keys())
      .sort()
      .map(letter => byLetter.get(letter)!)
  }

  // Academic years strictly 1st to 4th Year (no Alumni section)
  const years = useMemo(() => {
    return DEFAULT_YEARS
  }, [])

  // Get sections for current selected year & semester (empty sections removed automatically)
  const sectionsForCurrentSem = useMemo(() => {
    if (!selectedYear || !selectedSem) return []
    return getSectionsForYearAndSem(selectedYear, selectedSem)
  }, [selectedYear, selectedSem, students_data, adminDept, selectedSection])

  // Available batches for current selected section or aggregated for all sections (empty batches removed automatically)
  const availableBatchesForActiveSection = useMemo(() => {
    if (!selectedYear || !selectedSem) return []

    // 1. Get students for the active year, semester, and section
    let list = students_data.filter(s => s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept))
    if (selectedSection && selectedSection !== 'ALL') {
      list = list.filter(s => getSectionLetter(s.section) === getSectionLetter(selectedSection))
    }

    // 2. Extract only batches that currently have at least 1 student
    const batchesWithStudents = new Set<string>()
    list.forEach(s => {
      const raw = (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim()
      const batch = raw || `${getSectionLetter(s.section)}1`
      if (batch) batchesWithStudents.add(batch)
    })

    // 3. Keep active selected batch visible if user is currently viewing/creating it
    if (selectedLabBatch && selectedLabBatch !== 'ALL') {
      batchesWithStudents.add(selectedLabBatch)
    }

    return Array.from(batchesWithStudents).sort()
  }, [selectedYear, selectedSem, selectedSection, selectedLabBatch, students_data, adminDept])

  // Available candidate batches for Add Student modal
  const availableBatchesForAddModal = useMemo(() => {
    const sec = formData.section || selectedSection || `${adminDept} 1A`
    const secLetter = getSectionLetter(sec)
    const yr = formData.year || selectedYear || '1st Year'
    const sm = formData.semester || selectedSem || '1st Sem'
    const existing = Array.from(
      new Set(
        students_data
          .filter(s => s.year === yr && s.semester === sm && getSectionLetter(s.section) === secLetter && isStudentInDept(s.dept, adminDept))
          .map(s => (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim())
          .filter(Boolean)
      )
    )
    const created = customLabBatches[secLetter] || []
    return Array.from(new Set([...existing, ...created, `${secLetter}1`])).sort()
  }, [formData.section, formData.year, formData.semester, selectedSection, selectedYear, selectedSem, students_data, adminDept, customLabBatches])

  const filtered = useMemo(() => {
    let result = students_data.filter(s => isStudentInDept(s.dept, adminDept))
    if (selectedYear) {
      result = result.filter(s => s.year === selectedYear)
    }
    if (selectedSem) {
      result = result.filter(s => s.semester === selectedSem)
    }
    if (selectedSection && selectedSection !== 'ALL') {
      result = result.filter(s => getSectionLetter(s.section) === getSectionLetter(selectedSection))
    }
    if (selectedLabBatch && selectedLabBatch !== 'ALL') {
      result = result.filter(s => {
        const lab = (s.Lab || s.lab || `${getSectionLetter(s.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim()
        const target = selectedLabBatch.toUpperCase().replace(/^LAB\s*/i, '').trim()
        return lab === target
      })
    }

    // Search by student name and/or USN
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.usn.toLowerCase().includes(q)
      )
    }

    // Implicitly sort by USN
    return result.sort((a, b) => a.usn.localeCompare(b.usn, undefined, { numeric: true }))
  }, [query, selectedYear, selectedSem, selectedSection, selectedLabBatch, students_data, adminDept])

  // Create Section (admin access)
  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedYear || !selectedSem) return
    let raw = newSectionLetter.trim().toUpperCase()
    if (!raw) {
      setNewSectionError('Section identifier or letter is required (e.g., C, D)')
      return
    }

    const letterMatch = raw.match(/([A-Z])$/)
    const letter = letterMatch ? letterMatch[1] : raw
    const yearNum = selectedYear.match(/\d/)?.[0] || '1'
    const formattedSec = raw.startsWith(adminDept) ? raw : `${adminDept} ${yearNum}${letter}`

    const existing = sectionsForCurrentSem
    if (existing.includes(formattedSec) || existing.some(s => getSectionLetter(s) === letter)) {
      setNewSectionError(`Section "${letter}" already exists for ${selectedSem}`)
      return
    }

    const key = `${selectedYear}_${selectedSem}`
    const updatedSections = {
      ...customSections,
      [key]: [...(customSections[key] || []), formattedSec]
    }

    // Provision default batches for this section
    const updatedBatches = {
      ...customLabBatches,
      [letter]: customLabBatches[letter] || [`${letter}1`, `${letter}2`, `${letter}3`, `${letter}4`]
    }

    setCustomSections(updatedSections)
    setCustomLabBatches(updatedBatches)
    persistStudents(students_data, updatedSections, updatedBatches)

    setSelectedSection(formattedSec)
    setSelectedLabBatch('ALL')
    setShowCreateSectionModal(false)
    setToastMessage({
      type: 'success',
      text: `Section ${letter} (${formattedSec}) created successfully for ${selectedSem}.`
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Create Lab Batch (admin access)
  const handleCreateLabBatch = (e: React.FormEvent) => {
    e.preventDefault()
    const sec = newBatchSection.toUpperCase()
    let name = newBatchName.trim().toUpperCase()
    if (!name) {
      setNewBatchError('Batch name is required (e.g., A3, B3)')
      return
    }
    if (/^\d+$/.test(name)) {
      name = `${sec}${name}`
    }
    const existing = customLabBatches[sec] || []
    if (existing.includes(name)) {
      setNewBatchError(`Lab batch "${name}" already exists for Section ${sec}`)
      return
    }
    const updated = [...existing, name].sort()
    const updatedBatches = { ...customLabBatches, [sec]: updated }
    setCustomLabBatches(updatedBatches)
    persistStudents(students_data, customSections, updatedBatches)
    setSelectedLabBatch(name)
    setShowCreateBatchModal(false)
    setToastMessage({
      type: 'success',
      text: `Lab Batch "${name}" created successfully for Section ${sec}.`
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Handle Import Preview
  const handlePreviewImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      setImportError('Please select an Excel (.xlsx, .xls) or CSV file.')
      return
    }
    setImportSubmitting(true)
    setImportError('')
    try {
      const sem = importSemester || YEAR_SEMESTERS[importYear]?.[0] || '1st Sem'
      const data = await parseStudentFileClient(
        importFile,
        adminDept,
        importYear,
        sem,
        students_data
      )
      setImportPreview(data)
      setImportStep('preview')
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse file. Please verify format.')
    } finally {
      setImportSubmitting(false)
    }
  }

  // Handle Commit Import into Directory
  const handleCommitImport = () => {
    if (!importPreview) return
    const eligibleStudents = importPreview.students.filter(s => s.status === 'READY' || s.status === 'ALREADY_EXISTS')
    if (eligibleStudents.length === 0) return
    setImportSubmitting(true)

    const updatedStudents = [...students_data]
    const addedCount = importPreview.readyToImport
    const updatedCount = importPreview.alreadyExists

    eligibleStudents.forEach(st => {
      const existingIndex = updatedStudents.findIndex(s => s.usn.toUpperCase() === st.usn.toUpperCase())
      if (existingIndex >= 0) {
        // Update existing student with current year, semester, section and active status
        updatedStudents[existingIndex] = {
          ...updatedStudents[existingIndex],
          name: st.name || updatedStudents[existingIndex].name,
          dept: adminDept,
          year: st.year,
          semester: st.semester,
          section: st.section,
          Lab: st.labBatch || updatedStudents[existingIndex].Lab,
          lab: st.labBatch || updatedStudents[existingIndex].lab,
          account: 'Active'
        }
      } else {
        // Add new student
        updatedStudents.push({
          name: st.name,
          email: st.email || `${st.usn.toLowerCase()}@klsvdit.edu.in`,
          usn: st.usn,
          dept: adminDept,
          year: st.year,
          semester: st.semester,
          section: st.section,
          Lab: st.labBatch,
          lab: st.labBatch,
          account: 'Active',
          device: 'Not Linked',
          deviceBound: false,
          boundDeviceName: null
        })
      }
    })

    // Provision any new sections and lab batches
    const updatedSections = { ...customSections }
    const updatedBatches = { ...customLabBatches }

    eligibleStudents.forEach(st => {
      const secKey = `${st.year}_${st.semester}`
      const secLetter = getSectionLetter(st.section)
      const existing = updatedSections[secKey] || []
      // Deduplicate by section letter and ensure only department sections exist
      if (!existing.some(s => getSectionLetter(s) === secLetter)) {
        updatedSections[secKey] = [...existing.filter(s => isSectionInDept(s, adminDept)), st.section]
      }
      const existingBatches = updatedBatches[secLetter] || []
      if (st.labBatch && !existingBatches.includes(st.labBatch)) {
        updatedBatches[secLetter] = [...existingBatches, st.labBatch].sort()
      }
    })

    setCustomSections(updatedSections)
    setCustomLabBatches(updatedBatches)

    setStudentsData(updatedStudents)
    persistStudents(updatedStudents, updatedSections, updatedBatches)

    setImportSubmitting(false)
    setShowImportModal(false)
    setImportFile(null)
    setImportPreview(null)
    setImportStep('upload')

    const summaryText = addedCount > 0 && updatedCount > 0
      ? `Imported ${addedCount} new and updated ${updatedCount} existing students in ${adminDept} (${importPreview.year}).`
      : addedCount > 0
      ? `Successfully imported ${addedCount} students into ${adminDept} (${importPreview.year}). Saved to directory.`
      : `Successfully updated ${updatedCount} existing students to ${importPreview.year} (${importPreview.semester}). Saved to directory.`

    setToastMessage({
      type: 'success',
      text: summaryText
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Handle Export Students to Excel (.xlsx) matching zoattendence
  const handleExportStudents = () => {
    const dataToExport = filtered.length > 0
      ? filtered
      : students_data.filter(s => {
          let matches = isStudentInDept(s.dept, adminDept)
          if (selectedYear) matches = matches && s.year === selectedYear
          if (selectedSem) matches = matches && s.semester === selectedSem
          return matches
        })

    if (dataToExport.length === 0) {
      setToastMessage({
        type: 'error',
        text: 'No student records available to export for current selection.'
      })
      setTimeout(() => setToastMessage(null), 4000)
      return
    }

    const rows = dataToExport.map(s => ({
      'USN': s.usn,
      'Name': s.name,
      'Department': s.dept,
      'Semester': s.semester,
      'Section': getSectionDisplayName(s.section),
      'Lab Batch': (s.Lab || s.lab || `${getSectionLetter(s.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim(),
      'Academic Year': s.year,
      'Email': s.email || `${s.usn.toLowerCase()}@klsvdit.edu.in`,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')

    const safeYear = (selectedYear || 'All_Years').replace(/\s+/g, '_')
    const safeSem = (selectedSem || 'All_Sems').replace(/\s+/g, '_')
    const safeSec = (selectedSection && selectedSection !== 'ALL' ? selectedSection : 'All_Sections').replace(/\s+/g, '_')
    const fileName = `students_${adminDept}_${safeYear}_${safeSem}_${safeSec}_${new Date().toISOString().split('T')[0]}.xlsx`

    XLSX.writeFile(workbook, fileName)

    setToastMessage({
      type: 'success',
      text: `Exported ${dataToExport.length} student records to "${fileName}".`
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Add Student
  const handleAddStudent = () => {
    const targetYear = formData.year || selectedYear || ''
    const targetSem = formData.semester || selectedSem || ''
    const targetSection = (formData.section || (selectedSection !== 'ALL' ? selectedSection : sectionsForCurrentSem[0]) || `${adminDept} ${targetYear.match(/\d/)?.[0] || '1'}A`).trim()
    const secLetter = getSectionLetter(targetSection)
    const targetLab = (formData.labBatch || `${secLetter}1`).trim()

    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Student name is required'
    if (!formData.usn.trim()) errors.usn = 'USN (Register Number) is required'
    if (!targetYear) errors.year = 'Academic year is missing'
    if (!targetSem) errors.semester = 'Semester is missing'
    if (!targetSection) errors.section = 'Section is missing'
    if (!targetLab) errors.labBatch = 'Lab batch is missing'

    const cleanUsn = formData.usn.trim().toUpperCase().slice(0, 10)
    const expectedDeptCode = getDeptCodeFromDept(adminDept)
    if (!cleanUsn) errors.usn = 'USN (Register Number) is required'
    else if (cleanUsn.length > 10) errors.usn = 'USN cannot exceed 10 characters'
    else if (!isUsnInDept(cleanUsn, adminDept)) {
      errors.usn = `USN must match ${adminDept} department (expected branch code '${expectedDeptCode}', e.g. 2VD__${expectedDeptCode}___)`
    } else if (students_data.some(s => s.usn.toUpperCase() === cleanUsn)) {
      errors.usn = 'A student with this USN already exists'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const isDeviceReg = formData.device === 'Registered'
    const defaultEmail = `${cleanUsn.toLowerCase()}@klsvdit.edu.in`
    const newStudent: Student = {
      name: formData.name.trim(),
      email: formData.email.trim() || defaultEmail,
      usn: cleanUsn,
      dept: adminDept,
      year: targetYear,
      semester: targetSem,
      section: targetSection,
      Lab: targetLab,
      lab: targetLab,
      account: 'Active',
      device: isDeviceReg ? 'Linked' : 'Not Linked',
      deviceBound: isDeviceReg,
      boundDeviceName: isDeviceReg ? `${formData.name.trim().split(' ')[0]}'s Device` : null,
    }

    setStudentsData(prev => [...prev, newStudent])
    setLastAddedStudent(newStudent)
    setShowAddModal(false)
    setShowSuccessModal(true)

    // Navigate to the newly added student's year, semester, and section
    setSelectedYear(newStudent.year)
    setSelectedSem(newStudent.semester)
    setSelectedSection(newStudent.section)
    setSelectedLabBatch('ALL')

    setFormData({
      name: '',
      email: '',
      usn: '',
      year: '',
      semester: '',
      section: '',
      labBatch: '',
      account: 'Active',
      device: 'Not Registered',
      password: '',
    })
    setFormErrors({})
  }

  // Edit Student
  const handleEditStudent = () => {
    if (!studentToEdit) return

    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Student name is required'
    if (!formData.usn.trim()) errors.usn = 'USN (Register Number) is required'
    if (!formData.year) errors.year = 'Academic year is missing'
    if (!formData.semester) errors.semester = 'Semester is missing'
    if (!formData.section.trim()) errors.section = 'Section is missing'
    if (!formData.labBatch.trim()) errors.labBatch = 'Lab batch is missing'

    const cleanUsn = formData.usn.trim().toUpperCase().slice(0, 10)
    const expectedDeptCode = getDeptCodeFromDept(adminDept)
    if (!cleanUsn) errors.usn = 'USN (Register Number) is required'
    else if (cleanUsn.length > 10) errors.usn = 'USN cannot exceed 10 characters'
    else if (!isUsnInDept(cleanUsn, adminDept)) {
      errors.usn = `USN must match ${adminDept} department (expected branch code '${expectedDeptCode}', e.g. 2VD__${expectedDeptCode}___)`
    } else if (students_data.some(s => s.usn !== studentToEdit.usn && s.usn.toUpperCase() === cleanUsn)) {
      errors.usn = 'Another student with this USN already exists'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const targetYear = formData.year
    const targetSem = formData.semester
    const targetSection = formData.section.trim()
    const targetLab = formData.labBatch.trim()
    const isDeviceReg = formData.device === 'Registered'

    const updated = students_data.map(s =>
      s.usn === studentToEdit.usn
        ? {
          ...s,
          name: formData.name.trim(),
          email: formData.email.trim() || `${cleanUsn.toLowerCase()}@klsvdit.edu.in`,
          usn: cleanUsn,
          year: targetYear,
          semester: targetSem,
          section: targetSection,
          Lab: targetLab,
          lab: targetLab,
          device: isDeviceReg ? 'Linked' : 'Not Linked',
          deviceBound: isDeviceReg,
          boundDeviceName: isDeviceReg ? (s.boundDeviceName || `${formData.name.trim().split(' ')[0]}'s Device`) : null,
        }
        : s
    )

    setStudentsData(updated)
    setShowEditModal(false)
    setStudentToEdit(null)

    // Redirect view to the student's updated semester and section
    setSelectedYear(targetYear)
    setSelectedSem(targetSem)
    setSelectedSection(targetSection)
    setSelectedLabBatch('ALL')

    setFormData({ name: '', email: '', usn: '', year: '', semester: '', section: '', labBatch: '', account: 'Active', device: 'Not Registered', password: '' })
    setFormErrors({})
    setToastMessage({
      type: 'success',
      text: `Student "${formData.name.trim()}" updated successfully.`
    })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Handle Bulk Promotion of Students to Next Semester
  const handleExecuteBulkPromote = () => {
    if (!selectedSem || !selectedYear || selectedSem === '8th Sem') return
    const progression = SEMESTER_PROGRESSION[selectedSem]
    if (!progression) return

    setPromotingSubmitting(true)
    setTimeout(() => {
      const promotedCount = students_data.filter(
        s => s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept)
      ).length

      setStudentsData(prev =>
        prev.map(s => {
          if (s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept)) {
            return {
              ...s,
              year: progression.nextYear,
              semester: progression.nextSem,
            }
          }
          return s
        })
      )

      // Smart Bulk Promotion: Update active semester specifically for the destination year, leaving other batches untouched
      const destCycle: 'ODD' | 'EVEN' = isOddSemester(progression.nextSem) ? 'ODD' : 'EVEN'
      setSemCycleByYear(prev => {
        const updated = { ...prev, [progression.nextYear]: destCycle }
        try {
          localStorage.setItem('smartattend_sem_cycle_by_year', JSON.stringify(updated))
        } catch {}
        return updated
      })

      setPromotingSubmitting(false)
      setShowPromoteModal(false)
      setSelectedSem(null) // Return to year overview
      setSelectedSection('ALL')
      setSelectedLabBatch('ALL')

      setToastMessage({
        type: 'success',
        text: `Successfully promoted ${promotedCount} students to ${progression.nextSem} (${progression.nextYear}). Active semester for ${progression.nextYear} set to ${destCycle === 'ODD' ? 'Odd' : 'Even'} Sem.`
      })
      setTimeout(() => setToastMessage(null), 5000)
    }, 400)
  }

  // Delete Student
  const handleDeleteStudent = () => {
    if (!studentToDelete) return
    const remainingStudents = students_data.filter(s => s.usn !== studentToDelete.usn)
    setStudentsData(remainingStudents)

    if (selectedSection && selectedSection !== 'ALL') {
      const hasStudentsLeft = remainingStudents.some(
        s => s.year === selectedYear && s.semester === selectedSem && getSectionLetter(s.section) === getSectionLetter(selectedSection) && isStudentInDept(s.dept, adminDept)
      )
      if (!hasStudentsLeft) {
        setSelectedSection('ALL')
        setSelectedLabBatch('ALL')
      }
    }

    if (selectedLabBatch && selectedLabBatch !== 'ALL') {
      const delBatch = (studentToDelete.Lab || studentToDelete.lab || `${getSectionLetter(studentToDelete.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim()
      if (selectedLabBatch.toUpperCase() === delBatch) {
        const hasBatchStudentsLeft = remainingStudents.some(
          s => s.year === selectedYear &&
               s.semester === selectedSem &&
               (selectedSection === 'ALL' || s.section === selectedSection) &&
               ((s.Lab || s.lab || `${getSectionLetter(s.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim() === delBatch) &&
               isStudentInDept(s.dept, adminDept)
        )
        if (!hasBatchStudentsLeft) {
          setSelectedLabBatch('ALL')
        }
      }
    }

    // Prune any sections and lab batches that now have zero students
    const { prunedSections, prunedBatches } = pruneEmptySectionsAndBatches(remainingStudents, customSections, customLabBatches)
    setCustomSections(prunedSections)
    setCustomLabBatches(prunedBatches)
    persistStudents(remainingStudents, prunedSections, prunedBatches)

    setShowDeleteConfirm(false)
    setStudentToDelete(null)
  }

  const openEditModal = (student: Student) => {
    setStudentToEdit(student)
    const secLetter = getSectionLetter(student.section)
    const lab = (student.Lab || student.lab || `${secLetter}1`).toUpperCase().replace(/^LAB\s*/i, '').trim()
    setFormData({
      name: student.name,
      email: student.email || '',
      usn: student.usn,
      year: student.year,
      semester: student.semester || (YEAR_SEMESTERS[student.year]?.[0] || '1st Sem'),
      section: student.section,
      labBatch: lab,
      account: student.account || 'Active',
      device: student.device === 'Linked' || student.device === 'Registered' ? 'Registered' : 'Not Registered',
      password: '',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const openDeleteConfirm = (student: any) => {
    setStudentToDelete(student)
    setShowDeleteConfirm(true)
  }

  const openCredentialsModal = (student: any) => {
    setSelectedStudentForCredentials(student)
    setShowCredentialsModal(true)
  }

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage student directory, devices, and accounts.</p>
            </div>
            {!selectedSem && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportYear('1st Year')
                    setImportSemester('1st Sem')
                    setImportFile(null)
                    setImportPreview(null)
                    setImportStep('upload')
                    setImportError('')
                    setShowImportModal(true)
                  }}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Students
                </button>
              </div>
            )}
          </div>

          {/* Level 1: Year Selection Cards with Semester Dropdowns */}
          {!selectedSem && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Select Year to View Semesters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start relative">
                  {years.map(year => {
                    const sems = YEAR_SEMESTERS[year] || []
                    const yearCycle = semCycleByYear[year] || 'ODD'
                    const totalYearStudents = students_data.filter(s => s.year === year && isStudentInDept(s.dept, adminDept)).length
                    const activeYearStudents = students_data.filter(
                      s => s.year === year && isStudentInDept(s.dept, adminDept) && isSemesterActive(s.semester, yearCycle)
                    ).length
                    const isOpen = openYearDropdown === year

                    return (
                      <div
                        key={year}
                        className="relative"
                      >
                        {/* Year Header Button */}
                        <button
                          type="button"
                          onClick={() => setOpenYearDropdown(isOpen ? null : year)}
                          className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all bg-card cursor-pointer ${
                            isOpen ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/60 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                              {year}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              <strong className="text-foreground font-semibold">{activeYearStudents} active</strong> · {totalYearStudents} total • {sems.length} Semesters
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-md transition-all duration-200 ${isOpen ? 'rotate-180 bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted group-hover:bg-accent'}`}>
                            <ChevronDown className="size-4" />
                          </div>
                        </button>

                        {/* Floating Semester Dropdown */}
                        {isOpen && (
                          <>
                            {/* Click-outside backdrop */}
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenYearDropdown(null)}
                            />

                            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-card rounded-xl border border-border shadow-xl p-2.5 space-y-2 animate-in fade-in-50 zoom-in-95">
                              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                                <span>Select Semester</span>
                                {/* Sleek integrated Odd / Even pill toggle */}
                                <div className="flex items-center p-0.5 rounded-md border border-border bg-muted/80 text-[10px] lowercase normal-case tracking-normal">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleYearSemCycle(year, 'ODD')
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                      yearCycle === 'ODD'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Odd
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleYearSemCycle(year, 'EVEN')
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                      yearCycle === 'EVEN'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Even
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {sems.map(sem => {
                                  const semStudents = students_data.filter(
                                    s => s.year === year && s.semester === sem && isStudentInDept(s.dept, adminDept)
                                  ).length
                                  const isActive = isSemesterActive(sem, yearCycle)

                                  if (isActive) {
                                    return (
                                      <button
                                        key={sem}
                                        type="button"
                                        onClick={() => {
                                          setSelectedYear(year)
                                          setSelectedSem(sem)
                                          setSelectedSection('ALL')
                                          setOpenYearDropdown(null)
                                        }}
                                        className="w-full p-2.5 rounded-lg border-2 border-primary/40 bg-primary/5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs"
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary-foreground">
                                              {sem}
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary text-primary-foreground group-hover:bg-primary-foreground group-hover:text-primary">
                                              Active
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-muted-foreground group-hover:text-primary-foreground/80 mt-0.5">
                                            {semStudents} students
                                          </div>
                                        </div>
                                        <span className="text-xs font-bold text-primary group-hover:text-primary-foreground transition-transform group-hover:translate-x-0.5">
                                          →
                                        </span>
                                      </button>
                                    )
                                  }

                                  // Inactive semester (greyed out, disabled)
                                  return (
                                    <div
                                      key={sem}
                                      className="w-full p-2.5 rounded-lg border border-dashed border-border/80 bg-muted/40 opacity-60 text-left flex items-center justify-between cursor-not-allowed select-none"
                                    >
                                      <div>
                                        <div className="font-semibold text-sm text-muted-foreground">
                                          {sem}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground italic mt-0.5">
                                          Currently {yearCycle === 'ODD' ? 'Odd' : 'Even'} Semester is ongoing
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                                          {semStudents} students
                                        </div>
                                      </div>
                                      <Lock className="size-3.5 text-muted-foreground/60" />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Level 2: Semester & Section View with Table */}
          {selectedSem && (
            <div className="space-y-4">
              {/* Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSem(null)
                      setSelectedSection('ALL')
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    Back to Years
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{selectedYear}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary">
                      {selectedSem}
                    </span>
                  </div>
                </div>

                {/* Right side actions: Bulk Promote Button (for active semester with students, excluded for 8th Sem) */}
                {selectedSem && selectedSem !== '8th Sem' && isSemesterActive(selectedSem, semCycleByYear[selectedYear || ''] || 'ODD') && SEMESTER_PROGRESSION[selectedSem] && students_data.some(s => s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPromoteModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <TrendingUp className="size-3.5" />
                      Bulk Promote → {SEMESTER_PROGRESSION[selectedSem].nextSem}
                    </button>
                  </div>
                )}
              </div>

              {/* Section & Lab Batch Selector Part of that Semester */}
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Sections & Lab Batches in {selectedSem} ({selectedYear})
                    </h3>

                  </div>
                </div>

                {/* Section Buttons / Tabs */}
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Section</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSection('ALL')
                        setSelectedLabBatch('ALL')
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSection === 'ALL'
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent text-foreground border-input'
                      }`}
                    >
                      All Sections ({students_data.filter(s => s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept)).length})
                    </button>

                    {sectionsForCurrentSem.map(sec => {
                      const secLetter = getSectionLetter(sec)
                      const secCount = students_data.filter(
                        s => s.year === selectedYear && s.semester === selectedSem && getSectionLetter(s.section) === secLetter && isStudentInDept(s.dept, adminDept)
                      ).length
                      
                      if (secCount === 0) return null;

                      const isSelected = selectedSection === sec || (selectedSection !== 'ALL' && getSectionLetter(selectedSection) === secLetter)
                      const displayName = getSectionDisplayName(sec)

                      return (
                        <button
                          key={sec}
                          onClick={() => {
                            setSelectedSection(sec)
                            setSelectedLabBatch('ALL')
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-accent text-foreground border-input'
                          }`}
                        >
                          <span>{displayName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {secCount}
                          </span>
                        </button>
                      )
                    })}

                    {/* Admin Access: Create New Section Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const existingLetters = sectionsForCurrentSem.map(s => getSectionLetter(s))
                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                        let nextLetter = 'C'
                        for (const char of alphabet) {
                          if (!existingLetters.includes(char)) {
                            nextLetter = char
                            break
                          }
                        }
                        setNewSectionLetter(nextLetter)
                        setNewSectionError('')
                        setShowCreateSectionModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Section</span>
                    </button>
                  </div>
                </div>

                {/* Lab Batches Row (Only 1-click quick toggle pill badges, dropdown removed) */}
                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                      <span>Lab Batches</span>
                    </div>

                    {/* 1-Click Quick Toggle Pill Badges */}
                    <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
                      <button
                        type="button"
                        onClick={() => setSelectedLabBatch('ALL')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          selectedLabBatch === 'ALL'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        All
                      </button>
                      {availableBatchesForActiveSection.map(batch => {
                        const batchCount = students_data.filter(
                          s => s.year === selectedYear && s.semester === selectedSem && ((s.Lab || s.lab || `${getSectionLetter(s.section)}1`).toUpperCase().replace(/^LAB\s*/i, '').trim() === batch) && isStudentInDept(s.dept, adminDept) && (selectedSection === 'ALL' || getSectionLetter(s.section) === getSectionLetter(selectedSection))
                        ).length

                        if (batchCount === 0) return null;

                        const isSelected = selectedLabBatch === batch
                        return (
                          <button
                            key={batch}
                            type="button"
                            onClick={() => setSelectedLabBatch(batch)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                          >
                            {batch}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Admin Access: Create New Lab Batch Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const initialSecLetter = selectedSection && selectedSection !== 'ALL'
                        ? getSectionLetter(selectedSection)
                        : (sectionsForCurrentSem[0] ? getSectionLetter(sectionsForCurrentSem[0]) : 'A')
                      setNewBatchSection(initialSecLetter)
                      const existing = customLabBatches[initialSecLetter] || []
                      setNewBatchName(`${initialSecLetter}${existing.length + 1}`)
                      setNewBatchError('')
                      setShowCreateBatchModal(true)
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Lab Batch</span>
                  </button>
                </div>
              </div>

              {/* Table of Students in that Semester & Section */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by student name or USN..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportStudents}
                      title="Export students to Excel (.xlsx)"
                      className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={() => {
                        const defaultYear = selectedYear || '1st Year'
                        const defaultSem = selectedSem || (YEAR_SEMESTERS[defaultYear]?.[0] || '1st Sem')
                        const available = getSectionsForYearAndSem(defaultYear, defaultSem)
                        const defaultSec = selectedSection && selectedSection !== 'ALL' ? selectedSection : (available[0] || `${adminDept} 1A`)
                        const secLetter = getSectionLetter(defaultSec)
                        const existing = Array.from(
                          new Set(
                            students_data
                              .filter(s => s.year === defaultYear && s.semester === defaultSem && getSectionLetter(s.section) === secLetter && isStudentInDept(s.dept, adminDept))
                              .map(s => (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim())
                              .filter(Boolean)
                          )
                        )
                        const batches = Array.from(new Set([...existing, ...(customLabBatches[secLetter] || []), `${secLetter}1`])).sort()

                        const deptCode = getDeptCodeFromDept(adminDept)
                        const yy = getAdmissionYearFromAcademicYear(defaultYear)

                        setFormData({
                          name: '',
                          email: '',
                          usn: `2VD${yy}${deptCode}`,
                          year: defaultYear,
                          semester: defaultSem,
                          section: defaultSec,
                          labBatch: selectedLabBatch && selectedLabBatch !== 'ALL' ? selectedLabBatch : (batches[0] || `${secLetter}1`),
                          account: 'Active',
                          device: 'Not Registered',
                          password: ''
                        })
                        setFormErrors({})
                        setShowAddModal(true)
                      }}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Student
                    </button>
                  </div>
                </div>

                {/* Toast feedback banner */}
                {toastMessage && (
                  <div className={`p-3 px-4 text-xs border rounded-lg mb-4 flex items-center justify-between ${
                    toastMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {toastMessage.type === 'success' ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span>{toastMessage.text}</span>
                    </div>
                    <button type="button" onClick={() => setToastMessage(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3 border-b border-border">Student</th>
                        <th className="px-6 py-3 border-b border-border">USN</th>
                        <th className="px-6 py-3 border-b border-border">Semester</th>
                        <th className="px-6 py-3 border-b border-border">Section / Lab Batch</th>
                        <th className="px-6 py-3 border-b border-border">Device Status</th>
                        <th className="px-6 py-3 border-b border-border text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((s, i) => {
                        const semNum = s.semester?.replace(/[^0-9]/g, '') || s.semester || '1'
                        const secCode = s.section?.replace(/^.*?(\d?[A-Z])$/, '$1') || s.section
                        const labCode = s.Lab || s.lab || `${secCode.slice(-1)}1` || 'A1'
                        const isDeviceRegistered = s.device === 'Linked' || s.device === 'Registered'

                        return (
                          <tr key={s.usn || i} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-foreground">
                              <div>{s.name}</div>
                              {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{s.usn}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                                Semester {semNum}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border/60 font-mono">
                                {formatSectionLab(s.section, s.Lab || s.lab)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={isDeviceRegistered ? 'Registered' : 'Not Registered'} />
                            </td>
                            <td className="px-6 py-4 text-right relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenuId(openActionMenuId === s.usn ? null : s.usn)
                                }}
                                className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {openActionMenuId === s.usn && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-6 top-10 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg z-30 text-xs animate-in fade-in zoom-in-95 text-left"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      openEditModal(s)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Edit Student
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
                        )
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Users className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">No students in this view</p>
                                <p className="text-xs text-muted-foreground">
                                  {query.trim()
                                    ? `No student matching "${query}" found.`
                                    : `There are no students registered in ${selectedSem}${selectedSection !== 'ALL' ? ` (${selectedSection})` : ''} yet.`}
                                </p>
                              </div>
                              {!query.trim() && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectedYear) setImportYear(selectedYear)
                                      if (selectedSem) setImportSemester(selectedSem)
                                      setImportFile(null)
                                      setImportPreview(null)
                                      setImportStep('upload')
                                      setImportError('')
                                      setShowImportModal(true)
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-input bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    Import Excel/CSV
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultYear = selectedYear || '1st Year'
                                      const defaultSem = selectedSem || (YEAR_SEMESTERS[defaultYear]?.[0] || '1st Sem')
                                      const available = getSectionsForYearAndSem(defaultYear, defaultSem)
                                      const defaultSec = selectedSection && selectedSection !== 'ALL' ? selectedSection : (available[0] || `${adminDept} 1A`)
                                      const secLetter = getSectionLetter(defaultSec)
                                      const existing = Array.from(
                                        new Set(
                                          students_data
                                            .filter(s => s.year === defaultYear && s.semester === defaultSem && getSectionLetter(s.section) === secLetter && isStudentInDept(s.dept, adminDept))
                                            .map(s => (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim())
                                            .filter(Boolean)
                                        )
                                      )
                                      const batches = Array.from(new Set([...existing, ...(customLabBatches[secLetter] || []), `${secLetter}1`])).sort()

                                      const deptCode = getDeptCodeFromDept(adminDept)
                                      const yy = getAdmissionYearFromAcademicYear(defaultYear)

                                      setFormData({
                                        name: '',
                                        email: '',
                                        usn: `2VD${yy}${deptCode}`,
                                        year: defaultYear,
                                        semester: defaultSem,
                                        section: defaultSec,
                                        labBatch: selectedLabBatch && selectedLabBatch !== 'ALL' ? selectedLabBatch : (batches[0] || `${secLetter}1`),
                                        account: 'Active',
                                        device: 'Not Registered',
                                        password: ''
                                      })
                                      setFormErrors({})
                                      setShowAddModal(true)
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Student
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                  <span>Showing 1 to {filtered.length} of {filtered.length} entries</span>
                  <div className="flex gap-1">
                    <button disabled className="px-3 py-1 border border-input rounded-md opacity-50">Prev</button>
                    <button className="px-3 py-1 border border-input rounded-md bg-accent text-accent-foreground">1</button>
                    <button disabled className="px-3 py-1 border border-input rounded-md opacity-50">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREATE SECTION MODAL (ADMIN ACCESS) */}
          {showCreateSectionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Create Section</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add a new section for {selectedSem} ({selectedYear}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateSectionModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateSection} className="p-5 space-y-4">
                  {newSectionError && (
                    <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{newSectionError}</span>
                    </div>
                  )}

                  {/* Section Letter / Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Section Identifier / Letter</label>
                    <input
                      type="text"
                      required
                      value={newSectionLetter}
                      onChange={(e) => {
                        setNewSectionLetter(e.target.value.toUpperCase())
                        setNewSectionError('')
                      }}
                      placeholder="e.g. C, D, E"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Will create section <span className="font-mono font-semibold text-foreground">
                        {adminDept} {(selectedYear || '1').match(/\d/)?.[0] || '1'}{newSectionLetter.trim().toUpperCase() || 'C'}
                      </span> with 4 auto-provisioned lab batches (<span className="font-mono">{newSectionLetter.trim().toUpperCase() || 'C'}1</span> to <span className="font-mono">{newSectionLetter.trim().toUpperCase() || 'C'}4</span>).
                    </p>
                  </div>

                  {/* Existing sections in current semester */}
                  <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs">
                    <span className="text-muted-foreground">Existing sections in {selectedSem}: </span>
                    <span className="font-semibold text-foreground font-mono">
                      {sectionsForCurrentSem.map(s => getSectionDisplayName(s)).join(', ') || 'None'}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowCreateSectionModal(false)}
                      className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Create Section
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CREATE LAB BATCH MODAL (ADMIN ACCESS) */}
          {showCreateBatchModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Create Lab Batch</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add a new laboratory batch for {selectedSem} ({selectedYear}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateBatchModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateLabBatch} className="p-5 space-y-4">
                  {newBatchError && (
                    <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{newBatchError}</span>
                    </div>
                  )}

                  {/* Target Section */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Target Section</label>
                    <select
                      value={newBatchSection}
                      onChange={(e) => {
                        const secLetter = e.target.value
                        setNewBatchSection(secLetter)
                        const existing = customLabBatches[secLetter] || []
                        setNewBatchName(`${secLetter}${existing.length + 1}`)
                        setNewBatchError('')
                      }}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {sectionsForCurrentSem.map(sec => {
                        const letter = getSectionLetter(sec)
                        return (
                          <option key={sec} value={letter}>
                            {getSectionDisplayName(sec)} ({sec})
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Batch Name/Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Lab Batch Name / Code</label>
                    <input
                      type="text"
                      required
                      value={newBatchName}
                      onChange={(e) => {
                        setNewBatchName(e.target.value)
                        setNewBatchError('')
                      }}
                      placeholder="e.g. A3, A4, B3"
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Batch format will display as <span className="font-mono font-semibold text-foreground">{newBatchSection}/{newBatchName.trim().toUpperCase() || `${newBatchSection}1`}</span> in student records.
                    </p>
                  </div>

                  {/* Existing batches in this section */}
                  <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs">
                    <span className="text-muted-foreground">Existing batches in Section {newBatchSection}: </span>
                    <span className="font-semibold text-foreground font-mono">
                      {Array.from(new Set([
                        ...students_data
                          .filter(s => s.year === selectedYear && s.semester === selectedSem && getSectionLetter(s.section) === newBatchSection && isStudentInDept(s.dept, adminDept))
                          .map(s => (s.Lab || s.lab || '').toUpperCase().replace(/^LAB\s*/i, '').trim())
                          .filter(Boolean),
                        ...(customLabBatches[newBatchSection] || [])
                      ])).join(', ') || 'None yet'}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowCreateBatchModal(false)}
                      className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Create Batch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD STUDENT MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-foreground mb-4">Add Student</h2>

                <div className="space-y-4">
                  <div>
                    <Label required>Name</Label>
                    <Inp
                      type="text"
                      placeholder="Student name"
                      value={formData.name}
                      onChange={(val: any) => updateFormField('name', val)}
                      className="w-full mt-1"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Email</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Default: &lt;usn&gt;@klsvdit.edu.in
                      </span>
                    </div>
                    <Inp
                      type="email"
                      placeholder={formData.usn.trim() ? `${formData.usn.trim().toLowerCase()}@klsvdit.edu.in` : 'student_usn@klsvdit.edu.in'}
                      value={formData.email}
                      onChange={(val: any) => updateFormField('email', val)}
                      className="w-full mt-1"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label required>USN (Register Number)</Label>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                        {formData.usn.length}/10
                      </span>
                    </div>
                    <Inp
                      type="text"
                      maxLength={10}
                      placeholder={`e.g. 2VD${getAdmissionYearFromAcademicYear(formData.year || selectedYear)}${getDeptCodeFromDept(adminDept)}001`}
                      value={formData.usn}
                      onChange={(val: any) => updateFormField('usn', val)}
                      className="w-full font-mono uppercase"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Format: <span className="font-mono font-semibold text-foreground">2VD__{getDeptCodeFromDept(adminDept)}___</span> ({adminDept} department format, e.g. <span className="font-mono text-primary font-medium">2VD{getAdmissionYearFromAcademicYear(formData.year || selectedYear)}{getDeptCodeFromDept(adminDept)}009</span>).
                    </p>
                    {formErrors.usn && (
                      <p className="text-xs text-destructive mt-1">{formErrors.usn}</p>
                    )}
                  </div>

                  {/* Year - Auto-filled & Read-only */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Academic Year</Label>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Auto-filled
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.year || selectedYear || ''}
                        className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-muted/60 text-foreground text-sm font-medium cursor-not-allowed select-none outline-none"
                      />
                      <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    </div>
                  </div>

                  {/* Semester - Auto-filled & Read-only */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Semester</Label>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Auto-filled
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.semester || selectedSem || ''}
                        className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-muted/60 text-foreground text-sm font-medium cursor-not-allowed select-none outline-none"
                      />
                      <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    </div>
                  </div>

                  {/* Section: Writable when in All Sections, Locked when specific section is selected */}
                  {selectedSection === 'ALL' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label required>Section</Label>
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          Writable (All Sections View)
                        </span>
                      </div>
                      <select
                        value={formData.section}
                        onChange={(e) => {
                          const newSec = e.target.value
                          const secLetter = getSectionLetter(newSec)
                          const batches = customLabBatches[secLetter] || [`${secLetter}1`, `${secLetter}2`]
                          setFormData(prev => ({
                            ...prev,
                            section: newSec,
                            labBatch: batches[0] || `${secLetter}1`
                          }))
                        }}
                        className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        {sectionsForCurrentSem.map(sec => (
                          <option key={sec} value={sec}>
                            {getSectionDisplayName(sec)} ({sec})
                          </option>
                        ))}
                      </select>
                      {formErrors.section && (
                        <p className="text-xs text-destructive mt-1">{formErrors.section}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Section</Label>
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                          Auto-filled
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={getSectionDisplayName(formData.section || selectedSection)}
                          className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-muted/60 text-foreground text-sm font-medium cursor-not-allowed select-none outline-none"
                        />
                        <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Auto-locked to current section ({getSectionDisplayName(formData.section || selectedSection)}).
                      </p>
                    </div>
                  )}

                  {/* Lab Batch - Writable / Selectable */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label required>Lab Batch</Label>
                      <span className="text-[11px] text-muted-foreground">
                        Section {getSectionLetter(formData.section || selectedSection || 'A')} Batches
                      </span>
                    </div>
                    <select
                      value={formData.labBatch}
                      onChange={(e) => updateFormField('labBatch', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {availableBatchesForAddModal.map(batch => (
                        <option key={batch} value={batch}>
                          Lab Batch {batch}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Assigned laboratory batch (formatted as <span className="font-mono font-semibold text-foreground">{formatSectionLab(formData.section || selectedSection, formData.labBatch)}</span>).
                    </p>
                  </div>

                  {/* Device Status (Replaces Account Status) */}
                  <div>
                    <Label>Device Status</Label>
                    <select
                      value={formData.device}
                      onChange={(e) => updateFormField('device', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="Not Registered">Not Registered</option>
                      <option value="Registered">Registered</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Initial BLE mobile hardware binding status.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ name: '', email: '', usn: '', year: '', semester: '', section: '', labBatch: '', account: 'Active', device: 'Not Registered', password: '' })
                      setFormErrors({})
                    }}
                    className="flex-1 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-foreground text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStudent}
                    className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium cursor-pointer"
                  >
                    Add Student
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT STUDENT MODAL */}
          {showEditModal && studentToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Edit Student</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Update student profile, registration, and section placement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setStudentToEdit(null)
                      setFormData({ name: '', email: '', usn: '', year: '', semester: '', section: '', labBatch: '', account: 'Active', device: 'Not Registered', password: '' })
                      setFormErrors({})
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <Label required>Name</Label>
                    <Inp
                      type="text"
                      placeholder="Student name"
                      value={formData.name}
                      onChange={(val: any) => updateFormField('name', val)}
                      className="w-full mt-1"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* USN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label required>USN (Register Number)</Label>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                        {formData.usn.length}/10
                      </span>
                    </div>
                    <Inp
                      type="text"
                      maxLength={10}
                      placeholder={`e.g. 2VD${getAdmissionYearFromAcademicYear(formData.year)}${getDeptCodeFromDept(adminDept)}001`}
                      value={formData.usn}
                      onChange={(val: any) => updateFormField('usn', val)}
                      className="w-full font-mono uppercase"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Format: <span className="font-mono font-semibold text-foreground">2VD__{getDeptCodeFromDept(adminDept)}___</span> ({adminDept} department format, e.g. <span className="font-mono text-primary font-medium">2VD{getAdmissionYearFromAcademicYear(formData.year)}{getDeptCodeFromDept(adminDept)}009</span>).
                    </p>
                    {formErrors.usn && (
                      <p className="text-xs text-destructive mt-1">{formErrors.usn}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Email</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Default: &lt;usn&gt;@klsvdit.edu.in
                      </span>
                    </div>
                    <Inp
                      type="email"
                      placeholder={formData.usn.trim() ? `${formData.usn.trim().toLowerCase()}@klsvdit.edu.in` : 'student_usn@klsvdit.edu.in'}
                      value={formData.email}
                      onChange={(val: any) => updateFormField('email', val)}
                      className="w-full mt-1"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Academic Year - Auto-filled & Read-only */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Academic Year</Label>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Auto-filled
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.year}
                        className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-muted/60 text-foreground text-sm font-medium cursor-not-allowed select-none outline-none"
                      />
                      <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Enrolled academic year ({formData.year}).
                    </p>
                  </div>

                  {/* Semester - Auto-filled & Read-only */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Semester</Label>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Auto-filled
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formData.semester}
                        className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-muted/60 text-foreground text-sm font-medium cursor-not-allowed select-none outline-none"
                      />
                      <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Enrolled semester ({formData.semester}).
                    </p>
                  </div>

                  {/* Section */}
                  <div>
                    <Label required>Section</Label>
                    <select
                      value={formData.section}
                      onChange={(e) => {
                        const newSec = e.target.value
                        const secLetter = getSectionLetter(newSec)
                        const batches = customLabBatches[secLetter] || [`${secLetter}1`, `${secLetter}2`]
                        setFormData(prev => ({
                          ...prev,
                          section: newSec,
                          labBatch: batches[0] || `${secLetter}1`
                        }))
                        if (formErrors.section) setFormErrors(prev => { const n = { ...prev }; delete n.section; return n })
                      }}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {getSectionsForYearAndSem(formData.year, formData.semester).map(sec => (
                        <option key={sec} value={sec}>
                          {getSectionDisplayName(sec)} ({sec})
                        </option>
                      ))}
                    </select>
                    {formErrors.section && (
                      <p className="text-xs text-destructive mt-1">{formErrors.section}</p>
                    )}
                  </div>

                  {/* Lab Batch */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label required>Lab Batch</Label>
                      <span className="text-[11px] text-muted-foreground">
                        Section {getSectionLetter(formData.section)} Batches
                      </span>
                    </div>
                    <select
                      value={formData.labBatch}
                      onChange={(e) => updateFormField('labBatch', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {availableBatchesForAddModal.map(batch => (
                        <option key={batch} value={batch}>
                          Lab Batch {batch}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Formatted as <span className="font-mono font-semibold text-foreground">{formatSectionLab(formData.section, formData.labBatch)}</span>.
                    </p>
                  </div>

                  {/* Device Status */}
                  <div>
                    <Label>Device Status</Label>
                    <select
                      value={formData.device}
                      onChange={(e) => updateFormField('device', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="Not Registered">Not Registered</option>
                      <option value="Registered">Registered</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Mobile BLE attendance binding authorization.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setStudentToEdit(null)
                      setFormData({ name: '', email: '', usn: '', year: '', semester: '', section: '', labBatch: '', account: 'Active', device: 'Not Registered', password: '' })
                      setFormErrors({})
                    }}
                    className="flex-1 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-foreground text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditStudent}
                    className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DEVICE MANAGEMENT MODAL */}
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
                      <span className="text-muted-foreground">Section / Lab Batch:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatSectionLab(deviceStudent.section, deviceStudent.Lab || deviceStudent.lab)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Binding Status:</span>
                      <StatusBadge status={deviceStudent.device === 'Linked' || deviceStudent.device === 'Registered' ? 'Registered' : 'Not Registered'} />
                    </div>
                  </div>

                  {(deviceStudent.device === 'Linked' || deviceStudent.device === 'Registered') ? (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Registered Device Credentials</h3>
                      <div className="p-3 rounded-lg border border-border bg-background space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Authorized Mobile Device</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
                          <span>Key: SHA256:{(deviceStudent.usn + '-DEV-BIND').split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0).toString(16).toUpperCase().padStart(8, '0')}...</span>
                          <span>Registered: Verified Device</span>
                        </div>
                      </div>

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
                        This student has not yet bound a mobile device. Device binding occurs securely when the student logs in from the Automark mobile application.
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
                    {(deviceStudent.device === 'Linked' || deviceStudent.device === 'Registered') && (
                      <button
                        type="button"
                        disabled={deviceResetting}
                        onClick={handleResetStudentDevice}
                        className="h-9 px-4 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

          {/* DELETE CONFIRMATION MODAL */}
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
                      <div className="text-xs text-muted-foreground">
                        {deletingStudent.dept || adminDept} • {deletingStudent.semester} • {formatSectionLab(deletingStudent.section, deletingStudent.Lab || deletingStudent.lab)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-destructive font-medium">
                    ⚠️ This action cannot be undone. If this student has active attendance history, records will be permanently removed.
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
                      className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {deleteSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Delete Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS MODAL - Student Added */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-foreground">Student Added Successfully</h2>
                </div>

                <div className="space-y-3 mb-6 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Student Name</p>
                    <p className="text-foreground font-medium">{lastAddedStudent?.name || formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">USN</p>
                    <p className="text-foreground font-medium font-mono">{lastAddedStudent?.usn || formData.usn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Section / Lab Batch</p>
                    <p className="text-foreground font-medium font-mono">
                      {lastAddedStudent?.dept} • {lastAddedStudent?.year} • {formatSectionLab(lastAddedStudent?.section, lastAddedStudent?.Lab || lastAddedStudent?.lab)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Device Status</p>
                    <div className="mt-1">
                      <StatusBadge status={lastAddedStudent?.device === 'Linked' || lastAddedStudent?.device === 'Registered' ? 'Registered' : 'Not Registered'} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* CREDENTIALS MODAL - View Password */}
          {showCredentialsModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg border border-border shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Password</h2>

                {selectedStudentForCredentials?.password ? (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Password</p>
                      <div className="flex gap-2">
                        <code className="flex-1 px-3 py-2 rounded-md bg-background border border-border font-mono text-sm text-foreground break-all">
                          {selectedStudentForCredentials?.password}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedStudentForCredentials?.password || '')
                            alert('Password copied to clipboard!')
                          }}
                          className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">No password set. Account status is Inactive.</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setSelectedStudentForCredentials(null)
                  }}
                  className="w-full px-4 py-2 rounded-md bg-background border border-input hover:bg-accent text-foreground text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* IMPORT STUDENTS MODAL (As in zoattendence, on 1st page right side) */}
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {importStep === 'preview' ? 'Import Preview' : 'Import Students'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {importStep === 'preview'
                        ? 'Review extracted student records before adding to the directory.'
                        : 'Bulk register students from an Excel (.xlsx, .xls) or CSV (.csv) file.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportStep('upload')
                      setImportFile(null)
                      setImportPreview(null)
                      setImportError('')
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {importError && (
                  <div className="mx-5 mt-4 p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Step 1: Upload Step */}
                {importStep === 'upload' && (
                  <form onSubmit={handlePreviewImport} className="p-5 space-y-4 overflow-y-auto">
                    <div className="p-3 bg-muted/40 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        Target Department: <span className="font-semibold text-foreground">{adminDept}</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
                        Department Directory: {adminDept}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label required>Year of Study</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Select the academic year to assign to students in the uploaded file:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { y: '1st Year', sem: '1st Sem' },
                          { y: '2nd Year', sem: '3rd Sem' },
                          { y: '3rd Year', sem: '5th Sem' },
                          { y: '4th Year', sem: '7th Sem' },
                        ].map(opt => (
                          <button
                            key={opt.y}
                            type="button"
                            onClick={() => {
                              setImportYear(opt.y)
                              setImportSemester(opt.sem)
                            }}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                              importYear === opt.y
                                ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary'
                                : 'border-input bg-background hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="text-sm">{opt.y}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{opt.sem}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label required>Upload Student Spreadsheet</Label>
                      <div className="relative border-2 border-dashed border-input hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10">
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={e => {
                            const file = e.target.files?.[0] || null
                            setImportFile(file)
                            setImportError('')
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Upload className="size-5" />
                          </div>
                          {importFile ? (
                            <div>
                              <p className="text-sm font-semibold text-foreground">{importFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Accepted: Excel (.xlsx, .xls) and CSV (.csv)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Columns automatically detected: <span className="font-semibold text-foreground">USN</span>, <span className="font-semibold text-foreground">Name</span>, and optional <span className="font-semibold text-foreground">Section</span>, <span className="font-semibold text-foreground">Lab Batch</span>, <span className="font-semibold text-foreground">Email</span>. USN is capped at 10 characters (VARCHAR(10)).
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setShowImportModal(false)
                          setImportFile(null)
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!importFile || importSubmitting}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {importSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Preview Students
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Preview Step */}
                {importStep === 'preview' && importPreview && (
                  <div className="flex flex-col flex-1 overflow-hidden p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <div className="text-[11px] text-muted-foreground font-medium">Total in File</div>
                        <div className="text-xl font-bold text-foreground">{importPreview.totalFound}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Ready to Import</div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{importPreview.readyToImport}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Already in DB (Will Update)</div>
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{importPreview.alreadyExists}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">Other Branches (Skipped)</div>
                        <div className="text-xl font-bold text-slate-700 dark:text-slate-400">{importPreview.otherDeptCount}</div>
                      </div>
                    </div>

                    {(importPreview.duplicatesInFile > 0 || importPreview.invalidRows > 0) && (
                      <div className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/60 dark:bg-orange-950/20 text-xs text-orange-800 dark:text-orange-300 flex items-center justify-between">
                        <span>
                          {importPreview.duplicatesInFile > 0 && `${importPreview.duplicatesInFile} duplicate row(s) in file. `}
                          {importPreview.invalidRows > 0 && `${importPreview.invalidRows} corrupt or invalid row(s).`}
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">Skipped</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
                      <span>Department: <strong className="text-foreground">{importPreview.department}</strong></span>
                      <span>Enrolled Year: <strong className="text-foreground">{importPreview.year} ({importPreview.semester})</strong></span>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-border rounded-lg max-h-[320px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/80 sticky top-0 font-semibold text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-3 py-2">USN</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Section</th>
                            <th className="px-3 py-2">Lab Batch</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {importPreview.students.map((st, idx) => (
                            <tr key={idx} className={st.status === 'OTHER_DEPT' ? 'bg-muted/20 opacity-70' : st.status !== 'READY' && st.status !== 'ALREADY_EXISTS' ? 'bg-muted/30' : 'hover:bg-muted/20'}>
                              <td className="px-3 py-2 font-mono font-medium">{st.usn}</td>
                              <td className="px-3 py-2">{st.name}</td>
                              <td className="px-3 py-2 font-medium">{getSectionDisplayName(st.section)}</td>
                              <td className="px-3 py-2 font-mono font-semibold text-primary">{st.labBatch}</td>
                              <td className="px-3 py-2">
                                {st.status === 'READY' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                    Ready
                                  </span>
                                ) : st.status === 'ALREADY_EXISTS' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" title={st.reason || ''}>
                                    Will Update
                                  </span>
                                ) : st.status === 'OTHER_DEPT' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" title={st.reason || ''}>
                                    Other Branch (Skipped)
                                  </span>
                                ) : st.status === 'DUPLICATE_IN_FILE' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" title={st.reason || ''}>
                                    Duplicate in File
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" title={st.reason || ''}>
                                    {`Invalid (${st.reason || 'Data error'})`}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setImportStep('upload')}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowImportModal(false)
                            setImportStep('upload')
                            setImportFile(null)
                            setImportPreview(null)
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCommitImport}
                          disabled={importPreview.readyToImport + importPreview.alreadyExists === 0 || importSubmitting}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {importSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {importPreview.readyToImport > 0 && importPreview.alreadyExists > 0
                            ? `Import (${importPreview.readyToImport}) & Update (${importPreview.alreadyExists})`
                            : importPreview.readyToImport > 0
                            ? `Import ${importPreview.readyToImport} Students`
                            : `Update ${importPreview.alreadyExists} Existing Students`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BULK PROMOTE MODAL */}
          {showPromoteModal && selectedSem && selectedSem !== '8th Sem' && selectedYear && SEMESTER_PROGRESSION[selectedSem] && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <TrendingUp className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Bulk Promote Students</h2>
                      <p className="text-xs text-muted-foreground">Advance semester and academic progression</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPromoteModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="p-3.5 rounded-lg bg-muted/50 border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Department:</span>
                      <span className="font-bold text-foreground">{adminDept}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Current Semester:</span>
                      <span className="font-bold text-foreground">{selectedSem} ({selectedYear})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Promote To:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {SEMESTER_PROGRESSION[selectedSem]?.nextSem} ({SEMESTER_PROGRESSION[selectedSem]?.nextYear})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/60">
                      <span className="text-muted-foreground font-medium">Total Students Affected:</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                        {students_data.filter(s => s.year === selectedYear && s.semester === selectedSem && isStudentInDept(s.dept, adminDept)).length} students
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>Important Notice</span>
                    </div>
                    <p>
                      Promoting students will advance all enrolled records in {selectedSem} to <strong>{SEMESTER_PROGRESSION[selectedSem]?.nextSem}</strong>.
                    </p>
                    <p>
                      The destination academic year (<strong>{SEMESTER_PROGRESSION[selectedSem]?.nextYear}</strong>) will automatically update its active semester to <strong>{isOddSemester(SEMESTER_PROGRESSION[selectedSem]?.nextSem) ? 'Odd Semester' : 'Even Semester'}</strong>, leaving junior batches and other years untouched.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={promotingSubmitting}
                      onClick={() => setShowPromoteModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={promotingSubmitting}
                      onClick={handleExecuteBulkPromote}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {promotingSubmitting ? <Loader2 className="size-4 animate-spin" /> : <TrendingUp className="size-4" />}
                      Confirm Promotion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Faculty Page ─────────────────────────────────────────────────────────────

// ─── Faculty Page ─────────────────────────────────────────────────────────────
export function FacultyPage() {
  const [query, setQuery] = useState('')
  const [faculty, setFaculty] = useState<FacultyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isHod, setIsHod] = useState(false)
  const [hodDepartment, setHodDepartment] = useState<string | null>(null)

  // 3-dot action menu
  const [activeDropdownId, setActiveDropdownId] = useState<number | string | null>(null)

  // Export dropdown
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Add Faculty modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    employeeId: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    email: '',
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Update Faculty modal
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState<{
    id: number | string;
    name: string;
    employeeId: string;
    department: string;
    designation: string;
  }>({
    id: '',
    name: '',
    employeeId: '',
    department: '',
    designation: '',
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')

  // Toast notification
  const [facultyToast, setFacultyToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete Faculty modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Created Faculty Credential Delivery Modal
  const [createdCredential, setCreatedCredential] = useState<{
    name: string;
    employeeId: string;
    email?: string;
    temporaryPassword?: string;
  } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const DEPT_OPTIONS = [
    { code: 'CSE', name: 'Computer Science and Engineering' },
    { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
    { code: 'ECE', name: 'Electronics and Communication' },
    { code: 'EEE', name: 'Electrical and Electronics Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'CSE-DS', name: 'Computer Science and Engineering (Data Science)' },
  ]

  const DESIGNATION_OPTIONS = [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Professor & HOD',
    'Dean',
    'Dean Academic',
    'Dean Student Affairs',
    'Dean R&D',
  ]

  const fetchFacultyList = async () => {
    setLoading(true)
    try {
      const res = await getFaculty(undefined, {
        search: query || undefined,
      })
      setFaculty(res.faculty)
      setIsLive(res.isLive)
      setIsHod(Boolean(res.isHod))
      setHodDepartment(res.department || null)
      if (res.isHod && res.department) {
        setAddForm(prev => ({ ...prev, department: res.department! }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacultyList()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownId(null)
      setShowExportDropdown(false)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    return faculty.filter((f) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return (
        f.name.toLowerCase().includes(q) ||
        f.employeeId.toLowerCase().includes(q) ||
        (f.department && f.department.toLowerCase().includes(q)) ||
        (f.departmentCode && f.departmentCode.toLowerCase().includes(q)) ||
        (f.designation && f.designation.toLowerCase().includes(q))
      )
    })
  }, [faculty, query])

  // Export handler
  const handleExport = async (format: 'pdf' | 'xls' | 'xlsx') => {
    try {
      setExporting(true)
      setShowExportDropdown(false)
      await downloadFacultyExport({
        format,
        department: hodDepartment || undefined,
        search: query || undefined,
      })
    } catch (err: any) {
      alert(err.message || 'Failed to export faculty')
    } finally {
      setExporting(false)
    }
  }

  // Add Faculty handler
  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addForm.name.trim() || !addForm.employeeId.trim() || !addForm.designation.trim()) {
      setAddError('Please fill in all required fields.')
      return
    }

    try {
      setAddLoading(true)
      const res = await createFacultyAdmin({
        name: addForm.name.trim(),
        employeeId: addForm.employeeId.trim(),
        department: hodDepartment || addForm.department,
        designation: addForm.designation.trim(),
        email: addForm.email.trim() || undefined,
      })
      setShowAddModal(false)

      const tempPwd = res?.faculty?.temporaryPassword || res?.data?.temporaryPassword
      if (tempPwd) {
        setCreatedCredential({
          name: addForm.name.trim(),
          employeeId: addForm.employeeId.trim(),
          email: addForm.email.trim(),
          temporaryPassword: tempPwd,
        })
      }

      setAddForm({
        name: '',
        employeeId: '',
        department: hodDepartment || 'CSE',
        designation: 'Assistant Professor',
        email: '',
      })
      setFacultyToast({ type: 'success', text: `Faculty member "${addForm.name.trim()}" added successfully.` })
      await fetchFacultyList()
    } catch (err: any) {
      setAddError(err.message || 'Failed to add faculty member.')
    } finally {
      setAddLoading(false)
    }
  }

  // Open Update Modal
  const openUpdateModal = (f: FacultyRecord) => {
    setActiveDropdownId(null)
    const matchDept = DEPT_OPTIONS.find(
      (d) =>
        d.code.toUpperCase() === (f.departmentCode || '').toUpperCase() ||
        d.name.toLowerCase() === (f.department || '').toLowerCase()
    )
    setUpdateForm({
      id: f.id,
      name: f.name,
      employeeId: f.employeeId,
      department: isHod ? (hodDepartment || 'CSE') : (matchDept?.code || f.departmentCode || f.department || 'CSE'),
      designation: f.designation || '',
    })
    setUpdateError('')
    setShowUpdateModal(true)
  }

  // Update Faculty handler
  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateError('')
    if (!updateForm.name.trim() || !updateForm.employeeId.trim()) {
      setUpdateError('Name and Employee ID cannot be empty.')
      return
    }

    try {
      setUpdateLoading(true)
      await updateFacultyAdmin(updateForm.id, {
        name: updateForm.name.trim(),
        employeeId: updateForm.employeeId.trim(),
        department: isHod ? undefined : updateForm.department,
        designation: updateForm.designation.trim() || undefined,
      })
      setShowUpdateModal(false)
      setFacultyToast({ type: 'success', text: `Faculty member "${updateForm.name.trim()}" updated successfully.` })
      await fetchFacultyList()
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update faculty member.')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Open Delete Modal
  const openDeleteModal = (f: FacultyRecord) => {
    setActiveDropdownId(null)
    setFacultyToDelete(f)
    setDeleteError('')
    setShowDeleteModal(true)
  }

  // Delete Faculty handler
  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return
    try {
      setDeleteLoading(true)
      setDeleteError('')
      await deleteFacultyAdmin(facultyToDelete.id)
      setShowDeleteModal(false)
      setFacultyToast({ type: 'success', text: `Faculty member "${facultyToDelete.name}" deleted successfully.` })
      setFacultyToDelete(null)
      await fetchFacultyList()
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete faculty member.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Faculty</h1>
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
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
              <p className="text-sm text-muted-foreground mt-1">
                Manage teaching staff, designations, and department roles.
              </p>
            </div>

            {/* Top action buttons */}
            <div className="flex items-center gap-2">
              {/* Multi-Format Export Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowExportDropdown((prev) => !prev)}
                  disabled={exporting}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-xs transition-colors"
                >
                  {exporting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-4 w-4" />
                  )}
                  Export
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-2.5 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-rose-500" />
                      PDF Document (.pdf)
                    </button>
                    <button
                      onClick={() => handleExport('xls')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-2.5 transition-colors"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      Excel 97-2004 (.xls)
                    </button>
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-2.5 transition-colors"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      Excel Workbook (.xlsx)
                    </button>
                  </div>
                )}
              </div>

              {/* Add Faculty Manually Button */}
              <button
                onClick={() => {
                  setShowAddModal(true)
                  setAddError('')
                }}
                className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Faculty
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {facultyToast && (
            <div
              className={`p-3 text-xs rounded-lg flex items-center justify-between gap-2 border animate-in fade-in ${
                facultyToast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {facultyToast.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                )}
                <span className="font-medium">{facultyToast.text}</span>
              </div>
              <button
                onClick={() => setFacultyToast(null)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {/* Toolbar: Search */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, dept, designation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Faculty Name</th>
                    <th className="px-6 py-3 border-b border-border">Employee ID</th>
                    <th className="px-6 py-3 border-b border-border">Department</th>
                    <th className="px-6 py-3 border-b border-border">Designation</th>
                    <th className="px-6 py-3 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading faculty records...
                      </td>
                    </tr>
                  ) : filtered.map((f, i) => (
                    <tr key={f.id || i} className="hover:bg-muted/40 transition-colors">
                      {/* 1. Faculty Name */}
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{f.name}</div>
                        {f.email && <div className="text-xs text-muted-foreground">{f.email}</div>}
                      </td>

                      {/* 2. Employee ID */}
                      <td className="px-6 py-4 text-foreground font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border">
                          {f.employeeId}
                        </span>
                      </td>

                      {/* 3. Department */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{f.departmentCode || f.department}</div>
                        {f.departmentCode && f.departmentCode !== f.department && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{f.department}</div>
                        )}
                      </td>

                      {/* 4. Designation */}
                      <td className="px-6 py-4">
                        {f.designation && f.designation.toLowerCase().includes('dean') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            ★ {f.designation}
                          </span>
                        ) : (
                          <span className="text-foreground">{f.designation || '—'}</span>
                        )}
                      </td>

                      {/* 5. Actions (3-Dot Menu) */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setActiveDropdownId(activeDropdownId === f.id ? null : f.id)
                            }
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeDropdownId === f.id && (
                            <div className="absolute right-0 mt-1 w-40 rounded-xl border border-border bg-card shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 text-left">
                              <button
                                onClick={() => openUpdateModal(f)}
                                className="w-full px-3 py-2 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                Update Faculty
                              </button>
                              <button
                                onClick={() => openDeleteModal(f)}
                                className="w-full px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Faculty
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No faculty members found matching your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Add Faculty Manually */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add Faculty Manually</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Register a new faculty member into the directory.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddFaculty} className="p-6 space-y-4">
                {addError && (
                  <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Faculty Name */}
                <div className="space-y-1.5">
                  <Label required>Faculty Name</Label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <Label required>Employee ID</Label>
                  <input
                    type="text"
                    placeholder="e.g. FAC002"
                    value={addForm.employeeId}
                    onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label required>Department</Label>
                  <select
                    disabled={isHod}
                    value={isHod && hodDepartment ? hodDepartment : addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                  >
                    {isHod && hodDepartment ? (
                      <option value={hodDepartment}>{hodDepartment} Department (Auto-enforced)</option>
                    ) : (
                      DEPT_OPTIONS.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <Label required>Designation</Label>
                  <input
                    list="designation-suggestions"
                    placeholder="e.g. Assistant Professor, Dean Academic"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                  <datalist id="designation-suggestions">
                    {DESIGNATION_OPTIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <Label>Email Address (Optional)</Label>
                  <Inp
                    type="email"
                    placeholder="e.g. ramesh@klsvdit.edu.in"
                    value={addForm.email}
                    onChange={(e: any) => setAddForm({ ...addForm, email: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If omitted, defaults to employeeid@klsvdit.edu.in
                  </p>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {addLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Add Faculty Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Faculty */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Update Faculty</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modify profile details for this faculty member.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateFaculty} className="p-6 space-y-4">
                {updateError && (
                  <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <Label required>Faculty Name</Label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <Label required>Employee ID</Label>
                  <input
                    type="text"
                    value={updateForm.employeeId}
                    onChange={(e) => setUpdateForm({ ...updateForm, employeeId: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                {/* Department (Editable by Super Admin, locked for HOD) */}
                <div className="space-y-1.5">
                  <Label required>Department</Label>
                  <select
                    disabled={isHod}
                    value={updateForm.department}
                    onChange={(e) => setUpdateForm({ ...updateForm, department: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                  >
                    {isHod && hodDepartment ? (
                      <option value={hodDepartment}>{hodDepartment} Department (Locked)</option>
                    ) : (
                      DEPT_OPTIONS.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <Label required>Designation</Label>
                  <input
                    list="update-designation-suggestions"
                    placeholder="e.g. Professor, Dean Academic"
                    value={updateForm.designation}
                    onChange={(e) => setUpdateForm({ ...updateForm, designation: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                  <datalist id="update-designation-suggestions">
                    {DESIGNATION_OPTIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {updateLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Faculty Confirmation */}
        {showDeleteModal && facultyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 space-y-4">
                <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <Trash2 className="size-6" />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">Delete Faculty Member</h3>
                  <p className="text-xs text-muted-foreground">
                    Are you sure you want to delete <span className="font-semibold text-foreground">{facultyToDelete.name}</span> ({facultyToDelete.employeeId})?
                  </p>
                </div>

                {deleteError && (
                  <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}

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
                    disabled={deleteLoading}
                    onClick={handleConfirmDelete}
                    className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Delete Faculty
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Created Faculty Temporary Credential Delivery */}
        {createdCredential && createdCredential.temporaryPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 space-y-4">
                <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Key className="size-6" />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">Faculty Account Created</h3>
                  <p className="text-xs text-muted-foreground">
                    A cryptographically secure temporary credential has been generated for <span className="font-semibold text-foreground">{createdCredential.name}</span>.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/60 border border-border space-y-3 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Employee ID:</span>
                    <span className="font-mono font-medium text-foreground">{createdCredential.employeeId}</span>
                  </div>
                  {createdCredential.email && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Email:</span>
                      <span className="font-medium text-foreground">{createdCredential.email}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted-foreground mb-1.5 font-medium">Temporary Password:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 rounded bg-background border border-border font-mono text-xs font-semibold text-primary select-all">
                        {createdCredential.temporaryPassword}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (createdCredential.temporaryPassword) {
                            navigator.clipboard.writeText(createdCredential.temporaryPassword)
                            setCopiedPassword(true)
                            setTimeout(() => setCopiedPassword(false), 2500)
                          }
                        }}
                        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          'Copy'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Deliver this temporary credential to the faculty member. They can log in using their Employee ID or Email and reset their password.
                </p>

                <div className="pt-2 flex items-center justify-end border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCreatedCredential(null)}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Done
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

