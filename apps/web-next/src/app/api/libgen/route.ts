import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
  const upstream = await fetch(url, { cache: 'no-store' });
  const html = await upstream.text();
  return NextResponse.json({ success: true, books: [] });
}
