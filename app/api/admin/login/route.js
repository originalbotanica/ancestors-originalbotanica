import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_auth', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
