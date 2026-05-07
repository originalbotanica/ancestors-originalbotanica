import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function isAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function PATCH(request, { params }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const allowed = ['active', 'archived', 'pending'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('memorials')
    .update({ status })
    .eq('id', id)
    .select('id, name, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
