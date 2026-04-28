import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/upload-memorial-photo
// Called by the Light a Candle wizard right after memorial creation,
// before the user is authenticated. Uses supabaseAdmin (service role) to
// bypass RLS. Only accepts uploads for 'pending' memorials to limit abuse.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const hash = (formData.get('hash') || '').toString().trim();
    const file = formData.get('file');

    if (!hash || !file || typeof file === 'string') {
      return NextResponse.json({ error: 'Missing hash or file.' }, { status: 400 });
    }

    // Validate file type and size.
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Photos must be JPG, PNG, or WebP.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Photos must be under 5 MB.' }, { status: 400 });
    }

    // Verify the memorial exists and is pending (just created).
    const { data: memorial } = await supabaseAdmin
      .from('memorials')
      .select('hash, owner_id, status')
      .eq('hash', hash)
      .maybeSingle();

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found.' }, { status: 404 });
    }
    if (memorial.status !== 'pending') {
      return NextResponse.json(
        { error: 'Photo can only be set during initial setup.' },
        { status: 403 }
      );
    }

    // Upload to Supabase Storage.
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const path = `${memorial.owner_id}/${hash}.${cleanExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memorial-photos')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return NextResponse.json(
        { error: 'Could not upload photo. You can add one from your account later.' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('memorial-photos')
      .getPublicUrl(path);

    const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save the photo URL to the memorial record.
    const { error: updateError } = await supabaseAdmin
      .from('memorials')
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq('hash', hash);

    if (updateError) {
      console.error('Photo URL save error:', updateError);
      // Non-fatal â the file is in storage; user can re-link from account.
    }

    return NextResponse.json({ ok: true, photoUrl });
  } catch (err) {
    console.error('Upload memorial photo handler error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. You can add a photo from your account later.' },
      { status: 500 }
    );
  }
}
