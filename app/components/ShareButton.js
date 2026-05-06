'use client';
import { useState } from 'react';
import ShareModal from './ShareModal';

export default function ShareButton({ name }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn-share"
        onClick={() => setOpen(true)}
      >
        Share this candle
      </button>
      {open && (
        <ShareModal
          url={typeof window !== 'undefined' ? window.location.href : ''}
          name={name}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
