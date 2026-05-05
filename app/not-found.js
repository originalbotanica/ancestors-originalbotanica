import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found \u2014 Ancestors \u00b7 Original Botanica',
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-flame" aria-hidden="true">&#x1F56F;</div>
        <h1 className="not-found-title">This candle has gone dark.</h1>
        <p className="not-found-body">
          The page you&rsquo;re looking for doesn&rsquo;t exist &mdash; it may have been
          moved, or the link may be incorrect.
        </p>
        <div className="not-found-links">
          <Link href="/altar" className="btn btn-primary">Visit the Altar</Link>
          <Link href="/" className="btn btn-ghost">Return Home</Link>
        </div>
      </div>

      <style>{`
        .not-found-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0a07;
          padding: 2rem;
        }
        .not-found-inner {
          text-align: center;
          max-width: 480px;
        }
        .not-found-flame {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          opacity: 0.7;
        }
        .not-found-title {
          font-family: var(--font-serif, Georgia, serif);
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          color: #e8d5b0;
          margin: 0 0 1rem;
          line-height: 1.3;
        }
        .not-found-body {
          color: #a89070;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0 0 2rem;
        }
        .not-found-links {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-block;
          padding: 0.75rem 1.75rem;
          border-radius: 4px;
          font-size: 0.95rem;
          font-weight: 500;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .btn:hover { opacity: 0.85; }
        .btn-primary {
          background: #c8a96e;
          color: #1a1208;
        }
        .btn-ghost {
          border: 1px solid #4a3f30;
          color: #a89070;
        }
      `}</style>
    </main>
  );
}
