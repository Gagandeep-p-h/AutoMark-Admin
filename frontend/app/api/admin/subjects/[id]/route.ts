import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

/** PUT /api/admin/subjects/[id] — update subject */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const body = await req.json();
    const token = await getBackendToken(session);
    const backendUrl = getBackendUrl();

    const backendRes = await fetch(`${backendUrl}/api/subjects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}

/** DELETE /api/admin/subjects/[id] — delete subject */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const token = await getBackendToken(session);
    const backendUrl = getBackendUrl();

    const backendRes = await fetch(`${backendUrl}/api/subjects/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Backend request failed' }, { status: 502 });
  }
}
