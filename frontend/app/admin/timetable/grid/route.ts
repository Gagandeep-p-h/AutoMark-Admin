import { NextResponse } from 'next/server'
import { getSession, getBackendToken } from '@/lib/auth'

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000'

export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const token = await getBackendToken(session)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Backend authentication token missing',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const backendRes = await fetch(
      `${BACKEND_INTERNAL_URL}/api/admin/timetable/grid`,
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

    const data = await backendRes.json()

    return NextResponse.json(data, {
      status: backendRes.status,
    })
  } catch (error) {
    console.error(
      'Admin timetable grid proxy error:',
      error
    )

    console.error(
      'Error details:',
      error instanceof Error ? error.message : error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to connect to timetable backend',
      },
      { status: 502 }
    )
  }
}