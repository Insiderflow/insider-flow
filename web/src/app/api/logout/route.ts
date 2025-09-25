import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set('if_user', '', { path: '/', maxAge: 0 });
  return res;
}


