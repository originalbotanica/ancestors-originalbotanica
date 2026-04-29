import { notFound } from 'next/navigation';
import CeremonyClient from './CeremonyClient';

export const revalidate = 0; // always fresh

async function getMemorial(hash) {
  const { supabaseAdmin } = await import('@/lib/supabase');
  const { data } = await supabaseAdmin
    .from('memorials')
    .select('hash, name, status')
    .eq('hash', hash)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { hash } = await params;
  const memorial = await getMemorial(hash);
  if (!memorial) return { title: 'Candle lit · Ancestors' };
  return {
    title: `A candle has been lit for ${memorial.name} — Ancestors`,
    description: `${memorial.name} now has a perpetual candle on the Original Botanica ancestor altar.`,
  };
}

export default async function CandleLitSuccess({ params }) {
  const { hash } = await params;
  const memorial = await getMemorial(hash);
  if (!memorial) notFound();
  return <CeremonyClient memorial={memorial} />;
}
