import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';

/**
 * POST /api/admin/timetable/grid
 * Proxies to backend POST /api/admin/timetable/grid — bulk save timetable slots
 */
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

    const backendRes = await fetch(`${BACKEND}/api/admin/timetable/grid`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
