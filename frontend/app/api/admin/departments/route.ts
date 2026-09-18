import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!session.backendToken) {
      return NextResponse.json(
        { success: false, message: 'Backend authentication token missing' },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(
      `${backendUrl}/api/departments`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.backendToken}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      }
    )

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error) {
    console.error('Admin departments proxy error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch departments',
      },
      { status: 502 }
    )
  }
}