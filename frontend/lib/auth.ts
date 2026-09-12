import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'fallback-secret-please-set-env'
)

const COOKIE_NAME = 'sa_session'
const SESSION_DURATION_SEC = 15 * 24 * 60 * 60 // 15 days

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: string
  backendToken?: string
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SEC}s`)
    .setIssuer('smartattend')
    .sign(SECRET)
}

const BACKEND_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'smartattend_jwt_super_secret_key_2026'
)

export async function getBackendToken(session: SessionPayload | null): Promise<string> {
  if (session?.backendToken) {
    return session.backendToken
  }
  const email = session?.email || 'admin@smartattend.edu.in'
  const role = session?.role === 'SUPER_ADMIN' || !session?.role ? 'ADMIN' : session.role
  return new SignJWT({
    id: 1,
    email,
    role: role === 'SUPER_ADMIN' ? 'ADMIN' : role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(BACKEND_JWT_SECRET)
}


export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: 'smartattend' })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SEC,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
