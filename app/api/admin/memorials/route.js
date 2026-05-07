import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('memorials')
    .select(`
      id,
      hash,
      name,
      status,
      birth_date,
      death_date,
      is_private,
      created_at,
      subscriptions (
        tier,
        billing_interval,
        status,
        current_period_end,
        cancel_at_period_end,
        paused
      )
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
