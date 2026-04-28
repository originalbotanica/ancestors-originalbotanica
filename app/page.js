import Link from 'next/link';
import SiteFooter from './components/SiteFooter';
import { supabasePublic } from '@/lib/supabase';

export const metadata = {
      title: 'Ancestor Altar — Original Botanica',
      description:
              'A perpetual virtual altar to honor a loved one who has passed. Keep their flame burning always.',
};

export const revalidate = 60;

function yearFrom(dateStr) {
      if (!dateStr) return null;
      return new Date(dateStr).getUTCFullYear();
}

function formatDates(birth, death) {
      const b = yearFrom(birth);
      const d = yearFrom(death);
      if (b && d) return `${b} — ${d}`;
      if (d) return `Passed ${d}`;
      if (b) return `Born ${b}`;
      return '';
}

export default async function Home() {
      const { data: previews } = await supabasePublic
        .from('memorials')
        .select('hash, name, birth_date, death_date, photo_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

  return (
          <>
            <header className="site-header lp-header">
              <Link href="/" className="brand-logo-link" aria-label="Home">
                <div className="brand-logo">
                  <img src="/logo-original-botanica.svg" alt="Original Botanica" />
                  <div className="tag">Ancestor Altar</div>
      </div>
      </Link>
            <nav className="lp-nav">
                <Link href="/altar">Visit the Altar</Link>
              <Link href="/light-a-candle" className="btn-cta lp-nav-cta">
                  Light a Candle
      </Link>
      </nav>
      </header>

      <main>
              <section className="lp-hero">
                <div className="lp-hero-candle">
                  <img src="/white-candle.png" alt="A prayer candle" />
      </div>
              <div className="lp-hero-copy">
                  <div className="eyebrow">Original Botanica · The Bronx · Since 1959</div>
                <h1>
                    A flame that never goes out
                  <br />
                    for those we never forget.
      </h1>
                <p className="lede">
                    Ancestors is a perpetual virtual altar where you can light a candle and keep
                  a memorial burning for someone you love — tended by the family behind
                  Original Botanica, the Bronx&rsquo;s most trusted spiritual home for over 65
                  years.
                      </p>
                <div className="lp-hero-ctas">
                                    <Link href="/light-a-candle" className="btn-cta">
                                      Light a Candle
                      </Link>
                  <a href="#how-it-works" className="btn-ghost">
                                      See how it works ↓
                      </a>
                      </div>
                      </div>
                      </section>

        <section className="lp-section lp-how" id="how-it-works">
                                <div className="lp-inner">
                                  <h2 className="lp-section-title">How it works</h2>
                <div className="lp-steps">
                                    <div className="lp-step">
                                      <div className="lp-step-num">1</div>
                    <h3>Create your altar</h3>
                    <p>
                                        Choose a plan, then add your loved one&rsquo;s name, dates, a photo, and
                      a personal dedication.
                          </p>
                          </div>
                  <div className="lp-step-arrow" aria-hidden="true">→</div>
                  <div className="lp-step">
                                          <div className="lp-step-num">2</div>
                    <h3>Light the candle</h3>
                    <p>
                                            Your candle is placed on the ancestor altar — visible to anyone you share
                      the link with.
                          </p>
                          </div>
                  <div className="lp-step-arrow" aria-hidden="true">→</div>
                  <div className="lp-step">
                                          <div className="lp-step-num">3</div>
                    <h3>The flame burns on</h3>
                    <p>
                                            As long as your subscription is active, the candle stays lit — day and
                      night, without interruption.
                          </p>
                          </div>
                          </div>
                          </div>
                          </section>

    {previews && previews.length > 0 && (
                  <section className="lp-section lp-preview">
                    <div className="lp-inner">
                      <h2 className="lp-section-title">The altar is always burning</h2>
                   <p className="lp-section-sub">
                        Every candle here was lit by someone who wanted their loved one remembered.
                        Each one stays lit for as long as it is tended.
        </p>
                   <div className="lp-preview-grid">
    {previews.map((m) => (
                          <Link key={m.hash} href={`/candle/${m.hash}`} className="lp-preview-tile">
                        <div className="lp-preview-candle-wrap">
{m.photo_url && (
                            <div className="lp-preview-photo">
                              <img src={m.photo_url} alt={m.name} />
    </div>
                      )}
                      <img className="lp-preview-candle" src="/white-candle.png" alt="" />
                          </div>
                    <div className="lp-preview-name">{m.name}</div>
{formatDates(m.birth_date, m.death_date) && (
                          <div className="lp-preview-dates">
{formatDates(m.birth_date, m.death_date)}
</div>
                    )}
</Link>
                ))}
                    </div>
              <div className="lp-preview-link">
                                    <Link href="/altar">Visit the altar →</Link>
                    </div>
                    </div>
                    </section>
        )}

        <section className="lp-section lp-plans" id="plans">
                      <div className="lp-inner">
                        <h2 className="lp-section-title">Choose your plan</h2>
            <p className="lp-section-sub">
                          Cancel anytime. Your candle stays lit through the end of your billing period.
            </p>
            <div className="lp-plan-cards">
                          <div className="lp-plan-card">
                            <div className="lp-plan-name">Memorial Candle</div>
                <div className="lp-plan-desc">One candle for one loved one.</div>
                <div className="lp-plan-price">
                              <span className="lp-price-amount">$9.95</span>
                  <span className="lp-price-period">/month</span>
            </div>
                <div className="lp-plan-annual">or $89.95/year &mdash; save 25%</div>
                <ul className="lp-plan-features">
                              <li>One memorial candle</li>
                  <li>Photo, name, dates &amp; dedication</li>
                  <li>Permanent altar placement</li>
                  <li>Shareable candle link</li>
                  <li>Cancel anytime</li>
            </ul>
                <Link href="/light-a-candle" className="btn-cta">
                              Light a Candle
            </Link>
            </div>
              <div className="lp-plan-card lp-plan-card--featured">
                            <div className="lp-plan-badge">Most popular</div>
                <div className="lp-plan-name">Family Altar</div>
                <div className="lp-plan-desc">Honor up to seven loved ones together.</div>
                <div className="lp-plan-price">
                              <span className="lp-price-amount">$19.95</span>
                  <span className="lp-price-period">/month</span>
            </div>
                <div className="lp-plan-annual">or $189.95/year &mdash; save 21%</div>
                <ul className="lp-plan-features">
                              <li>Up to seven memorial candles</li>
                  <li>Photo, name, dates &amp; dedication</li>
                  <li>Permanent altar placement</li>
                  <li>Shareable link for each candle</li>
                  <li>Cancel anytime</li>
            </ul>
                <Link href="/light-a-candle" className="btn-cta">
                              Create Your Altar
            </Link>
            </div>
            </div>
            </div>
            </section>

        <section className="lp-section lp-story">
                      <div className="lp-inner lp-story-inner">
                        <div className="lp-story-logo">
                          <img src="/logo-original-botanica.svg" alt="Original Botanica" />
            </div>
            <div className="lp-story-copy">
                          <h2>Rooted in the Bronx since 1959</h2>
              <p>
                            Original Botanica has been a place of spiritual refuge in the Bronx for over
                65 years. We&rsquo;ve carried candles, herbs, sacred tools, and the wisdom to
                use them — serving our community through every kind of joy and grief. Ancestors
                was built from that same calling: to help people honor those they&rsquo;ve
                lost, in a way that is permanent, beautiful, and true.
                    </p>
              <a
                href="https://originalbotanica.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                                    Visit Original Botanica →
                    </a>
                    </div>
                    </div>
                    </section>

        <section className="lp-section lp-faq" id="faq">
                              <div className="lp-inner">
                                <h2 className="lp-section-title">Questions</h2>
            <div className="lp-faq-list">
                                  <div className="lp-faq-item">
                                    <h3>What exactly is a virtual altar?</h3>
                <p>
                                      A virtual altar is a living memorial — a candle that burns continuously
                  online, accompanied by a photo, name, and dedication for someone who has
                  passed. It&rsquo;s a place you can return to, share with family, and know
                  is always lit.
                      </p>
                      </div>
              <div className="lp-faq-item">
                                      <h3>Is this connected to a particular religion or tradition?</h3>
                <p>
                                        No. Ancestors welcomes anyone honoring a loved one who has passed,
                                        regardless of faith or background. The altar draws from the traditions of
                  Original Botanica — Santería, Hoodoo, Spiritism, folk Catholicism — but
                  the practice of remembering the dead is universal.
                      </p>
                      </div>
              <div className="lp-faq-item">
                                      <h3>Who can see the altar?</h3>
                <p>
                                        The ancestor altar is public — anyone can visit and witness the candles
                  burning. Each candle also has its own shareable link you can send directly
                  to family and friends.
                      </p>
                      </div>
              <div className="lp-faq-item">
                                      <h3>What happens if I cancel?</h3>
                <p>
                                        You can cancel anytime from your account. Your candle will remain lit
                  through the end of the period you&rsquo;ve already paid for. After that, it
                  will be removed from the altar.
                      </p>
                      </div>
              <div className="lp-faq-item">
                                      <h3>Can I honor more than one person?</h3>
                <p>
                                        Yes — the Family Altar plan lets you light up to seven candles under one
                  subscription, so your whole family can rest together on the altar.
                      </p>
                      </div>
                      </div>
                      </div>
                      </section>

        <section className="lp-closing">
                                <div className="lp-inner lp-closing-inner">
                                  <div className="lp-closing-candle">
                                    <img src="/white-candle.png" alt="A prayer candle" />
                      </div>
            <h2>Keep their flame burning.</h2>
            <p>Light a candle today. It takes less than five minutes to set up.</p>
            <Link href="/light-a-candle" className="btn-cta">
                                    Light a Candle
                      </Link>
                      </div>
                      </section>
                      </main>

      <SiteFooter />
                      </>
  );
}
