import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  return NextResponse.redirect(
    new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://ancestors.originalbotanica.com')
  );
}
