import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Account — Ancestors · Original Botanica',
};

// Phase 5a: just confirm auth works. Memorial editing, photo upload, billing,
// and tier switching all land in 5b–5e.
export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/account/login');

  const fullName = user.user_metadata?.full_name || null;

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
          <h2>{fullName ? `Welcome back, ${fullName.split(' ')[0]}` : 'Welcome back'}</h2>
          <p className="wizard-sub">Signed in as {user.email}</p>

          <p className="wizard-note">
            Your dashboard is being readied — you&rsquo;ll soon be able to edit your loved one&rsquo;s
            details, upload a photo, and manage your subscription right from here.
          </p>

          <form action="/api/auth/logout" method="POST" className="wizard-nav">
            <span />
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
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
