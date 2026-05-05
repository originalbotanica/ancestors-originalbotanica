'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/auth-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Supabase emits a PKCE-coded link. We bounce it through /auth/callback,
    // which exchanges the code for a session cookie and then forwards the user
    // to /account/reset-password where they can set a new password.
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
      }
    );

    if (error) {
      setErrorMsg(error.message || 'Could not send the reset email. Please try again.');
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
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
          {sent ? (
            <>
              <h2>Check your email</h2>
              <p className="wizard-sub">
                We sent a reset link to <strong>{email}</strong>. It should arrive in a minute or two.
              </p>
              <div className="wizard-nav">
                <span />
                <Link href="/account/login" className="btn-cta">
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>Forgot your password?</h2>
              <p className="wizard-sub">
                Enter the email tied to your account and we&rsquo;ll send you a link to set a new one.
              </p>

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

                {errorMsg && <p className="wizard-error">{errorMsg}</p>}

                <div className="wizard-nav">
                  <Link href="/account/login" className="btn-secondary">
                    Back
                  </Link>
                  <button type="submit" className="btn-cta" disabled={submitting}>
                    {submitting ? 'Sending\u2026' : 'Send reset link'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <p>Original Botanica &nbsp;&middot;&nbsp; The Bronx, NY &nbsp;&middot;&nbsp; Family-owned since 1959</p>
        <div className="links">
          <a href="https://originalbotanica.com">originalbotanica.com</a> &nbsp;&middot;&nbsp;{' '}
          <a href="https://altar.originalbotanica.com">altar.originalbotanica.com</a>
        </div>
      </footer>
    </>
  );
}
