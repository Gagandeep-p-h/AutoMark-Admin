import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

/**
 * GET  /api/admin/batches  — list batches for dept/sem/section
 * POST /api/admin/batches  — create / split section into B1, B2, B3
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);

    const token = await getBackendToken(session);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const backendRes = await fetch(
      `${BACKEND}/api/admin/batches${url.search}`,
      { method: 'GET', headers, signal: AbortSignal.timeout(5000) }
    );
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();

    const token = await getBackendToken(session);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const backendRes = await fetch(`${BACKEND}/api/admin/batches`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
