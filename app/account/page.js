import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/auth-server';
import AccountDashboard from './AccountDashboard';
import SiteFooter from '../components/SiteFooter';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'My Account \u2014 Ancestors \u00b7 Original Botanica',
};

export default async function AccountPage() {
    const supabase = await createSupabaseServerClient();
    const {
          data: { user },
    } = await supabase.auth.getUser();

  if (!user) redirect('/account/login');

  // /account shows only the candles the signed-in user actually owns. Note:
  // the SELECT RLS policy is more permissive than UPDATE \u2014 public-read of active
  // memorials lets the altar page work for everyone \u2014 so we have to filter
  // explicitly by owner_id here, otherwise the dashboard would show seed
  // candles and other customers' active memorials that the user can't edit.
  const { data: memorials, error } = await supabase
      .from('memorials')
      .select('hash, name, birth_date, death_date, dedication, photo_url, status, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });

  if (error) {
        console.error('Account page memorials fetch error:', error);
  }

  // Fetch the user's active subscription so we can display plan info in the
  // billing section. Exclude canceled subscriptions \u2014 if one exists we show
  // nothing rather than stale plan data.
  const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, billing_interval, status, current_period_end, cancel_at_period_end, paused')
      .eq('user_id', user.id)
      .neq('status', 'canceled')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  const fullName = user.user_metadata?.full_name || null;
    const firstName = fullName ? fullName.split(' ')[0] : null;

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

      <main className="account-main">
            <div className="account-header">
              <h2>{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</h2>
          <p className="wizard-sub">Signed in as {user.email}</p>
  </div>

        <AccountDashboard memorials={memorials || []} ownerId={user.id} subscription={subscription || null} />

        <form action="/api/auth/logout" method="POST" className="account-signout">
            <button type="submit" className="btn-secondary">
              Sign out
  </button>
  </form>
  </main>

      <SiteFooter />
  </>
  );
}
