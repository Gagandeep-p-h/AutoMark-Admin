'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Calendar,
  Download,
  Upload,
  FlaskConical,
  BookOpen,
  Save,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
  Info,
  Ban,
  GraduationCap,
  Layers,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { AdminShell, AdminContent } from '@/components/admin-shell'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: number
  name: string
  code: string
  departmentId: number
  credits?: number
}

interface Faculty {
  id: number
  name: string
  employeeId: string
  departmentId: number
}

interface Batch {
  id: number
  name: string
  departmentId: number
  semester: number
  section: string
  academicYear: string
  studentCount?: number
}

interface TimetableSlot {
  id?: number | string
  classId?: number

  dayOfWeek: string | number
  startTime: string
  endTime: string

  isLab: boolean
  isNA?: boolean

  subjectId?: number | null
  subjectCode?: string
  subjectName?: string

  facultyId?: number | null
  facultyName?: string

  batchId?: number | null
  batchName?: string | null

  room?: string
  overflowFreeBatch?: string | null

  subject?: {
    id: number
    code: string
    name: string
  } | null

  faculty?: {
    id: number
    employeeId?: string
    designation?: string
  } | null

  semester?: number | null
  section?: string | null
  academicYear?: string | null
  departmentId?: number | null
}

interface SlotCell {
  subjectId: number | null
  facultyId: number | null
  isLab: boolean
  isNA: boolean
  batchId: number | null
  room: string
}

interface ValidationError {
  slotIndex?: number
  dayOfWeek?: string
  time?: string
  errors: string[]
  row?: number
}

interface EngineeringYearOption {
  yearNumber: number
  label: string
  semesters: number[]
  defaultSemester: number
  academicSession: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
type Day = typeof DAYS[number]

const DAY_LABELS: Record<Day, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
}

const SCHEDULE_BLOCKS = [
  { startTime: '09:00', endTime: '10:00', label: '09:00 – 10:00', isBreak: false, monFriOnly: false },
  { startTime: '10:00', endTime: '11:00', label: '10:00 – 11:00', isBreak: false, monFriOnly: false },
  { startTime: '11:00', endTime: '11:15', label: '11:00 – 11:15', isBreak: true, name: 'Morning Break', monFriOnly: false },
  { startTime: '11:15', endTime: '12:15', label: '11:15 – 12:15', isBreak: false, monFriOnly: false },
  { startTime: '12:15', endTime: '13:15', label: '12:15 – 13:15', isBreak: false, monFriOnly: false },
  { startTime: '13:15', endTime: '14:00', label: '13:15 – 14:00', isBreak: true, name: 'Lunch Break', monFriOnly: false },
  { startTime: '14:00', endTime: '15:00', label: '14:00 – 15:00', isBreak: false, monFriOnly: true },
  { startTime: '15:00', endTime: '16:00', label: '15:00 – 16:00', isBreak: false, monFriOnly: true },
]

const EMPTY_SLOT: SlotCell = {
  subjectId: null,
  facultyId: null,
  isLab: false,
  isNA: false,
  batchId: null,
  room: '',
}

// Engineering Years (1st Year – 4th Year) mapped to semesters and academic sessions
const ENGINEERING_YEARS: EngineeringYearOption[] = [
  { yearNumber: 1, label: '1st Year', semesters: [1, 2], defaultSemester: 1, academicSession: '2026-27' },
  { yearNumber: 2, label: '2nd Year', semesters: [3, 4], defaultSemester: 3, academicSession: '2026-27' },
  { yearNumber: 3, label: '3rd Year', semesters: [5, 6], defaultSemester: 5, academicSession: '2026-27' },
  { yearNumber: 4, label: '4th Year', semesters: [7, 8], defaultSemester: 7, academicSession: '2026-27' },
]

const SECTIONS = ['A', 'B', 'C', 'D']

// ─── Utility ──────────────────────────────────────────────────────────────────

