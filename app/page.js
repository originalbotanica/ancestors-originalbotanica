'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(
          data.alreadySubscribed
            ? "You're already on the list. We'll be in touch."
            : "Thank you. We'll let you know when the altar is lit."
        );
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="brand-logo">
          <img src="/logo-original-botanica.svg" alt="Original Botanica" />
          <div className="tag">Ancestor Altar</div>
        </div>
      </header>

      <main className="site-main">
        <div className="candle-wrap">
          <img src="/white-candle.png" alt="Plain white 7-day prayer candle" />
        </div>

        <div className="copy">
          <div className="eyebrow">Coming soon</div>
          <h1>
            A flame that never goes out
            <br />
            for those we never forget.
          </h1>
          <p className="lede">
            A perpetual virtual altar to honor a loved one who has passed. Tended from the
            Bronx, by the family who has kept Original Botanica&rsquo;s doors open since
            1959.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <p className="form-lede">Be the first to know when we light the altar.</p>
            <div className="form-row">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting' || status === 'success'}
                aria-label="Your email address"
              />
              <button
                type="submit"
                disabled={status === 'submitting' || status === 'success' || !email}
              >
                {status === 'submitting' ? 'Sending…' : 'Notify me'}
              </button>
            </div>
            <p
              className={`form-message ${
                status === 'success' ? 'success' : status === 'error' ? 'error' : ''
              }`}
            >
              {message}
            </p>
          </form>

          <p className="altar-link">
            <Link href="/altar">Visit the altar &rarr;</Link>
          </p>
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
