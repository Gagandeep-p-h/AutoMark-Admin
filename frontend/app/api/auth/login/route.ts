import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSession } from '@/lib/auth'

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000'

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

    // 1. Attempt to authenticate against live Express Backend
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
        // Fast timeout so if backend isn't running it falls through quickly
        signal: AbortSignal.timeout(3000),
      })

      if (backendRes.ok) {
        const result = await backendRes.json()
        if (result.success && result.data) {
          await createSession({
            userId: String(result.data.user.id),
            email: result.data.user.email,
            name: result.data.user.name,
            role: result.data.user.role,
            backendToken: result.data.token,
          })

          return NextResponse.json({
            success: true,
            redirect: '/admin/dashboard',
            source: 'backend',
          })
        }
      } else if (backendRes.status === 401 || backendRes.status === 403) {
        // Explicit rejection from backend database user
        const errJson = await backendRes.json().catch(() => ({}))
        // If not matching demo credentials below, we will return this error
      }
    } catch (backendErr) {
      // Backend offline or connection refused - proceed to demo fallback
      console.log('Backend authentication unreachable, checking demo credentials...')
    }

    // 2. Fallback Demo Administrative Accounts (for offline/demo mode)
    const validUsers: Record<string, { name: string; role: string; password: string }> = {
      'admin@smartattend.edu': {
        name: 'System Administrator',
        role: 'SUPER_ADMIN',
        password: 'admin123',
      },
      'admin@smartattend.edu.in': {
        name: 'Anita Kulkarni',
        role: 'SUPER_ADMIN',
        password: 'admin123',
      },
      'admin': {
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        password: 'admin123',
      },
    }

    const userMatch = validUsers[normalizedEmail]

    if (!userMatch || userMatch.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    // Create demo session cookie
    await createSession({
      userId: `demo_${Date.now()}`,
      email: normalizedEmail,
      name: userMatch.name,
      role: userMatch.role,
      backendToken: undefined,
    })

    return NextResponse.json({
      success: true,
      redirect: '/admin/dashboard',
      source: 'demo_fallback',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
