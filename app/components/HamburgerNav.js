'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HamburgerNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button className="hamburger-btn" onClick={() => setOpen(true)}
        aria-label="Open navigation menu" aria-expanded={open}>
        <span /><span /><span />
      </button>
      {open && <div className="hamburger-backdrop" onClick={close} aria-hidden="true" />}
      <nav className={`hamburger-drawer${open ? ' is-open' : ''}`}
        aria-label="Site navigation" aria-hidden={!open}>
        <button className="hamburger-close" onClick={close} aria-label="Close navigation menu">
          &times;
        </button>
        <div className="hamburger-links">
          <Link href="/account" onClick={close}>My Account</Link>
          <a href="https://www.originalbotanica.com" target="_blank" rel="noopener noreferrer" onClick={close}>Buy Spiritual Products</a>
        </div>
        <div className="hamburger-footer">
          <p>Original Botanica &mdash; the Bronx, since 1959</p>
        </div>
      </nav>
    </>
  );
}
