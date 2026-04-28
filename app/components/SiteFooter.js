import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-nav">
        <Link href="/altar">The Altar</Link>
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/light-a-candle">Light a Candle</Link>
        <a href="https://www.originalbotanica.com" target="_blank" rel="noopener noreferrer">Buy Spiritual Products</a>
        <Link href="/account">My Account</Link>
      </nav>
      <p className="site-footer-copy">Copyright &copy; 2026 Original Botanica. All Rights Reserved.&nbsp; originalbotanica.com</p>
    </footer>
  );
}
