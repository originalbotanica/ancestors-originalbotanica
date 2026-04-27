import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase';

export const revalidate = 0; // always fresh

// We query through the admin client here so we can still find the memorial
// during the brief window between Stripe Checkout completing and our webhook
// flipping the memorial from 'pending' to 'active'. The success page is only
// reached via Stripe's redirect after a real payment.
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

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-logo-link" aria-label="Home">
          <div className="brand-logo">
            <img src="/logo-original-botanica.svg" alt="Original Botanica" />
            <div className="tag">Ancestor Altar</div>
          </div>
        </Link>
      </header>

      <main className="success-main">
        <div className="success-flame">
          <img src="/white-candle.png" alt="A candle burning in memorial" />
        </div>

        <div className="eyebrow">The candle is lit</div>
        <h1>
          A candle has been placed
          <br />in honor of {memorial.name}.
        </h1>
        <p className="lede">
          Their flame is burning on our altar now, and it will keep burning as long as you wish to remember them with us.
        </p>

        <p className="success-link-lede">
          Your candle&rsquo;s permanent link — bookmark it for yourself, share it with family:
        </p>
        <div className="success-link">
          <code>https://ancestors.originalbotanica.com/candle/{memorial.hash}</code>
        </div>

        <div className="success-actions">
          <Link href={`/candle/${memorial.hash}`} className="btn-cta">Visit Their Candle</Link>
          <Link href="/altar" className="btn-secondary">See the Altar</Link>
        </div>

        <p className="wizard-note success-note">
          A welcome email is on its way to you. We will be quiet from here — the only messages you&rsquo;ll receive from us are reminders on the days you asked us to remember (their birthday, the anniversary of their passing, and Día de los Muertos).
        </p>
      </main>

      <footer className="site-footer">
        <p>Original Botanica &nbsp;·&nbsp; The Bronx, NY &nbsp;·&nbsp; Family-owned since 1959</p>
        <div className="links">
          <a href="https://originalbotanica.com">originalbotanica.com</a> &nbsp;·&nbsp;{' '}
          <a href="https://altar.originalbotanica.com">altar.originalbotanica.com</a>
        </div>
      </footer>
    </>
  );
}