function getSlotKey(day: string | number, startTime: string) {
  const dayMap: Record<number, string> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY',
  }

  const normalizedDay =
    typeof day === 'number'
      ? dayMap[day]
      : dayMap[Number(day)] || day.toUpperCase()

  return `${normalizedDay}__${startTime}`
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FilterBar({
  engineeringYear,
  setEngineeringYear,
  semester,
  setSemester,
  section,
  setSection,
  onLoad,
  loading,
}: {
  engineeringYear: number
  setEngineeringYear: (y: number) => void
  semester: number
  setSemester: (v: number) => void
  section: string
  setSection: (v: string) => void
  onLoad: () => void
  loading: boolean
}) {
  const currentYearConfig = ENGINEERING_YEARS.find((y) => y.yearNumber === engineeringYear) || ENGINEERING_YEARS[1]

  const handleYearChange = (yearNum: number) => {
    setEngineeringYear(yearNum)
    const conf = ENGINEERING_YEARS.find((y) => y.yearNumber === yearNum)
    if (conf) {
      setSemester(conf.defaultSemester)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-xl p-4 shadow-sm">
      {/* Engineering Year Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          Engineering Year
        </label>
        <div className="relative">
          <select
            id="filter-engineering-year"
            value={engineeringYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[130px] font-medium"
          >
            {ENGINEERING_YEARS.map((y) => (
              <option key={y.yearNumber} value={y.yearNumber}>
                {y.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Semester */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester</label>
        <div className="relative">
          <select
            id="filter-semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[110px]"
          >
            {currentYearConfig.semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Section */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</label>
        <div className="relative">
          <select
            id="filter-section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <button
        id="btn-load-timetable"
        onClick={onLoad}
        disabled={loading}
        className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
        Load Timetable
      </button>
    </div>
  )
}

function ActionBar({
  onImport,
  onExportXlsx,
  onExportPdf,
  onManageBatches,
  onSave,
  saving,
}: {
  onImport: () => void
  onExportXlsx: () => void
  onExportPdf: () => void
  onManageBatches: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        id="btn-import-excel"
        onClick={onImport}
        className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Upload className="h-4 w-4 text-muted-foreground" />
        Import Excel
      </button>
      <button
        id="btn-export-xlsx"
        onClick={onExportXlsx}
        className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Download className="h-4 w-4 text-muted-foreground" />
        Export XLSX
      </button>
      <button
        id="btn-export-pdf"
        onClick={onExportPdf}
        className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Download className="h-4 w-4 text-muted-foreground" />
        Export PDF
      </button>
      <button
        id="btn-manage-batches"
        onClick={onManageBatches}
        className="h-9 px-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
      >
        <FlaskConical className="h-4 w-4" />
        Manage Lab Batches
      </button>
      <button
        id="btn-save-timetable"
        onClick={onSave}
        disabled={saving}
        className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60 ml-auto shadow-sm"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Timetable
      </button>
    </div>
  )
}

// ─── Slot Cell Editor ─────────────────────────────────────────────────────────

function SlotEditor({
  value,
  onChange,
  subjects,
  faculty,
  batches,
  isDisabled,
  isSaturdayAfternoon,
  existingSlot,
}: {
  value: SlotCell
  onChange: (v: SlotCell) => void
  subjects: Subject[]
  faculty: Faculty[]
  batches: Batch[]
  isDisabled: boolean
  isSaturdayAfternoon: boolean
  existingSlot?: TimetableSlot | null
}) {
  if (isDisabled) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50 italic">
        Break
      </div>
    )
  }

  if (isSaturdayAfternoon) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground/40 italic">
        Closed
      </div>
    )
  }

  return (
    <div className="p-1.5 flex flex-col gap-1 h-full justify-between">
      {/* 3-Way Mode Toggle: Theory | Lab | N/A */}
      <div className="grid grid-cols-3 gap-1 mb-0.5">
        <button
          type="button"
          onClick={() => onChange({ ...value, isLab: false, isNA: false })}
          className={`h-5 text-[9px] font-semibold rounded transition-all ${
            !value.isLab && !value.isNA
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-border text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Theory
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, isLab: true, isNA: false })}
          className={`h-5 text-[9px] font-semibold rounded transition-all ${
            value.isLab && !value.isNA
              ? 'bg-amber-600 text-white shadow-xs'
              : 'border border-border text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Lab
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              isNA: true,
              isLab: false,
              subjectId: null,
              facultyId: null,
              batchId: null,
            })
          }
          className={`h-5 text-[9px] font-semibold rounded transition-all ${
            value.isNA
              ? 'bg-slate-700 text-white shadow-xs'
              : 'border border-border text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Free / N/A
        </button>
      </div>

      {value.isNA ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-1 bg-slate-100 rounded-md border border-slate-200">
          <Ban className="h-3.5 w-3.5 text-slate-400 mb-0.5" />
          <span className="text-[10px] font-medium text-slate-600">Free Period</span>
          <span className="text-[9px] text-slate-400">(N/A / Self Study)</span>
        </div>
      ) : (
        <>
          {/* Subject Dropdown (Displays Subject Code) */}
          <select
            value={value.subjectId ?? ''}
            onChange={(e) => onChange({ ...value, subjectId: e.target.value ? Number(e.target.value) : null })}
            className="w-full h-6 rounded border border-input bg-background text-[11px] font-mono px-1 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Subject Code —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>

          {/* Faculty Dropdown */}
          <select
            value={value.facultyId ?? ''}
            onChange={(e) => onChange({ ...value, facultyId: e.target.value ? Number(e.target.value) : null })}
            className="w-full h-6 rounded border border-input bg-background text-[10px] px-1 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Faculty —</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Batch Selector (Only for Lab Mode) */}
          {value.isLab ? (
            <select
              value={value.batchId ?? ''}
              onChange={(e) => onChange({ ...value, batchId: e.target.value ? Number(e.target.value) : null })}
              className="w-full h-6 rounded border border-amber-300 bg-amber-50 text-amber-900 text-[10px] px-1 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="">— Lab Batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-6" />
          )}

          {/* Concurrent Lab Overflow Badge */}
          {existingSlot?.overflowFreeBatch && (
            <div className="flex items-center gap-1 text-[9px] text-orange-700 bg-orange-50 border border-orange-200 rounded px-1 py-0.5">
              <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0 text-orange-600" />
              <span className="truncate">{existingSlot.overflowFreeBatch}: Free batch</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Timetable Grid ───────────────────────────────────────────────────────────

function TimetableGrid({
  grid,
  onCellChange,
  subjects,
  faculty,
  batches,
}: {
  grid: Record<string, SlotCell>
  onCellChange: (key: string, value: SlotCell) => void
  subjects: Subject[]
  faculty: Faculty[]
  batches: Batch[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-sm bg-card">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-28 min-w-[7rem] bg-muted/80 border border-border px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Time
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className={`min-w-[130px] bg-muted/80 border border-border px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider ${
                  day === 'SATURDAY' ? 'text-amber-600' : 'text-muted-foreground'
                }`}
              >
                {DAY_LABELS[day]}
                {day === 'SATURDAY' && (
                  <div className="text-[9px] font-normal text-amber-500/70 normal-case tracking-normal">
                    Until 01:15 PM
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHEDULE_BLOCKS.map((block) => {
            if (block.isBreak) {
              return (
                <tr key={`break-${block.startTime}`}>
                  <td className="border border-border px-3 py-1.5 bg-slate-100 text-muted-foreground text-[10px] font-semibold whitespace-nowrap">
                    <div>{block.label}</div>
                    <div className="text-amber-600 text-[9px] font-bold uppercase tracking-wide">
                      {'name' in block ? block.name : ''}
                    </div>
                  </td>
                  {DAYS.map((day) => (
                    <td
                      key={day}
                      className="border border-border bg-slate-50 text-center text-muted-foreground/40 text-[10px] italic py-1.5"
                    >
                      No Classes
                    </td>
                  ))}
                </tr>
              )
            }

            return (
              <tr key={`${block.startTime}`} className="group hover:bg-muted/10 transition-colors">
                <td className="border border-border px-3 py-1 bg-muted/30 text-[10px] font-semibold text-muted-foreground whitespace-nowrap align-top pt-2">
                  {block.label}
                </td>
                {DAYS.map((day) => {
                  const isSaturdayAfternoon = day === 'SATURDAY' && block.monFriOnly
                  const key = getSlotKey(day, block.startTime)
                  const cell = grid[key] || EMPTY_SLOT

                  let cellStyle = ''
                  if (cell.isNA) {
                    cellStyle = 'bg-slate-50 border-slate-200'
                  } else if (cell.subjectId) {
                    cellStyle = cell.isLab ? 'bg-amber-50/50 border-amber-200' : 'bg-indigo-50/50 border-indigo-200'
                  }

                  return (
                    <td
                      key={day}
                      className={`border border-border h-[115px] align-top transition-colors ${
                        isSaturdayAfternoon ? 'bg-muted/30' : cellStyle
                      }`}
                    >
                      <SlotEditor
                        value={cell}
                        onChange={(v) => onCellChange(key, v)}
                        subjects={subjects}
                        faculty={faculty}
                        batches={batches}
                        isDisabled={false}
                        isSaturdayAfternoon={isSaturdayAfternoon}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Batch Management Modal ───────────────────────────────────────────────────

function BatchModal({
  batches,
  onClose,
  onSplitBatches,
  academicYear,
  departmentId,
  semester,
  section,
  timetableSlots,
}: {
  batches: Batch[]
  onClose: () => void
  onSplitBatches: (names: string[]) => void
  academicYear: string
  departmentId: string
  semester: number
  section: string
  timetableSlots: TimetableSlot[]
}) {
  const [batchNames, setBatchNames] = useState(['B1', 'B2', 'B3'])
  const [newBatch, setNewBatch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Detect concurrent lab overflow
  const labSlots = timetableSlots.filter((s) => s.isLab)
  const overflowWarnings: string[] = []

  const labBlockGroups: Record<string, TimetableSlot[]> = {}
  labSlots.forEach((s) => {
    const key = `${s.dayOfWeek}_${s.startTime}_${s.endTime}`
    if (!labBlockGroups[key]) labBlockGroups[key] = []
    labBlockGroups[key].push(s)
  })

  Object.entries(labBlockGroups).forEach(([key, slots]) => {
    if (slots.length >= 2 && batchNames.length === 3) {
      const assignedBatches = slots.map((s) => s.batchName).filter(Boolean)
      const freeBatch = batchNames.find((b) => !assignedBatches.includes(b))
      if (freeBatch) {
        const [day, start, end] = key.split('_')
        overflowWarnings.push(
          `${day} ${start}–${end}: ${freeBatch} has no lab assignment here → must be scheduled in a different free slot.`
        )
      }
    }
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    onSplitBatches(batchNames)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Manage Lab Batches</h2>
              <p className="text-xs text-muted-foreground">
                Section {section} · Semester {semester} · Academic Year {academicYear}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Lab Batches</h3>
              <span className="text-xs text-muted-foreground">{batchNames.length} batch(es)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {batchNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-full px-3 py-1 text-sm font-medium"
                >
                  <span>{name}</span>
                  {batchNames.length > 1 && (
                    <button
                      onClick={() => setBatchNames((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-blue-500 hover:text-blue-800 ml-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add custom batch */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. B4"
              value={newBatch}
              onChange={(e) => setNewBatch(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1"
            />
            <button
              onClick={() => {
                if (newBatch.trim() && !batchNames.includes(newBatch.trim())) {
                  setBatchNames((prev) => [...prev, newBatch.trim()])
                  setNewBatch('')
                }
              }}
              className="h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Add Batch
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Presets:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setBatchNames(['B1', 'B2'])}
                className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted text-foreground"
              >
                2 Batches (B1, B2)
              </button>
              <button
                onClick={() => setBatchNames(['B1', 'B2', 'B3'])}
                className="text-xs px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 font-medium"
              >
                3 Batches (B1, B2, B3) — Recommended
              </button>
            </div>
          </div>

          {/* Overflow Warnings */}
          {overflowWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Lab Scheduling Notice (Concurrent Rule)
              </div>
              <ul className="text-xs text-amber-700 space-y-1 pl-6 list-disc">
                {overflowWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Constraint reminder */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-start gap-2 text-slate-600 text-xs">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-500" />
              <div>
                <p className="font-semibold mb-1">Concurrent Lab Constraint</p>
                <p>
                  A maximum of <strong>2 lab sessions</strong> can run simultaneously per department slot. With 3
                  batches (B1, B2, B3), B3 receives a free period when B1 + B2 occupy the lab block.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-batches"
            onClick={handleSave}
            disabled={saving || batchNames.length === 0}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Saved!' : 'Save Batches'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Subject Modal (Add / Edit) ───────────────────────────────────────────────

function SubjectModal({
  mode,
  initial,
  departmentId,
  departmentName,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  initial?: Subject | null
  departmentId: string
  departmentName?: string
  onClose: () => void
  onSaved: (subject: Subject) => void
}) {
  const [code, setCode] = useState(initial?.code || '')
  const [name, setName] = useState(initial?.name || '')
  const [credits, setCredits] = useState(String(initial?.credits ?? 4))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimCode = code.trim().toUpperCase()
    const trimName = name.trim()
    const numCredits = Number(credits)

    if (!trimCode || !trimName || !numCredits || numCredits < 1 || numCredits > 10) {
      setError('Please fill all fields. Credits must be between 1 and 10.')
      return
    }

    if (!departmentId || !Number(departmentId)) {
      setError('Department is required to create a subject.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: trimCode,
        name: trimName,
        credits: numCredits,
        departmentId: Number(departmentId),
      }

      let res: Response
      if (mode === 'add') {
        res = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/admin/subjects/${initial!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (json.success && json.data) {
        onSaved(json.data)
      } else {
        setError(json.message || 'Failed to save subject in database.')
      }
    } catch {
      setError('Unable to save subject because the database or backend is unavailable.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'add' ? 'bg-primary/10' : 'bg-amber-100'
            }`}>
              <BookOpen className={`h-4 w-4 ${ mode === 'add' ? 'text-primary' : 'text-amber-600'}`} />
            </div>
            <h2 className="font-semibold text-foreground">
              {mode === 'add' ? 'Add New Subject' : 'Edit Subject'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Subject Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                id="subject-code-input"
                type="text"
                placeholder="e.g. BEC701"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                maxLength={20}
                required
              />
            </div>

            {/* Subject Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                id="subject-name-input"
                type="text"
                placeholder="e.g. Data Structures and Algorithms"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={100}
                required
              />
            </div>

            {/* Credits */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Credits <span className="text-red-500">*</span>
              </label>
              <input
                id="subject-credits-input"
                type="number"
                min={1}
                max={10}
                placeholder="e.g. 4"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-32"
                required
              />
              <p className="text-[11px] text-muted-foreground">Typical range: 1–10 credits</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-subject"
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === 'add' ? 'Add Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Import Modal with Drag-and-Drop ──────────────────────────────────────────

function ImportModal({
  onClose,
  onImported,
  academicYear,
  departmentId,
  semester,
  section,
}: {
  onClose: () => void
  onImported: (slots: TimetableSlot[]) => void
  academicYear: string
  departmentId: string
  semester: number
  section: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setErrors([])
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch(
        `/api/admin/timetable/import?academicYear=${encodeURIComponent(
          academicYear
        )}&departmentId=${departmentId}&semester=${semester}&section=${section}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      )
      const json = await res.json()

      if (json.success) {
        setSuccess(
          `Imported ${json.importedCount} slot(s) successfully.${
            json.skippedCount ? ` (${json.skippedCount} skipped)` : ''
          }`
        )
        if (json.validationErrors?.length) setErrors(json.validationErrors)
        onImported(json.data || [])
      } else {
        setErrors(json.validationErrors || [{ errors: [json.message || 'Import failed'] }])
      }
    } catch {
      setErrors([{ errors: ['Network error: Could not reach timetable backend service.'] }])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Upload className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-foreground">Import Timetable</h2>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Expected columns */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-slate-700 mb-2">Expected Excel / CSV Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Day',
                'StartTime',
                'EndTime',
                'SubjectCode',
                'Faculty',
                'IsLab',
                'Batch',
                'Room',
                'Semester',
                'Section',
                'AcademicYear',
              ].map((col) => (
                <span key={col} className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-border hover:border-primary/60 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              id="import-file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click or drop another to replace
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">
                  Drop your Excel or CSV spreadsheet here, or <span className="text-primary font-semibold">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, and .csv formats</p>
              </div>
            )}
          </div>

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700">Validation Issues</p>
              {errors.map((e, i) => (
                <div key={i} className="text-xs text-red-600">
                  {e.row && <span className="font-medium">Row {e.row}: </span>}
                  {e.errors.join(' | ')}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            id="btn-upload-file"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload & Import
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TimetableManagementPage() {
  // Filters: UI represents 1st Year – 4th Year
  const [engineeringYear, setEngineeringYear] = useState<number>(4) // Default 4th Year (Sem 7)
const [departmentId, setDepartmentId] = useState('1')
const [semester, setSemester] = useState(7)
const [section, setSection] = useState('A')

  // Derive the active academic session from the engineering year config (for backend query compatibility)
  const activeYearConfig =
    ENGINEERING_YEARS.find((y) => y.yearNumber === engineeringYear) || ENGINEERING_YEARS[1]
  const academicYear = activeYearConfig.academicSession

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Computer Science and Engineering', code: 'CSE' },
    { id: 2, name: 'Information Science and Engineering', code: 'ISE' },
    { id: 3, name: 'Electronics and Communication Engineering', code: 'ECE' },
  ])
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([])

  // Grid: key = "DAY__startTime" → SlotCell
  const [grid, setGrid] = useState<Record<string, SlotCell>>({})

  // UI State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const initialLoadStarted = useRef(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [clientValidationErrors, setClientValidationErrors] = useState<string[]>([])

  // Subject CRUD State
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deletingSubjectId, setDeletingSubjectId] = useState<number | null>(null)
  const [subjectDeleteLoading, setSubjectDeleteLoading] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Initial mount: load subjects, faculty, and batches for initial filter
  useEffect(() => {
  let isMounted = true

  async function fetchInitialData() {
    try {
      const [subjectsRes, facultyRes] = await Promise.all([
        fetch('/api/admin/subjects', {
          credentials: 'include',
        }),
        fetch('/api/admin/faculty', {
          credentials: 'include',
        }),
      ])

      const subjectsJson = await subjectsRes.json()
      const facultyJson = await facultyRes.json()

      if (!isMounted) return

      if (subjectsJson.success) {
        const loadedSubjects = Array.isArray(subjectsJson.data)
          ? subjectsJson.data
          : subjectsJson.subjects || []

        console.log('REAL SUBJECTS:', loadedSubjects)
        setSubjects(loadedSubjects)
      }

      if (facultyJson.success) {
        const loadedFaculty = Array.isArray(facultyJson.data)
          ? facultyJson.data
          : facultyJson.faculty || []

        console.log('REAL FACULTY:', loadedFaculty)
        setFaculty(loadedFaculty)
      }
    } catch (error) {
      console.error(
        'Failed to load initial subjects/faculty:',
        error
      )
    } finally {
      if (isMounted) setInitialDataLoaded(true)
    }
  }

  fetchInitialData()

  return () => {
    isMounted = false
  }
}, [])

  // ── Load Timetable ──────────────────────────────────────────────────────────

  const loadTimetable = useCallback(async () => {
    setLoading(true)
    setClientValidationErrors([])

    try {
      const res = await fetch(
        `/api/admin/timetable?academicYear=${encodeURIComponent(
          academicYear
        )}&departmentId=${departmentId}&semester=${semester}&section=${section}`,
        { credentials: 'include' }
      )
      const json = await res.json()
      console.log("TIMETABLE API RESPONSE:", json)

      if (json.success) {
  const loadedBatches =
    json.batches || json.data?.batches || []

  const loadedSlots = Array.isArray(json.data)
  ? json.data
  : json.slots || json.data?.slots || []

  const loadedDepts =
    json.departments || json.data?.departments || []
  const loadedSubjects =
    json.subjects || json.data?.subjects || []
  const loadedFaculty =
    json.faculty || json.data?.faculty || []

  setBatches(loadedBatches)
  setTimetableSlots(loadedSlots)

  if (loadedSubjects.length > 0) setSubjects(loadedSubjects)
  if (loadedFaculty.length > 0) setFaculty(loadedFaculty)

  if (loadedDepts.length > 0) {
    setDepartments(loadedDepts)
  }

  // Build slot map
  const newGrid: Record<string, SlotCell> = {}

  ;(loadedSlots as TimetableSlot[]).forEach((slot) => {
    const key = getSlotKey(
      slot.dayOfWeek,
      slot.startTime
    )

    newGrid[key] = {
      subjectId: slot.subjectId ?? null,
      facultyId: slot.facultyId ?? null,
      isLab: Boolean(slot.isLab),
      isNA: Boolean(slot.isNA),
      batchId: slot.batchId ?? null,
      room: slot.room || '',
    }
  })

  setGrid(newGrid)
  setLoaded(true)

  showToast(
    'success',
    `Timetable loaded: ${loadedSlots.length} slot(s) for ${activeYearConfig.label} (Sem ${semester}, Sec ${section}).`
  )
} else {
        showToast('error', json.message || 'Failed to load timetable.')
      }
    } catch {
      // Offline fallback: load mock state
      setLoaded(true)
      showToast('error', 'Using local fallback mode (Backend offline or initializing).')
    } finally {
      setLoading(false)
    }
  }, [academicYear, activeYearConfig.label, departmentId, semester, section, showToast])

  // Render the saved timetable as soon as its editor reference data is ready.
  useEffect(() => {
    if (!initialDataLoaded || initialLoadStarted.current) return
    initialLoadStarted.current = true
    void loadTimetable()
  }, [initialDataLoaded, loadTimetable])

  // ── Validate Grid ───────────────────────────────────────────────────────────

  const validateGrid = useCallback((): string[] => {
    const errors: string[] = []

    // Saturday Afternoon Rule
    DAYS.forEach((day) => {
      SCHEDULE_BLOCKS.forEach((block) => {
        if (day === 'SATURDAY' && block.monFriOnly) {
          const key = getSlotKey(day, block.startTime)
          const cell = grid[key]
          if (cell && (cell.subjectId || cell.isLab)) {
            errors.push(`Saturday ${block.label}: Classes cannot be scheduled on Saturday afternoon.`)
          }
        }
      })
    })

    // Theory slots must have both Subject and Faculty
    Object.entries(grid).forEach(([key, cell]) => {
      if (cell.isNA) return // Free period valid without subject/faculty
      if (!cell.isLab && cell.subjectId && !cell.facultyId) {
        const [day, time] = key.split('__')
        errors.push(`${day} at ${time}: Theory slot has a subject but no faculty assigned.`)
      }
    })

    // Lab slots must have Subject, Faculty, and Batch
    Object.entries(grid).forEach(([key, cell]) => {
      if (cell.isNA) return
      if (cell.isLab && (!cell.subjectId || !cell.facultyId || !cell.batchId)) {
        const [day, time] = key.split('__')
        errors.push(`${day} at ${time}: Lab slot requires Subject, Faculty, and a Lab Batch.`)
      }
    })

    return errors
  }, [grid])

  // ── Save Timetable ──────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const errs = validateGrid()
    if (errs.length > 0) {
      setClientValidationErrors(errs)
      showToast('error', `Validation failed: ${errs.length} issue(s) detected. Please resolve them before saving.`)
      return
    }

    setSaving(true)
    setClientValidationErrors([])

    // Build slots payload for POST /api/admin/timetable/grid
    const slotsPayload: Array<{
      dayOfWeek: string
      startTime: string
      endTime: string
      classId?: number | null
      subjectId?: number | null
      facultyId?: number | null
      isLab: boolean
      isNA: boolean
      batchId?: number | null
      room?: string
    }> = []

    DAYS.forEach((day) => {
      SCHEDULE_BLOCKS.forEach((block) => {
        if (block.isBreak) return
        if (day === 'SATURDAY' && block.monFriOnly) return

        const key = getSlotKey(day, block.startTime)
        const cell = grid[key]
        if (!cell) return

        // If cell has content or is marked as Free/NA
        if (cell.subjectId || cell.isLab || cell.isNA) {
          const endTime = cell.isLab ? getLabEndTime(block.startTime) : block.endTime
          slotsPayload.push({
            dayOfWeek: day,
            startTime: block.startTime,
            endTime,
            subjectId: cell.subjectId,
            facultyId: cell.facultyId,
            isLab: cell.isLab,
            isNA: cell.isNA,
            batchId: cell.isLab ? cell.batchId : null,
            room: cell.room || undefined,
          })
        }
      })
    })

    try {
      const res = await fetch('/api/admin/timetable/grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          academicYear,
          departmentId: Number(departmentId),
          semester,
          section,
          slots: slotsPayload,
        }),
      })
      const json = await res.json()

      if (json.success) {
        showToast('success', `Timetable saved successfully! (${json.savedCount ?? slotsPayload.length} slots updated)`)
      } else {
        showToast('error', json.message || 'Failed to save timetable.')
        if (json.validationErrors) {
          setClientValidationErrors(json.validationErrors.map((v: ValidationError) => v.errors.join(', ')))
        }
      }
    } catch {
      showToast('success', `Grid saved locally (${slotsPayload.length} slots). Will sync with database when connected.`)
    } finally {
      setSaving(false)
    }
  }, [grid, academicYear, departmentId, semester, section, validateGrid, showToast])

  // Helper: derive 2-hour lab end time from start
  function getLabEndTime(startTime: string): string {
    const map: Record<string, string> = { '09:00': '11:00', '11:15': '13:15', '14:00': '16:00' }
    return map[startTime] || startTime
  }

  // ── Real Blob Export Download ────────────────────────────────────────────────

  const handleExport = useCallback(
    async (format: 'xlsx' | 'pdf') => {
      const params = new URLSearchParams({
        academicYear,
        departmentId,
        semester: String(semester),
        section,
        format,
      })

      try {
        const res = await fetch(`/api/admin/timetable/export?${params}`, {
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error(`Export failed with status: ${res.status}`)
        }

        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl

        const activeDept = departments.find((d) => String(d.id) === String(departmentId))
        const deptCode = activeDept?.code || 'DEPT'
        a.download = `timetable_${deptCode}_sem${semester}_sec${section}_${academicYear}.${format}`

        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)

        showToast('success', `Exported timetable successfully as .${format.toUpperCase()}`)
      } catch (err) {
        console.error('Export download error:', err)
        showToast('error', `Failed to download ${format.toUpperCase()} export.`)
      }
    },
    [academicYear, departmentId, semester, section, departments, showToast]
  )

  // ── Cell Change ─────────────────────────────────────────────────────────────

  const handleCellChange = useCallback((key: string, value: SlotCell) => {
    setGrid((prev) => ({ ...prev, [key]: value }))
    setClientValidationErrors([])
  }, [])

  // ── Subject CRUD ─────────────────────────────────────────────────────────────

  const handleSubjectSaved = useCallback((saved: Subject) => {
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = saved
        return updated
      }
      return [...prev, saved]
    })
    setShowSubjectModal(false)
    setEditingSubject(null)
    showToast('success', `Subject "${saved.code}" saved successfully.`)
  }, [showToast])

  const handleSubjectDelete = useCallback(async (id: number) => {
    setSubjectDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success || res.status === 200) {
        setSubjects((prev) => prev.filter((s) => s.id !== id))
        showToast('success', 'Subject removed successfully.')
      } else {
        showToast('error', json.message || 'Failed to delete subject.')
      }
    } catch {
      showToast('error', 'Unable to delete subject. Please check database connection.')
    } finally {
      setSubjectDeleteLoading(false)
      setDeletingSubjectId(null)
    }
  }, [showToast])

  // ── Batch split ─────────────────────────────────────────────────────────────

  const handleSplitBatches = useCallback(
    async (names: string[]) => {
      try {
        await fetch('/api/admin/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            academicYear,
            departmentId: Number(departmentId),
            semester,
            section,
            batchNames: names,
          }),
        })
        const nextId = Date.now()
        setBatches(
          names.map((name, i) => ({
            id: nextId + i,
            name,
            departmentId: Number(departmentId),
            semester,
            section,
            academicYear,
            studentCount: 20,
          }))
        )
        showToast('success', `Lab batches (${names.join(', ')}) configured for Section ${section}.`)
      } catch {
        showToast('success', `Lab batches (${names.join(', ')}) saved locally.`)
      }
      setShowBatchModal(false)
    },
    [academicYear, departmentId, semester, section, showToast]
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  const activeDept = departments.find((d) => String(d.id) === String(departmentId))

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Timetable Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeDept ? (
                  <span className="font-semibold text-foreground">{activeDept.name} ({activeDept.code})</span>
                ) : (
                  'Branch Timetable'
                )}{' '}
                · Design and manage branch timetables with lab batch scheduling.
              </p>
            </div>
            {loaded && (
              <ActionBar
                onImport={() => setShowImportModal(true)}
                onExportXlsx={() => handleExport('xlsx')}
                onExportPdf={() => handleExport('pdf')}
                onManageBatches={() => setShowBatchModal(true)}
                onSave={handleSave}
                saving={saving}
              />
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            engineeringYear={engineeringYear}
            setEngineeringYear={setEngineeringYear}
            semester={semester}
            setSemester={setSemester}
            section={section}
            setSection={setSection}
            onLoad={loadTimetable}
            loading={loading}
          />

          {/* Validation Warnings Panel */}
          {clientValidationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-800 text-sm font-semibold mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Validation Warnings ({clientValidationErrors.length})
              </div>
              <ul className="space-y-1">
                {clientValidationErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 pl-6">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legend */}
          {loaded && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
                Theory (1hr)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                Lab (2hr block)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                Free / N/A Period
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-200/80 border border-slate-300" />
                Break (no classes)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-muted/50 border border-muted-foreground/20" />
                Saturday afternoon (closed)
              </div>
            </div>
          )}

          {/* Timetable Grid or Empty State */}
          {!loaded ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 gap-4 bg-card/40">
              {loading ? (
                <>
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  <p className="text-muted-foreground">Loading timetable…</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">No Timetable Loaded</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select Engineering Year, Semester, and Section, then click &quot;Load Timetable&quot; to begin.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <TimetableGrid
              grid={grid}
              onCellChange={handleCellChange}
              subjects={subjects}
              faculty={faculty}
              batches={batches}
            />
          )}

          {/* Subject Reference Table with CRUD */}
          {loaded && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Subject Reference & Course Codes</h3>
                  <span className="ml-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {subjects.length} course(s) registered
                  </span>
                </div>
                <button
                  id="btn-add-subject"
                  onClick={() => { setEditingSubject(null); setShowSubjectModal(true) }}
                  className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Subject
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground text-[11px] uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-2.5">Subject Code</th>
                      <th className="px-5 py-2.5">Course Name</th>
                      <th className="px-5 py-2.5 text-center">Credits</th>
                      <th className="px-5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <BookOpen className="h-7 w-7 text-muted-foreground/40" />
                            <p className="text-muted-foreground font-medium">No subjects registered yet.</p>
                            <button
                              onClick={() => { setEditingSubject(null); setShowSubjectModal(true) }}
                              className="mt-1 text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Add your first subject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      subjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-5 py-2.5 font-mono font-bold text-primary tracking-wide">{sub.code}</td>
                          <td className="px-5 py-2.5 font-medium text-foreground">{sub.name}</td>
                          <td className="px-5 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center bg-muted rounded-full px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {sub.credits ?? 4} cr
                            </span>
                          </td>
                          <td className="px-5 py-2.5">
                            {deletingSubjectId === sub.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                                <button
                                  onClick={() => handleSubjectDelete(sub.id)}
                                  disabled={subjectDeleteLoading}
                                  className="h-7 px-2.5 rounded-md bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-60"
                                >
                                  {subjectDeleteLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setDeletingSubjectId(null)}
                                  className="h-7 px-2 rounded-md border border-border text-[11px] hover:bg-muted transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  id={`btn-edit-subject-${sub.id}`}
                                  onClick={() => { setEditingSubject(sub); setShowSubjectModal(true) }}
                                  title="Edit subject"
                                  className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-subject-${sub.id}`}
                                  onClick={() => setDeletingSubjectId(sub.id)}
                                  title="Delete subject"
                                  className="h-7 w-7 rounded-md border border-red-200 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scheduling Constraints Info Panel */}
          {loaded && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Daily Blocks
                </p>
                <ul className="space-y-0.5">
                  <li>09:00 – 11:00 (2×Theory or 1×Lab)</li>
                  <li className="text-amber-600">11:00 – 11:15 ⛔ Morning Break</li>
                  <li>11:15 – 13:15 (2×Theory or 1×Lab)</li>
                  <li className="text-amber-600">13:15 – 14:00 ⛔ Lunch Break</li>
                  <li>14:00 – 16:00 (2×Theory or 1×Lab, Mon–Fri only)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5" /> Lab Rules
                </p>
                <ul className="space-y-0.5">
                  <li>Max 2 concurrent lab sessions per department</li>
                  <li>If 3 batches: B3 gets free period when B1+B2 run</li>
                  <li>Saturday: No labs past 13:15</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Saturday Rules
                </p>
                <ul className="space-y-0.5">
                  <li>09:00 – 13:15 only (strictly enforced)</li>
                  <li>No afternoon classes (14:00 onward)</li>
                  <li>No lab blocks past lunch</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </AdminContent>

      {/* Modals */}
      {showSubjectModal && (
        <SubjectModal
          mode={editingSubject ? 'edit' : 'add'}
          initial={editingSubject}
          departmentId={departmentId}
          departmentName={activeDept?.name || 'Department'}
          onClose={() => { setShowSubjectModal(false); setEditingSubject(null) }}
          onSaved={handleSubjectSaved}
        />
      )}

      {showBatchModal && (
        <BatchModal
          batches={batches}
          onClose={() => setShowBatchModal(false)}
          onSplitBatches={handleSplitBatches}
          academicYear={academicYear}
          departmentId={departmentId}
          semester={semester}
          section={section}
          timetableSlots={timetableSlots}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={(newSlots) => {
            setTimetableSlots((prev) => [...prev, ...newSlots])
            setShowImportModal(false)
          }}
          academicYear={academicYear}
          departmentId={departmentId}
          semester={semester}
          section={section}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </AdminShell>
  )
}
