'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/auth-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMsg(
        error.message?.includes('Invalid login')
          ? 'That email and password did not match. Please try again.'
          : error.message || 'Could not sign in. Please try again.'
      );
      setSubmitting(false);
      return;
    }

    // Cookies are set — push to the dashboard and refresh so server components see the new session.
    router.push('/account');
    router.refresh();
  }

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

      <main className="wizard-main">
        <div className="wizard">
          <h2>Welcome back</h2>
          <p className="wizard-sub">Sign in to tend your candle.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {errorMsg && <p className="wizard-error">{errorMsg}</p>}

            <div className="wizard-nav">
              <Link href="/account/forgot-password" className="auth-link">
                Forgot password?
              </Link>
              <button type="submit" className="btn-cta" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="auth-footer">
            New here? <Link href="/light-a-candle">Light a candle</Link> to begin.
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
