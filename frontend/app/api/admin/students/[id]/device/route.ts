import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    const params = await Promise.resolve(context.params);
    const backendUrl = getBackendUrl();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${backendUrl}/api/admin/students/${params.id}/device`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve student device details' },
      { status: 502 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    const params = await Promise.resolve(context.params);
    const backendUrl = getBackendUrl();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${backendUrl}/api/admin/students/${params.id}/device/reset`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset student device binding' },
      { status: 502 }
    );
  }
}
