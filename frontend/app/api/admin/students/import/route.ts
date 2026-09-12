import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5001';

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || !session.backendToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const formData = await req.formData();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.backendToken}`,
      'Accept': 'application/json',
    };

    const backendRes = await fetch(`${BACKEND_INTERNAL_URL}/api/admin/students/import${url.search}`, {
      method: 'POST',
      headers,
      body: formData,
      // 30 second timeout for parsing larger files
      signal: AbortSignal.timeout(30000),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Frontend student import proxy error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to process student import' },
      { status: 502 }
    );
  }
}
