'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/auth-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ready, setReady] = useState(false);

  // Supabase's reset email may land the user here in any of three ways:
  //   1. Modern PKCE flow with ?code=... \u2192 we exchange the code for a session
  //   2. Through /auth/callback which already exchanged the code \u2192 session cookie present
  //   3. Legacy hash-based flow with #access_token=... \u2192 browser client auto-handles it
  // We only render the form once a real session is in hand. Without one,
  // updateUser({ password }) would fail with "Auth session missing".
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (!cancelled) setReady(true);
      }
    });

    // Path 1: ?code=... is in the URL \u2192 exchange it
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.session) {
          setErrorMsg(
            'This reset link has expired or already been used. Please request a new one from the Forgot password page.'
          );
        } else {
          setReady(true);
          // Strip the code from the URL so refreshing the page doesn't re-exchange.
          window.history.replaceState({}, '', '/account/reset-password');
        }
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    }

    // Paths 2 & 3: just check if we already have a session
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setReady(true);
      } else {
        // Give onAuthStateChange a moment to fire (hash-based recovery flow),
        // then tell the user the link is bad if still no session.
        setTimeout(() => {
          if (!cancelled) {
            supabase.auth.getSession().then(({ data: d }) => {
              if (!cancelled && !d.session) {
                setErrorMsg(
                  'This reset link has expired or already been used. Please request a new one from the Forgot password page.'
                );
              }
            });
          }
        }, 1500);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message || 'Could not update password. Please try again.');
      setSubmitting(false);
      return;
    }

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
          <h2>Set a new password</h2>
          <p className="wizard-sub">Choose a password you&rsquo;ll remember.</p>

          {!ready ? (
            <p className="wizard-note">Verifying your reset link&hellip;</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />

              <label htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {errorMsg && <p className="wizard-error">{errorMsg}</p>}

              <div className="wizard-nav">
                <span />
                <button type="submit" className="btn-cta" disabled={submitting}>
                  {submitting ? 'Saving\u2026' : 'Save new password'}
                </button>
              </div>
            </form>
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
