import { NextResponse } from 'next/server'
import { getBackendToken, getSession } from '@/lib/auth'

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000'

export async function GET(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = await getBackendToken(session)

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Backend authentication token missing' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.toString()

    const backendUrl =
      `${BACKEND_INTERNAL_URL}/api/admin/students` +
      (query ? `?${query}` : '')

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin students GET proxy error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to backend',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = await getBackendToken(session)

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Backend authentication token missing' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const response = await fetch(
      `${BACKEND_INTERNAL_URL}/api/admin/students`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Admin students POST proxy error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to backend',
      },
      { status: 500 }
    )
  }
}