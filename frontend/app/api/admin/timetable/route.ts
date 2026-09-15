import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';

/**
 * GET /api/admin/timetable
 * Proxies to backend GET /api/admin/timetable
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
      `${BACKEND}/api/timetable${url.search}`,
      { method: 'GET', headers, signal: AbortSignal.timeout(6000) }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
