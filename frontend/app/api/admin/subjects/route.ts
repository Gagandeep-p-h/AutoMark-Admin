import { NextResponse } from 'next/server';
import { getSession, getBackendToken } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

/** GET /api/admin/subjects — list all subjects */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const token = await getBackendToken(session);
    const url = new URL(req.url);
    const backendUrl = getBackendUrl();

    const backendRes = await fetch(`${backendUrl}/api/subjects${url.search}`, {
      method: 'GET',
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

/** POST /api/admin/subjects — create subject */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const token = await getBackendToken(session);
    const backendUrl = getBackendUrl();

    const backendRes = await fetch(`${backendUrl}/api/subjects`, {
      method: 'POST',
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
