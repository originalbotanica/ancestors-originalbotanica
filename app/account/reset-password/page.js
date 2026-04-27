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

  // Supabase's reset email lands the user here with a recovery token in the URL hash.
  // The browser client picks it up automatically and emits PASSWORD_RECOVERY.
  // We wait for that (or for an existing session) before letting them set a new password.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
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
            <p className="wizard-note">Verifying your reset link…</p>
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
                  {submitting ? 'Saving…' : 'Save new password'}
                </button>
              </div>
            </form>
          )}
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
