import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const sid = req.cookies.get('sessionId')?.value;
  if (!sid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ id: sid });
}
