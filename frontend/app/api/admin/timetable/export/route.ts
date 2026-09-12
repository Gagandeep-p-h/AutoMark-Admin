import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

/**
 * GET /api/admin/timetable/export
 * Streams the timetable as Excel (.xlsx) or PDF directly from backend.
 * The backend sets Content-Disposition so the browser will download the file.
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);

    const headers: Record<string, string> = {};
    if (session?.backendToken) headers['Authorization'] = `Bearer ${session.backendToken}`;

    const backendRes = await fetch(
      `${BACKEND}/api/admin/timetable/export${url.search}`,
      { method: 'GET', headers, signal: AbortSignal.timeout(15000) }
    );

    // Forward streaming binary response including content-type and content-disposition
    const blob = await backendRes.arrayBuffer();
    const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
    const disposition = backendRes.headers.get('content-disposition') || 'attachment';

    return new NextResponse(blob, {
      status: backendRes.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 502 });
  }
}
