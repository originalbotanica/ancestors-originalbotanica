import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Original Botanica &nbsp;·&nbsp; The Bronx, NY &nbsp;·&nbsp; Family-owned since 1959</p>
      <div className="links">
        <a href="https://originalbotanica.com">originalbotanica.com</a> &nbsp;·&nbsp;{' '}
        <a href="https://altar.originalbotanica.com">altar.originalbotanica.com</a>
      </div>
      <div className="links legal-links">
        <Link href="/terms">Terms of Service</Link> &nbsp;·&nbsp;{' '}
        <Link href="/privacy">Privacy Policy</Link>
      </div>
    </footer>
  );
}
