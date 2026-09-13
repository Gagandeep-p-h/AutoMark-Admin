import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const dataFilePath = path.join(dataDir, 'students.json')
const metaFilePath = path.join(dataDir, 'students_meta.json')

function ensureDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function getStoredStudents() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Failed to read data/students.json:', e)
  }
  return []
}

function getStoredMeta() {
  try {
    if (fs.existsSync(metaFilePath)) {
      const content = fs.readFileSync(metaFilePath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('Failed to read data/students_meta.json:', e)
  }
  return { customSections: {}, customLabBatches: {} }
}

export async function GET() {
  const students = getStoredStudents()
  const meta = getStoredMeta()
  return NextResponse.json({
    success: true,
    data: students,
    meta
  })
}

export async function POST(req: Request) {
  try {
    ensureDirectory()
    const body = await req.json()
    const students = body.students
    const customSections = body.customSections
    const customLabBatches = body.customLabBatches

    if (Array.isArray(students)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(students, null, 2), 'utf-8')
    }

    if (customSections || customLabBatches) {
      const meta = {
        customSections: customSections || {},
        customLabBatches: customLabBatches || {}
      }
      fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf-8')
    }

    return NextResponse.json({
      success: true,
      count: Array.isArray(students) ? students.length : 0
    })
  } catch (e: any) {
    console.error('Failed to save students:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
