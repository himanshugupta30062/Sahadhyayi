import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    (await req.json()).access_token;
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { user },
    error,
  } = await supa.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  res.cookies.set('sessionId', user.id, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 86400,
  });
  return res;
}
