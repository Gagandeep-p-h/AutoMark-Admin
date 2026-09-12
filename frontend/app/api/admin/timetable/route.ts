import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

/**
 * GET /api/admin/timetable
 * Proxies to backend GET /api/admin/timetable
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (session?.backendToken) headers['Authorization'] = `Bearer ${session.backendToken}`;

    const backendRes = await fetch(
      `${BACKEND}/api/admin/timetable${url.search}`,
      { method: 'GET', headers, signal: AbortSignal.timeout(6000) }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
