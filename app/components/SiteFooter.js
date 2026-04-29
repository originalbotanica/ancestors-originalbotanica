import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-logo">
          <img src="/logo-original-botanica.svg" alt="Original Botanica" />
        </div>
        <p className="site-footer-brand">ANCESTOR ALTAR</p>
        <nav className="site-footer-nav">
          <Link href="/altar">THE ALTAR</Link>
          <Link href="/how-it-works">HOW IT WORKS</Link>
          <Link href="/light-a-candle">LIGHT A CANDLE</Link>
          <a href="https://www.originalbotanica.com" target="_blank" rel="noopener noreferrer">BUY SPIRITUAL PRODUCTS</a>
          <Link href="/account">MY ACCOUNT</Link>
        </nav>
        <p className="site-footer-copy">Copyright © 2026 Original Products. All Rights Reserved. originalbotanica.com</p>
      </div>
    </footer>
  );
}
