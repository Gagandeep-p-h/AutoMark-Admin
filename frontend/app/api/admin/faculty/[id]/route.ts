import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/faculty/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update faculty member' },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/faculty/${id}`, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(6000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete faculty member' },
      { status: 502 }
    );
  }
}
