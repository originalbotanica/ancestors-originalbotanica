import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase';
import SiteFooter from '../../components/SiteFooter';

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

async function getMemorial(hash) {
  const { data } = await supabasePublic
    .from('memorials')
    .select('*')
    .eq('hash', hash)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { hash } = await params;
  const memorial = await getMemorial(hash);

  if (!memorial) {
    return { title: 'Memorial — Ancestors · Original Botanica' };
  }

  return {
    title: `In memory of ${memorial.name} — Ancestors · Original Botanica`,
    description:
      memorial.dedication?.slice(0, 200) ||
      `A perpetual candle burning in memory of ${memorial.name}.`,
  };
}

export default async function CandlePage({ params }) {
  const { hash } = await params;
  const memorial = await getMemorial(hash);

  if (!memorial) {
    notFound();
  }

  const dates = formatDates(memorial.birth_date, memorial.death_date);
  const initial = memorial.name.charAt(0).toUpperCase();

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

      <main className="memorial-page">
                {!memorial.photo_url && (
          <div className="memorial-photo-circle" aria-hidden="true">{initial}</div>
        )}

        <div className="memorial-page-flame">
          <div className="candle-wrapper is-lit">
            <div className="flame-overlay">
              <div className="flame-halo"></div>
              <div className="flame-outer"></div>
              <div className="flame-mid"></div>
              <div className="flame-inner"></div>
              <div className="flame-tip"></div>
              <div className="flame-blue"></div>
              <div className="flame-light-cast"></div>
            </div>
            {memorial.photo_url && (
              <img className="candle-photo-overlay" src={memorial.photo_url} alt={memorial.name} />
            )}
            <img src="/white-candle.png" alt="A candle burning in memorial" />
          </div>
        </div>

        <h1 className="memorial-page-name">{memorial.name}</h1>
        {dates && <div className="memorial-page-dates">{dates}</div>}

        <div className="memorial-divider" aria-hidden="true"></div>

        {memorial.dedication && (
          <p className="memorial-dedication">&ldquo;{memorial.dedication}&rdquo;</p>
        )}

        <div className="memorial-actions">
          <Link href="/altar" className="btn-secondary">Back to the Altar</Link>
        </div>
      </main>

            <SiteFooter />
    </>
  );
}
