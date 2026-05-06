'use client';
import { useState } from 'react';

export default function ShareButton({ name }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `In memory of ${name}`,
          text: `A candle is burning in memory of ${name} on the Ancestor Altar.`,
          url,
        });
        return;
      } catch {
        // User dismissed — fall through to clipboard copy
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silently fail
    }
  }

  return (
    <button
      type="button"
      className="btn-share"
      onClick={handleShare}
      aria-label="Share this candle"
    >
      {copied ? (
        <>✓ Copied to clipboard</>
      ) : (
        <>Share this candle</>
      )}
    </button>
  );
}
