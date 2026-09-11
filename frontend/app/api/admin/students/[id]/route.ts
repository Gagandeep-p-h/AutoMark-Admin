import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    const params = await Promise.resolve(context.params);
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/students/${params.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update student' },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    const params = await Promise.resolve(context.params);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/students/${params.id}`, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete student' },
      { status: 502 }
    );
  }
}
