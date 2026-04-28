import Link from 'next/link';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
    title: 'Privacy Policy — Ancestors · Original Botanica',
};

export default function PrivacyPage() {
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

      <main className="legal-main">
              <div className="legal-content">
                <h2>Privacy Policy</h2>
            <p className="legal-updated">Last updated: April 28, 2026</p>

          <p>
                  This policy explains what information we collect when you use Ancestors, how we
              use it, and how we protect it. We take your privacy seriously and will never sell
              your information to anyone.
                </p>

          <h3>What We Collect</h3>
            <p>When you create an account and light a candle, we collect:</p>
            <ul>
                            <li>Your name and email address</li>
              <li>
                              Information about your loved one — name, dates, a dedication, and a photo —
                that you choose to provide
                  </li>
              <li>
                                Payment information — this is handled entirely by Stripe. We never see or store
                your card number
                  </li>
              <li>Basic usage data, such as which pages you visit and when you log in</li>
                  </ul>

          <h3>How We Use It</h3>
            <p>We use your information to:</p>
            <ul>
                              <li>Provide and maintain your subscription and memorial candle</li>
              <li>Send you receipts, billing notifications, and service updates</li>
              <li>Respond to questions or support requests</li>
                  </ul>
            <p>We do not sell your information, and we do not use it for advertising.</p>

          <h3>Third-Party Services</h3>
            <p>
                              We rely on a small number of trusted services to run Ancestors. Each handles your
              data according to its own privacy policy:
              </p>
            <ul>
                            <li>
                              <strong>Stripe</strong> — payment processing.{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                                stripe.com/privacy
                </a>
                </li>
              <li>
                              <strong>Supabase</strong> — database and file storage, hosted in the United
                States
                  </li>
                  </ul>

          <h3>Your Rights</h3>
            <p>
                              You can update your account information at any time from your account page. To
              request that we delete your account and all associated data, email us at{' '}
              <a href="mailto:jason@originalbotanica.com">jason@originalbotanica.com</a>. We
              will process deletion requests within 30 days.
                </p>

          <h3>Cookies</h3>
            <p>
                            We use session cookies to keep you signed in while you use the site. We do not
                            use tracking cookies or advertising cookies of any kind.
                </p>

          <h3>Data Retention</h3>
            <p>
                            We retain your account and memorial data for as long as your subscription is
              active. If you cancel, your data is retained for 90 days before being permanently
              deleted, in case you wish to reactivate.
                </p>

          <h3>Changes to This Policy</h3>
            <p>
                            We may update this policy from time to time. If we make material changes, we will
              notify you by email. The date at the top of this page reflects when the policy was
              last revised.
                </p>

          <h3>Contact</h3>
            <p>
                            Questions about your privacy? Email us at{' '}
              <a href="mailto:jason@originalbotanica.com">jason@originalbotanica.com</a>.
                </p>
                </div>
                </main>

      <SiteFooter />
                </>
    );
}
