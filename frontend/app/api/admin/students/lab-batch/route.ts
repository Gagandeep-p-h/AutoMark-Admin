import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';

export async function PATCH(req: Request) {
  return handleForward(req, 'PATCH');
}

export async function POST(req: Request) {
  return handleForward(req, 'POST');
}

async function handleForward(req: Request, method: string) {
  try {
    const session = await getSession();
    const url = new URL(req.url);
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (session?.backendToken) {
      headers['Authorization'] = `Bearer ${session.backendToken}`;
    }

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/students/lab-batch${url.search}`, {
      method,
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to communicate with lab batch assignment service' },
      { status: 502 }
    );
  }
}
