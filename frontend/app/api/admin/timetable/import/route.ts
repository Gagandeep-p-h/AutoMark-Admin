import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

/**
 * POST /api/admin/timetable/import
 * Forwards multipart/form-data file upload to backend for timetable parsing.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);
    const formData = await req.formData();
    const backendUrl = getBackendUrl();

    const token = await getBackendToken(session);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    // Do NOT set Content-Type — browser/fetch sets correct multipart boundary automatically

    const backendRes = await fetch(
      `${backendUrl}/api/admin/timetable/import${url.search}`,
      {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(30000),
      }
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Import request failed' }, { status: 502 });
  }
}
