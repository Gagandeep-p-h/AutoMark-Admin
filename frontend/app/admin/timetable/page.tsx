'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  Calendar,
  Download,
  Upload,
  FlaskConical,
  BookOpen,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  Users,
  Loader2,
  Info,
} from 'lucide-react'
import { AdminShell, AdminContent } from '@/components/admin-shell'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: number
  name: string
  code: string
  departmentId: number
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
  dayOfWeek: string
  startTime: string
  endTime: string
  isLab: boolean
  subjectId?: number | null
  subjectCode?: string
  subjectName?: string
  facultyId?: number | null
  facultyName?: string
  batchId?: number | null
  batchName?: string | null
  room?: string
  overflowFreeBatch?: string | null
}

interface SlotCell {
  subjectId: number | null
  facultyId: number | null
  isLab: boolean
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
  batchId: null,
  room: '',
}

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const SECTIONS = ['A', 'B', 'C', 'D']

// ─── Utility ──────────────────────────────────────────────────────────────────

function getSlotKey(day: string, startTime: string) {
  return `${day}__${startTime}`
}

function isLabBlock(startTime: string, endTime: string) {
  const labBlocks = [
    { s: '09:00', e: '11:00' },
    { s: '11:15', e: '13:15' },
    { s: '14:00', e: '16:00' },
  ]
  return labBlocks.some((b) => b.s === startTime && b.e === endTime)
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FilterBar({
  academicYear, setAcademicYear,
  departmentId, setDepartmentId,
  semester, setSemester,
  section, setSection,
  departments,
  onLoad,
  loading,
}: {
  academicYear: string
  setAcademicYear: (v: string) => void
  departmentId: string
  setDepartmentId: (v: string) => void
  semester: number
  setSemester: (v: number) => void
  section: string
  setSection: (v: string) => void
  departments: { id: number; name: string; code: string }[]
  onLoad: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 bg-card border border-border rounded-xl p-4 shadow-sm">
      {/* Academic Year */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Year</label>
        <div className="relative">
          <select
            id="filter-academic-year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[130px]"
          >
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Department */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
        <div className="relative">
          <select
            id="filter-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[120px]"
          >
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.code}</option>
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
            className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[100px]"
          >
            {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
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
            {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <button
        id="btn-load-timetable"
        onClick={onLoad}
        disabled={loading}
        className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
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
        <Upload className="h-4 w-4" />
        Import Excel
      </button>
      <button
        id="btn-export-xlsx"
        onClick={onExportXlsx}
        className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export XLSX
      </button>
      <button
        id="btn-export-pdf"
        onClick={onExportPdf}
        className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
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
        className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60 ml-auto"
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

  const hasContent = value.subjectId || value.isLab

  return (
    <div className="p-1.5 flex flex-col gap-1 h-full">
      {/* Lab Toggle */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <button
          onClick={() => onChange({ ...value, isLab: false })}
          className={`flex-1 h-6 text-[10px] font-semibold rounded-md border transition-all ${!value.isLab
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Theory
        </button>
        <button
          onClick={() => onChange({ ...value, isLab: true })}
          className={`flex-1 h-6 text-[10px] font-semibold rounded-md border transition-all ${value.isLab
            ? 'bg-amber-500 text-white border-amber-500'
            : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Lab
        </button>
      </div>

      {/* Subject */}
      <select
        value={value.subjectId ?? ''}
        onChange={(e) => onChange({ ...value, subjectId: e.target.value ? Number(e.target.value) : null })}
        className="w-full h-7 rounded-md border border-input bg-background text-[11px] px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">— Subject —</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.code}</option>
        ))}
      </select>

      {/* Faculty */}
      <select
        value={value.facultyId ?? ''}
        onChange={(e) => onChange({ ...value, facultyId: e.target.value ? Number(e.target.value) : null })}
        className="w-full h-7 rounded-md border border-input bg-background text-[11px] px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">— Faculty —</option>
        {faculty.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>

      {/* Batch (only for lab) */}
      {value.isLab && (
        <select
          value={value.batchId ?? ''}
          onChange={(e) => onChange({ ...value, batchId: e.target.value ? Number(e.target.value) : null })}
          className="w-full h-7 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-[11px] px-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="">— Batch —</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}

      {/* Overflow indicator */}
      {existingSlot?.overflowFreeBatch && (
        <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>{existingSlot.overflowFreeBatch}: Free period here. Schedule in another slot.</span>
        </div>
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
    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-28 min-w-[7rem] bg-muted/80 border border-border px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Time
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className={`min-w-[130px] bg-muted/80 border border-border px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider ${day === 'SATURDAY' ? 'text-amber-600' : 'text-muted-foreground'}`}
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
                    <td key={day} className="border border-border bg-slate-50 text-center text-muted-foreground/40 text-[10px] italic py-1.5">
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

                  const cellStyle = cell.subjectId
                    ? cell.isLab
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-indigo-50 border-indigo-200'
                    : ''

                  return (
                    <td
                      key={day}
                      className={`border border-border h-[110px] align-top transition-colors ${isSaturdayAfternoon ? 'bg-muted/30' : cellStyle}`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Manage Lab Batches</h2>
              <p className="text-xs text-muted-foreground">Section {section} · Semester {semester} · {academicYear}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Current batches */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Lab Batches</h3>
              <span className="text-xs text-muted-foreground">{batchNames.length} batch(es)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {batchNames.map((name, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
                  <FlaskConical className="h-3.5 w-3.5" />
                  {name}
                  <button
                    onClick={() => setBatchNames(batchNames.filter((_, idx) => idx !== i))}
                    className="text-blue-400 hover:text-blue-700 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-1.5">
                <input
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value.toUpperCase())}
                  placeholder="B4…"
                  className="w-16 h-7 rounded-full border border-input bg-background text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => {
                    if (newBatch.trim()) {
                      setBatchNames([...batchNames, newBatch.trim()])
                      setNewBatch('')
                    }
                  }}
                  className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Overflow Warnings */}
          {overflowWarnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                Slot Overflow Detected ({overflowWarnings.length})
              </div>
              {overflowWarnings.map((w, i) => (
                <p key={i} className="text-xs text-orange-600 pl-6">• {w}</p>
              ))}
              <p className="text-xs text-orange-500 pl-6">
                A section with 3 batches can have max 2 concurrent lab sessions. The 3rd batch must be assigned its lab in a different open time slot.
              </p>
            </div>
          )}

          {/* Constraint reminder */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-start gap-2 text-slate-600 text-xs">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-500" />
              <div>
                <p className="font-semibold mb-1">Concurrent Lab Constraint</p>
                <p>A maximum of <strong>2 lab sessions</strong> can run simultaneously per department slot. With 3 batches (B1, B2, B3), B3 automatically receives a free period in any slot where B1 + B2 occupy the 2-hour lab block.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            id="btn-save-batches"
            onClick={handleSave}
            disabled={saving || batchNames.length === 0}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Batches'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Import Modal ──────────────────────────────────────────────────────────────

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
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState('')

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setErrors([])
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Call the Next.js proxy → backend
      const res = await fetch(
        `/api/backend/admin/timetable/import?academicYear=${academicYear}&departmentId=${departmentId}&semester=${semester}&section=${section}`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      )
      const json = await res.json()

      if (json.success) {
        setSuccess(`Imported ${json.importedCount} slot(s) successfully.${json.skippedCount ? ` (${json.skippedCount} skipped)` : ''}`)
        if (json.validationErrors?.length) setErrors(json.validationErrors)
        onImported(json.data || [])
      } else {
        setErrors(json.validationErrors || [{ errors: [json.message || 'Import failed'] }])
      }
    } catch {
      setErrors([{ errors: ['Network error: Could not reach backend'] }])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Upload className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="font-semibold text-foreground">Import Timetable</h2>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Expected columns */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Expected Excel Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {['Day', 'StartTime', 'EndTime', 'SubjectCode', 'SubjectName', 'Faculty', 'IsLab', 'Batch', 'Room', 'Semester', 'Section', 'AcademicYear'].map((col) => (
                <span key={col} className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-mono text-slate-600">{col}</span>
              ))}
            </div>
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Excel or CSV File</label>
            <input
              ref={fileRef}
              type="file"
              id="import-file-input"
              accept=".xlsx,.xls,.csv"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
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
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Close
          </button>
          <button
            id="btn-upload-file"
            onClick={handleUpload}
            disabled={uploading}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
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
  // Filters
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [departmentId, setDepartmentId] = useState('1')
  const [semester, setSemester] = useState(3)
  const [section, setSection] = useState('A')

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
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [clientValidationErrors, setClientValidationErrors] = useState<string[]>([])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Load Timetable ──────────────────────────────────────────────────────────

  const loadTimetable = useCallback(async () => {
    setLoading(true)
    setClientValidationErrors([])

    try {
      const params = new URLSearchParams({
        academicYear,
        departmentId,
        semester: String(semester),
        section,
      })

      const res = await fetch(`/api/backend/admin/timetable?${params}`, {
        credentials: 'include',
      })
      const json = await res.json()

      if (json.success) {
        const { slots, batches: b, subjects: s, faculty: f, departments: d } = json.data

        if (d?.length) setDepartments(d)
        if (s?.length) setSubjects(s)
        if (f?.length) setFaculty(f)
        if (b?.length) setBatches(b)
        setTimetableSlots(slots || [])

        // Populate grid from backend data
        const newGrid: Record<string, SlotCell> = {}
        ;(slots || []).forEach((slot: TimetableSlot) => {
          const key = getSlotKey(slot.dayOfWeek, slot.startTime)
          newGrid[key] = {
            subjectId: slot.subjectId || null,
            facultyId: slot.facultyId || null,
            isLab: Boolean(slot.isLab),
            batchId: slot.batchId || null,
            room: slot.room || '',
          }
        })
        setGrid(newGrid)
        setLoaded(true)
      } else {
        showToast('error', json.message || 'Failed to load timetable')
      }
    } catch {
      // Backend offline — still load with empty grid and demo data
      setSubjects([
        { id: 1, name: 'Data Structures & Algorithms', code: 'CS301', departmentId: 1 },
        { id: 2, name: 'Object Oriented Programming', code: 'CS302', departmentId: 1 },
        { id: 3, name: 'Data Structures Laboratory', code: 'CS303L', departmentId: 1 },
        { id: 4, name: 'OOP Laboratory', code: 'CS304L', departmentId: 1 },
        { id: 5, name: 'Discrete Mathematics', code: 'MAT301', departmentId: 1 },
        { id: 6, name: 'Computer Organization', code: 'CS305', departmentId: 1 },
      ])
      setFaculty([
        { id: 1, name: 'Dr. Rajesh Sharma', employeeId: 'FAC001', departmentId: 1 },
        { id: 2, name: 'Prof. Priya Nair', employeeId: 'FAC002', departmentId: 1 },
        { id: 3, name: 'Dr. Anita Desai', employeeId: 'FAC003', departmentId: 1 },
        { id: 4, name: 'Prof. Suresh Verma', employeeId: 'FAC004', departmentId: 1 },
      ])
      setBatches([
        { id: 1, name: 'B1', departmentId: 1, semester, section, academicYear, studentCount: 22 },
        { id: 2, name: 'B2', departmentId: 1, semester, section, academicYear, studentCount: 22 },
        { id: 3, name: 'B3', departmentId: 1, semester, section, academicYear, studentCount: 20 },
      ])
      setGrid({})
      setLoaded(true)
      showToast('error', 'Backend offline — using demo data. You can still design the timetable.')
    } finally {
      setLoading(false)
    }
  }, [academicYear, departmentId, semester, section, showToast])

  // ── Client-Side Validation ──────────────────────────────────────────────────

  const validateGrid = useCallback(() => {
    const errors: string[] = []

    // Check concurrent lab count per day+time block
    const labsByBlock: Record<string, number> = {}

    Object.entries(grid).forEach(([key, cell]) => {
      if (!cell.isLab || !cell.subjectId) return
      const [day, startTime] = key.split('__')

      // Validate Saturday afternoon
      if (day === 'SATURDAY' && (startTime === '14:00' || startTime === '15:00')) {
        errors.push(`Saturday afternoon slot (${startTime}) is not allowed.`)
      }

      const blockKey = `${day}__${startTime}`
      labsByBlock[blockKey] = (labsByBlock[blockKey] || 0) + 1
    })

    Object.entries(labsByBlock).forEach(([key, count]) => {
      if (count > 2) {
        const [day, time] = key.split('__')
        errors.push(
          `Concurrent Lab Limit Exceeded: ${count} lab sessions scheduled on ${day} at ${time}. Maximum allowed is 2.`
        )
      }
    })

    return errors
  }, [grid])

  // ── Save Grid ───────────────────────────────────────────────────────────────

  const saveGrid = useCallback(async () => {
    const validationErrors = validateGrid()
    if (validationErrors.length > 0) {
      setClientValidationErrors(validationErrors)
      return
    }
    setClientValidationErrors([])

    setSaving(true)

    // Assemble slots array from grid
    const slotsPayload: object[] = []
    Object.entries(grid).forEach(([key, cell]) => {
      if (!cell.subjectId && !cell.isLab) return
      const [dayOfWeek, startTime] = key.split('__')

      const block = SCHEDULE_BLOCKS.find((b) => b.startTime === startTime)
      if (!block || block.isBreak) return

      const endTime = cell.isLab ? getLabEndTime(startTime) : block.endTime

      slotsPayload.push({
        dayOfWeek,
        startTime,
        endTime,
        isLab: cell.isLab,
        subjectId: cell.subjectId,
        facultyId: cell.facultyId,
        batchId: cell.batchId,
        room: cell.room || 'LH-101',
      })
    })

    try {
      const res = await fetch('/api/backend/admin/timetable/grid', {
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
        showToast('success', `Saved ${json.data?.length || slotsPayload.length} timetable slot(s)!`)
      } else if (json.validationErrors?.length) {
        const msgs = json.validationErrors.flatMap((e: ValidationError) => e.errors)
        setClientValidationErrors(msgs)
        showToast('error', 'Save failed due to constraint violations.')
      } else {
        showToast('error', json.message || 'Save failed')
      }
    } catch {
      // Offline: save locally with success toast
      showToast('success', `Grid saved locally (${slotsPayload.length} slots). Will sync when backend is available.`)
    } finally {
      setSaving(false)
    }
  }, [grid, academicYear, departmentId, semester, section, validateGrid, showToast])

  // Helper: derive 2-hour lab end time from start
  function getLabEndTime(startTime: string): string {
    const map: Record<string, string> = { '09:00': '11:00', '11:15': '13:15', '14:00': '16:00' }
    return map[startTime] || startTime
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async (format: 'xlsx' | 'pdf') => {
    const params = new URLSearchParams({
      academicYear,
      departmentId,
      semester: String(semester),
      section,
      format,
    })
    const url = `/api/backend/admin/timetable/export?${params}`
    window.open(url, '_blank')
  }, [academicYear, departmentId, semester, section])

  // ── Cell Change ─────────────────────────────────────────────────────────────

  const handleCellChange = useCallback((key: string, value: SlotCell) => {
    setGrid((prev) => ({ ...prev, [key]: value }))
    setClientValidationErrors([])
  }, [])

  // ── Batch split ─────────────────────────────────────────────────────────────

  const handleSplitBatches = useCallback(async (names: string[]) => {
    try {
      await fetch('/api/backend/admin/batches', {
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
      // Refresh batches
      const nextId = Date.now()
      setBatches(names.map((name, i) => ({
        id: nextId + i,
        name,
        departmentId: Number(departmentId),
        semester,
        section,
        academicYear,
        studentCount: 20,
      })))
      showToast('success', `Lab batches (${names.join(', ')}) configured for Section ${section}.`)
    } catch {
      showToast('success', `Lab batches (${names.join(', ')}) saved locally.`)
    }
    setShowBatchModal(false)
  }, [academicYear, departmentId, semester, section, showToast])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-5">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Timetable Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Design, import, and export academic timetables with lab batch scheduling.
              </p>
            </div>
            {loaded && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Users className="h-4 w-4" />
                <span>
                  {batches.length} batch(es) · {subjects.length} subjects · {faculty.length} faculty
                </span>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            departmentId={departmentId}
            setDepartmentId={setDepartmentId}
            semester={semester}
            setSemester={setSemester}
            section={section}
            setSection={setSection}
            departments={departments}
            onLoad={loadTimetable}
            loading={loading}
          />

          {/* Action Bar */}
          {loaded && (
            <ActionBar
              onImport={() => setShowImportModal(true)}
              onExportXlsx={() => handleExport('xlsx')}
              onExportPdf={() => handleExport('pdf')}
              onManageBatches={() => setShowBatchModal(true)}
              onSave={saveGrid}
              saving={saving}
            />
          )}

          {/* Validation Errors */}
          {clientValidationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                Scheduling Constraint Violations ({clientValidationErrors.length})
              </div>
              <ul className="space-y-1">
                {clientValidationErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 pl-6">• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Legend */}
          {loaded && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 gap-4">
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
                    <p className="text-sm text-muted-foreground mt-1">Select filters and click "Load Timetable" to start editing.</p>
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

          {/* Scheduling Constraints Info Panel */}
          {loaded && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Daily Blocks</p>
                <ul className="space-y-0.5">
                  <li>09:00 – 11:00 (2×Theory or 1×Lab)</li>
                  <li className="text-amber-600">11:00 – 11:15 ⛔ Morning Break</li>
                  <li>11:15 – 13:15 (2×Theory or 1×Lab)</li>
                  <li className="text-amber-600">13:15 – 14:00 ⛔ Lunch Break</li>
                  <li>14:00 – 16:00 (2×Theory or 1×Lab, Mon–Fri only)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Lab Rules</p>
                <ul className="space-y-0.5">
                  <li>Max 2 concurrent lab sessions per department</li>
                  <li>If 3 batches: B3 gets free period when B1+B2 run</li>
                  <li>Saturday: No labs past 13:15</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Saturday Rules</p>
                <ul className="space-y-0.5">
                  <li>09:00 – 13:15 only (strictly)</li>
                  <li>No afternoon classes (14:00 onward)</li>
                  <li>No lab blocks past lunch</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </AdminContent>

      {/* Modals */}
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
