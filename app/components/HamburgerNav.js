'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HamburgerNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Hamburger trigger */}
      <button
        className="hamburger-btn"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="hamburger-backdrop"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={`hamburger-drawer${open ? ' is-open' : ''}`}
        aria-label="Site navigation"
        aria-hidden={!open}
      >
        <button
          className="hamburger-close"
          onClick={close}
          aria-label="Close navigation menu"
        >
          &times;
        </button>

        <div className="hamburger-links">
          <Link href="/altar" onClick={close}>The Altar</Link>
          <Link href="/how-it-works" onClick={close}>How It Works</Link>
          <Link href="/light-a-candle" onClick={close} className="hamburger-cta">
            Light a Candle
          </Link>
          <a
            href="https://www.originalbotanica.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            Buy Spiritual Products
          </a>
          <Link href="/account" onClick={close}>My Account</Link>
        </div>

        <div className="hamburger-footer">
          <p>Original Botanica &mdash; the Bronx, since 1959</p>
        </div>
      </nav>
    </>
  );
}
