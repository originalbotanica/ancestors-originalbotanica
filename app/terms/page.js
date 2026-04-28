import Link from 'next/link';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
      title: 'Terms of Service — Ancestors · Original Botanica',
};

export default function TermsPage() {
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
                    <h2>Terms of Service</h2>
              <p className="legal-updated">Last updated: April 28, 2026</p>

          <p>
                      Welcome to Ancestors, a virtual altar service offered by Original Botanica
                (together, "we," "us," or "our"). By creating an account or lighting a candle on
                      this site, you agree to these terms.
          </p>

          <h3>The Service</h3>
              <p>
                      Ancestors lets you create and tend a perpetual virtual memorial candle in honor of
                someone who has passed. Candles are hosted at ancestors.originalbotanica.com and
                visible to anyone you share the link with.
                    </p>

          <h3>Subscriptions and Billing</h3>
              <p>
                                Access to the service requires a paid subscription. We offer two plans: Memorial
                Candle (one candle for one loved one) and Family Altar (up to seven loved ones on
                one altar). Subscriptions renew automatically at the end of each billing period —
                monthly or annually, whichever you choose.
                    </p>
              <p>
                                You can cancel anytime from your account. Your candle will remain lit through the
                end of the period you have already paid for. Payment is processed securely by
                Stripe. We do not store your credit card number.
                    </p>

          <h3>Refunds</h3>
              <p>
                                Monthly subscriptions are non-refundable. If you subscribed annually and wish to
                cancel, contact us at{' '}
                <a href="mailto:info@originalbotanica.com">info@originalbotanica.com</a> within
                30 days of your last charge and we will refund the unused portion of the year on a
                pro-rated basis.
                    </p>

          <h3>Your Content</h3>
              <p>
                                You may upload photos and write dedications for your loved ones. You retain
                ownership of everything you upload. By doing so, you grant us a non-exclusive,
                                royalty-free license to store and display your content as part of the service.
                                Please only upload content you have the right to share. Do not upload anything
                that is harmful, unlawful, or that belongs to someone else.
                    </p>

          <h3>Cancellation and Termination</h3>
              <p>
                                You may cancel your subscription at any time through your account's billing portal.
                                We reserve the right to suspend or terminate accounts that misuse the service or
                violate these terms.
                    </p>

          <h3>Limitation of Liability</h3>
              <p>
                                The service is provided as-is. We make reasonable efforts to keep it running
                reliably, but we cannot guarantee uninterrupted access. To the fullest extent
                permitted by law, Original Botanica shall not be liable for any indirect or
                consequential damages arising from your use of the service.
                    </p>

          <h3>Changes to These Terms</h3>
              <p>
                                We may update these terms from time to time. If we make material changes, we will
                notify you by email. Continued use of the service after changes take effect
                constitutes your acceptance of the updated terms.
                    </p>

          <h3>Governing Law</h3>
              <p>
                                These terms are governed by the laws of the State of New York, without regard to
                its conflict of law provisions.
                    </p>

          <h3>Contact</h3>
              <p>
                                Questions? Email us at{' '}
                <a href="mailto:info@originalbotanica.com">info@originalbotanica.com</a>.
                    </p>
                    </div>
                    </main>

      <SiteFooter />
                    </>
      );
}
