import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, success: true, isLive: true });
    }

    return NextResponse.json(
      { status: 'DEGRADED', isLive: false, message: 'Backend unhealthy' },
      { status: res.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'OFFLINE', isLive: false, message: error.message || 'Backend unreachable' },
      { status: 503 }
    );
  }
}
