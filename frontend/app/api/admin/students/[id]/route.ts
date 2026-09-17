import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';

/** Safely parse JSON from a fetch Response; returns a fallback object if the body is not JSON (e.g. HTML error page from proxy/server). */
async function safeJson(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  return { success: false, message: `Server error (HTTP ${res.status}): ${text.replace(/<[^>]+>/g, '').trim().slice(0, 200)}` };
}

type Context = {
  params: Promise<{ id: string }> | { id: string }
}

async function getAuthHeaders(includeBody = false) {
  const session = await getSession()

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (includeBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (session?.backendToken) {
    headers['Authorization'] = `Bearer ${session.backendToken}`
  }

  return headers
}

export async function PATCH(req: Request, context: Context) {
  try {
    const params = await Promise.resolve(context.params)
    const body = await req.json()

    const backendRes = await fetch(
      `${BACKEND_INTERNAL_URL}/api/admin/students/${params.id}`,
      {
        method: 'PATCH',
        headers: await getAuthHeaders(true),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      }
    )

    const data = await safeJson(backendRes)

    return NextResponse.json(data, {
      status: backendRes.status,
    })
  } catch (error: any) {
    console.error('Admin student PATCH proxy error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update student',
      },
      { status: 502 }
    )
  }
}

export async function PUT(req: Request, context: Context) {
  return PATCH(req, context)
}

export async function DELETE(req: Request, context: Context) {
  try {
    const params = await Promise.resolve(context.params)

    const backendRes = await fetch(
      `${BACKEND_INTERNAL_URL}/api/admin/students/${params.id}`,
      {
        method: 'DELETE',
        headers: await getAuthHeaders(false),
        signal: AbortSignal.timeout(6000),
      }
    )

    const data = await safeJson(backendRes)

    return NextResponse.json(data, {
      status: backendRes.status,
    })
  } catch (error: any) {
    console.error('Admin student DELETE proxy error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete student',
      },
      { status: 502 }
    )
  }
}