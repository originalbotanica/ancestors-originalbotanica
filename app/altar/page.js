import Link from 'next/link';
import { supabasePublic } from '@/lib/supabase';

export const metadata = {
  title: 'The Altar — Ancestors · Original Botanica',
  description: 'Memorial candles burning on our altar in honor of those who came before us.',
};

// Re-fetch from the DB at most every 60 seconds (ISR — Incremental Static Regeneration)
export const revalidate = 60;

function yearFrom(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).getUTCFullYear();
}

function formatDates(birth, death) {
  const b = yearFrom(birth);
  const d = yearFrom(death);
  if (b && d) return `${b} — ${d}`;
  if (b) return `Born ${b}`;
  if (d) return `Passed ${d}`;
  return '';
}

export default async function AltarPage() {
  const { data: memorials, error } = await supabasePublic
    .from('memorials')
    .select('hash, name, birth_date, death_date, photo_url')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

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

      <main className="altar-section">
        <div className="altar-header">
          <div className="eyebrow">The Altar</div>
          <h1>Those We Remember</h1>
          <p className="altar-lede">
            Every candle here was lit by someone who wanted their loved one to be
            remembered.
            <br />
            Each one stays lit for as long as it is tended.
          </p>
        </div>

        {error ? (
          <p className="altar-empty">
            We could not load the altar right now. Please try again in a moment.
          </p>
        ) : !memorials || memorials.length === 0 ? (
          <p className="altar-empty">
            The altar is waiting for its first flame. If you would like to be the one
            to light it, we would be honored to hold them with you.
          </p>
        ) : (
          <div className="altar-grid">
            {memorials.map((m) => (
              <Link key={m.hash} href={`/candle/${m.hash}`} className="altar-tile">
                <div className="altar-candle-wrap">
                  {m.photo_url && (
                    <div className="altar-photo">
                      <img src={m.photo_url} alt={m.name} />
                    </div>
                  )}
                  <img className="altar-candle" src="/white-candle.png" alt="" />
                </div>
                <div className="altar-name">{m.name}</div>
                <div className="altar-dates">{formatDates(m.birth_date, m.death_date)}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="cta-row">
          <Link href="/light-a-candle" className="btn-cta">Light a Candle for Someone You Love</Link>
        </div>
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
