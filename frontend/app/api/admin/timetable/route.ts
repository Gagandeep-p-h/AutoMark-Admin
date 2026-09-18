import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * GET /api/admin/timetable
 * Proxies to backend GET /api/admin/timetable
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);
    const backendUrl = getBackendUrl();

    const token = await getBackendToken(session);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const backendRes = await fetch(
      `${backendUrl}/api/admin/timetable${url.search}`,
      { method: 'GET', headers, signal: AbortSignal.timeout(15000) }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
