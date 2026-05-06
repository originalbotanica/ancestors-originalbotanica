'use client';
import { useState } from 'react';

export default function ShareModal({ url, name, onClose }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl  = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`A candle is lit for ${name} on the Original Botanica Ancestor Altar.`);

  const platforms = [
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2',
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: '#000000',
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(`A candle for ${name}`)}&body=${encodeURIComponent(`I lit a candle in memory of ${name} on the Original Botanica Ancestor Altar.\n\nView it here: ${url}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m2 7 10 7 10-7"/>
        </svg>
      ),
      color: '#C17D3C',
    },
    {
      id: 'sms',
      label: 'Text (SMS)',
      href: `sms:?&body=${encodeURIComponent(`A candle for ${name}: ${url}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      color: '#34C759',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      action: async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <circle cx="12" cy="12" r="4.5"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/>
        </svg>
      ),
      color: '#E1306C',
    },
  ];

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <button className="share-modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>
        <h2 className="share-modal-title">Share this candle</h2>
        <p className="share-modal-sub">In memory of {name}</p>

        <div className="share-modal-grid">
          {platforms.map(p => (
            p.action ? (
              <button
                key={p.id}
                className="share-platform-btn"
                style={{ '--platform-color': p.color }}
                onClick={p.action}
                aria-label={`Share on ${p.label}`}
              >
                <span className="share-icon" style={{ color: p.color }}>{p.icon}</span>
                <span className="share-label">{p.id === 'instagram' && copied ? 'Link copied!' : p.label}</span>
              </button>
            ) : (
              <a
                key={p.id}
                className="share-platform-btn"
                style={{ '--platform-color': p.color }}
                href={p.href}
                target={p.id === 'email' || p.id === 'sms' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                aria-label={`Share on ${p.label}`}
              >
                <span className="share-icon" style={{ color: p.color }}>{p.icon}</span>
                <span className="share-label">{p.label}</span>
              </a>
            )
          ))}
        </div>

        <div className="share-copy-row">
          <input
            className="share-copy-input"
            value={url}
            readOnly
            onClick={e => e.target.select()}
            aria-label="Candle URL"
          />
          <button
            className="share-copy-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        {copied && (
          <p className="share-instagram-hint">
            Link copied &#x2014; open Instagram and paste it into your story or post.
          </p>
        )}
      </div>
    </div>
  );
}
