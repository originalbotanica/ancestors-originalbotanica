'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Status pill copy + class. Active is the default and shows nothing extra.
const STATUS_LABELS = {
  pending: { label: 'Activating', className: 'status-pending' },
  paused: { label: 'Paused', className: 'status-paused' },
  archived: { label: 'Archived', className: 'status-archived' },
};

export default function AccountDashboard({ memorials }) {
  if (!memorials || memorials.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="account-memorials">
      <h3 className="account-section-heading">Your altar</h3>
      <p className="account-section-sub">
        Edit a name, add or change dates, refine a dedication. Changes save right to the candle.
      </p>
      {memorials.map((m) => (
        <MemorialCard key={m.hash} memorial={m} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="account-empty">
      <h3>You haven&rsquo;t lit a candle yet.</h3>
      <p>
        When you&rsquo;re ready, light a perpetual candle in honor of someone you love.
        It will burn on our altar for as long as you keep it tended.
      </p>
      <Link href="/light-a-candle" className="btn-cta">
        Light a candle
      </Link>
    </div>
  );
}

function MemorialCard({ memorial }) {
  const router = useRouter();

  const [name, setName] = useState(memorial.name || '');
  const [birthDate, setBirthDate] = useState(memorial.birth_date || '');
  const [deathDate, setDeathDate] = useState(memorial.death_date || '');
  const [dedication, setDedication] = useState(memorial.dedication || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const status = memorial.status;
  const statusInfo = STATUS_LABELS[status];

  // Detect unsaved changes so the Save button is meaningful.
  const dirty =
    name !== (memorial.name || '') ||
    birthDate !== (memorial.birth_date || '') ||
    deathDate !== (memorial.death_date || '') ||
    dedication !== (memorial.dedication || '');

  async function handleSave(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Their name cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/memorials/${memorial.hash}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate || null,
          deathDate: deathDate || null,
          dedication: dedication.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Could not save changes. Please try again.');
        setSubmitting(false);
        return;
      }

      setSavedAt(Date.now());
      setSubmitting(false);
      // Refresh the server component so the data in props is fresh on next render.
      router.refresh();
    } catch (err) {
      setErrorMsg('Could not reach the server. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <article className={`memorial-card ${status === 'archived' ? 'is-archived' : ''}`}>
      <div className="memorial-card-head">
        <div className="memorial-card-title">
          <h4>{name || 'Unnamed'}</h4>
          {statusInfo && (
            <span className={`status-pill ${statusInfo.className}`}>{statusInfo.label}</span>
          )}
        </div>
        {status === 'active' && (
          <Link href={`/candle/${memorial.hash}`} className="memorial-card-link">
            Visit candle
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} className="memorial-card-form">
        <label htmlFor={`name-${memorial.hash}`}>Their full name</label>
        <input
          id={`name-${memorial.hash}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="memorial-card-dates">
          <div>
            <label htmlFor={`birth-${memorial.hash}`}>
              Birthday <span className="optional">(optional)</span>
            </label>
            <input
              id={`birth-${memorial.hash}`}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`death-${memorial.hash}`}>
              Date of passing <span className="optional">(optional)</span>
            </label>
            <input
              id={`death-${memorial.hash}`}
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
            />
          </div>
        </div>

        <label htmlFor={`dedication-${memorial.hash}`}>
          A dedication, prayer, or memory <span className="optional">(optional)</span>
        </label>
        <textarea
          id={`dedication-${memorial.hash}`}
          rows={4}
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          placeholder="A line they used to say, a memory, a blessing — whatever feels right."
        />

        {errorMsg && <p className="wizard-error">{errorMsg}</p>}

        <div className="memorial-card-actions">
          {savedAt && !dirty && !errorMsg && (
            <span className="memorial-card-saved">Saved</span>
          )}
          <button
            type="submit"
            className="btn-cta"
            disabled={submitting || !dirty}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </article>
  );
}
