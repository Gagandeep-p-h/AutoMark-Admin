import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSession } from '@/lib/auth'

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const rateLimit = checkRateLimit(ip)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // 1. Authenticate against live Express Backend
    try {
      const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: normalizedEmail,
          password: password,
        }),
        signal: AbortSignal.timeout(5000),
      })

      const result = await backendRes.json().catch(() => ({}))

      if (backendRes.ok && result.success && result.data) {
        await createSession({
          userId: String(result.data.user.id),
          email: result.data.user.email,
          name: result.data.user.name,
          role: result.data.user.role,
          departmentId: result.data.user.departmentId ?? null,
          departmentCode: result.data.user.departmentCode ?? null,
          backendToken: result.data.token,
        })

        return NextResponse.json({
          success: true,
          redirect: '/admin/dashboard',
          source: 'backend',
        })
      }

      return NextResponse.json(
        { error: result.message || 'Invalid username/email or password' },
        { status: backendRes.status || 401 }
      )
    } catch (backendErr) {
      console.error('Backend authentication unreachable:', backendErr)
      return NextResponse.json(
        { error: 'Authentication service unavailable. Please check backend server.' },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
