import { getSession } from '@/lib/auth';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const url = new URL(req.url);

    const headers: Record<string, string> = {};

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/students/export${url.search}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return new Response(errorText, { status: backendRes.status });
    }

    const buffer = await backendRes.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': backendRes.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': backendRes.headers.get('Content-Disposition') || 'attachment; filename="students_export"',
      },
    });
  } catch (error) {
    return new Response('Failed to export students', { status: 502 });
  }
}
