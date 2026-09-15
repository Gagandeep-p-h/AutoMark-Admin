'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminContent, AdminShell } from '@/components/admin-shell'
import { createStudent } from '@/lib/api'

export default function Page() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [usn, setUsn] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [semester, setSemester] = useState('6')
  const [section, setSection] = useState('A')
  const [academicYear, setAcademicYear] = useState('2026-27')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("CREATE STUDENT SUBMIT FIRED");

    setError('')

    if (!name.trim() || !usn.trim() || !email.trim()) {
      setError('Name, USN, and Email are required.')
      return
    }
    try {
  setLoading(true)

  await createStudent({
    name: name.trim(),
    email: email.trim(),
    registerNumber: usn.trim().toUpperCase(),
    department: department.trim(),
    semester: Number(semester),
    section: section.trim().toUpperCase(),
    academicYear: academicYear.trim(),
  })

  alert('Student created successfully.')
  router.push('/admin/students')
  router.refresh()
} catch (err) {
  console.error('Create student failed:', err)

  setError(
    err instanceof Error
      ? err.message
      : 'Failed to create student.'
  )
} finally {
  setLoading(false)
}
  }
  

  return (
    <AdminShell>
      <AdminContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Create Student
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new student to the system.
            </p>
          </div>

          <Link
            href="/admin/students"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm"
          >
            Back to Students
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-5">

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jiten Kumar"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                USN *
              </label>
              <input
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                placeholder="e.g. 2VD24CS003"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Department
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Section
                </label>
                <input
                  value={section}
                  onChange={(e) => setSection(e.target.value.toUpperCase())}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Academic Year
                </label>
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">

              <Link
                href="/admin/students"
                className="inline-flex items-center justify-center h-10 px-5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent"
              >
                Cancel
              </Link>

              <button
  type="button"
  onClick={() => {
    console.log("CREATE BUTTON CLICKED")
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }}
  disabled={loading}
  className="inline-flex items-center justify-center h-10 px-5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
>
  {loading ? 'Creating...' : 'Create Student'}
</button>

            </div>
          </div>
        </form>
      </AdminContent>
    </AdminShell>
  )
}