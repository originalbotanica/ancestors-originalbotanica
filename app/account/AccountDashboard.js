'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/auth-browser';

// Status pill copy + class. Active is the default and shows nothing extra.
const STATUS_LABELS = {
  pending: { label: 'Activating', className: 'status-pending' },
  paused: { label: 'Paused', className: 'status-paused' },
  archived: { label: 'Archived', className: 'status-archived' },
};

// Plan display helpers.
const PLAN_NAMES = { memorial: 'Memorial Candle', family: 'Family Altar' };
const PLAN_PRICES = {
  memorial: { monthly: '$9.95 / month', yearly: '$89.95 / year' },
  family: { monthly: '$19.95 / month', yearly: '$189.95 / year' },
};

function formatRenewalDate(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function AccountDashboard({ memorials, ownerId, subscription }) {
  if (!memorials || memorials.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="account-memorials">
        <h3 className="account-section-heading">Your altar</h3>
        <p className="account-section-sub">
          Edit a name, add a photo, refine a dedication. Changes save right to the candle.
        </p>
        {memorials.map((m) => (
          <MemorialCard key={m.hash} memorial={m} ownerId={ownerId} />
        ))}
      </div>

      <ManageBilling subscription={subscription} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Upgrade card â shown to memorial subscribers who haven't canceled/paused
// ---------------------------------------------------------------------------
function UpgradeCard({ billingInterval }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const familyPrice =
    billingInterval === 'yearly' ? '$189.95 / year' : '$19.95 / month';
  const priceDiff =
    billingInterval === 'yearly' ? '$100 / year' : '$10 / month';

  async function handleUpgrade() {
    setErrorMsg('');
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Please refresh the page and sign in again.');
      }

      const res = await fetch('/api/account/upgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Upgrade failed. Please try again.');
      }

      setUpgraded(true);
      // Reload after a moment so the billing section reflects the new plan
      setTimeout(() => router.refresh(), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (upgraded) {
    return (
      <div className="upgrade-card upgrade-card--success">
        <p className="upgrade-success-msg">
          ð¯ Welcome to the Family Altar. You can now light candles for everyone you love.
        </p>
      </div>
    );
  }

  return (
    <div className="upgrade-card">
      <div className="upgrade-card-inner">
        <div className="upgrade-card-text">
          <h4 className="upgrade-card-title">Upgrade to Family Altar</h4>
          <p className="upgrade-card-sub">
            Honor everyone â light candles for as many loved ones as you wish.
          </p>
          <ul className="upgrade-features">
            <li>Unlimited candles on the altar</li>
            <li>Individual dedications, photos &amp; dates for each</li>
            <li>One plan, one family, every soul remembered</li>
          </ul>
        </div>
        <div className="upgrade-card-action">
          <div className="upgrade-price">
            <span className="upgrade-price-amount">{familyPrice}</span>
            <span className="upgrade-price-note">just {priceDiff} more Â· prorated today</span>
          </div>
          {errorMsg && <p className="wizard-error">{errorMsg}</p>}
          <button
            type="button"
            className="btn-upgrade"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Upgradingâ¦' : 'Upgrade now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing section
// ---------------------------------------------------------------------------
function ManageBilling({ subscription }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleManageBilling() {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not open billing portal. Please try again.');
      }
      window.location.href = data.url;
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const planName = subscription ? (PLAN_NAMES[subscription.tier] || subscription.tier) : null;
  const planPrice = subscription
    ? (PLAN_PRICES[subscription.tier]?.[subscription.billing_interval] || null)
    : null;
  const renewalDate = subscription ? formatRenewalDate(subscription.current_period_end) : null;
  const cancelAtEnd = subscription?.cancel_at_period_end;
  const isPaused = subscription?.paused;

  // Show the upgrade card for active memorial subscribers only
  const showUpgrade =
    subscription?.tier === 'memorial' && !isPaused && !cancelAtEnd;

  return (
    <div className="manage-billing">
      <h3 className="account-section-heading">Billing</h3>

      {subscription ? (
        <div className="plan-summary">
          <div className="plan-summary-row">
            <span className="plan-summary-name">{planName}</span>
            {planPrice && <span className="plan-summary-price">{planPrice}</span>}
          </div>
          {isPaused && (
            <p className="plan-summary-note">Your subscription is currently paused.</p>
          )}
          {!isPaused && cancelAtEnd && renewalDate && (
            <p className="plan-summary-note plan-summary-note--warn">
              Cancels on {renewalDate}. Your candle will remain lit until then.
            </p>
          )}
          {!isPaused && !cancelAtEnd && renewalDate && (
            <p className="plan-summary-note">Renews {renewalDate}.</p>
          )}
          <p className="plan-summary-hint">
            To change your plan or billing cycle, use the billing portal below.
          </p>
        </div>
      ) : (
        <p className="account-section-sub">
          Update your payment method, view past invoices, or manage your subscription.
        </p>
      )}

      {showUpgrade && (
        <UpgradeCard billingInterval={subscription.billing_interval} />
      )}

      {errorMsg && <p className="wizard-error">{errorMsg}</p>}
      <button
        type="button"
        className="btn-secondary"
        onClick={handleManageBilling}
        disabled={loading}
      >
        {loading ? 'Openingâ¦' : 'Manage billing'}
      </button>
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

function MemorialCard({ memorial, ownerId }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(memorial.name || '');
  const [birthDate, setBirthDate] = useState(memorial.birth_date || '');
  const [deathDate, setDeathDate] = useState(memorial.death_date || '');
  const [dedication, setDedication] = useState(memorial.dedication || '');
  const [photoUrl, setPhotoUrl] = useState(memorial.photo_url || null);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const status = memorial.status;
  const statusInfo = STATUS_LABELS[status];

  // Detect unsaved changes so the Save button is meaningful. Photo uploads
  // save themselves immediately, so they don't count toward dirty state.
  const dirty =
    name !== (memorial.name || '') ||
    birthDate !== (memorial.birth_date || '') ||
    deathDate !== (memorial.death_date || '') ||
    dedication !== (memorial.dedication || '');

  async function persistPatch(payload) {
    const res = await fetch(`/api/memorials/${memorial.hash}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not save changes. Please try again.');
    }
    return data;
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so picking the same file twice still fires onChange
    if (!file) return;

    setErrorMsg('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Photos must be JPG, PNG, or WebP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('Photos must be under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split('.').pop().toLowerCase();
      const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const path = `${ownerId}/${memorial.hash}.${cleanExt}`;

      const { error: uploadError } = await supabase.storage
        .from('memorial-photos')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('memorial-photos')
        .getPublicUrl(path);

      // Cache-bust by appending a timestamp so the browser refetches even when
      // the path didn't change (replacing an existing photo).
      const bustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await persistPatch({
        name: name.trim(),
        birthDate: birthDate || null,
        deathDate: deathDate || null,
        dedication: dedication.trim() || null,
        photoUrl: bustedUrl,
      });

      setPhotoUrl(bustedUrl);
      setUploading(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message || 'Could not upload the photo.');
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!photoUrl) return;
    if (!confirm('Remove this photo? You can upload a new one anytime.')) return;

    setErrorMsg('');
    setUploading(true);
    try {
      // Best effort â clear the DB pointer first; the file in storage can be
      // garbage-collected later. We don't fail the user if the file delete
      // fails because the candle no longer references it anyway.
      await persistPatch({
        name: name.trim(),
        birthDate: birthDate || null,
        deathDate: deathDate || null,
        dedication: dedication.trim() || null,
        photoUrl: null,
      });

      setPhotoUrl(null);
      setUploading(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message || 'Could not remove the photo.');
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Their name cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      await persistPatch({
        name: name.trim(),
        birthDate: birthDate || null,
        deathDate: deathDate || null,
        dedication: dedication.trim() || null,
      });
      setSavedAt(Date.now());
      setSubmitting(false);
      router.refresh();
      // Hide the saved banner after 4 seconds
      setTimeout(() => setSavedAt((t) => (Date.now() - t > 3500 ? null : t)), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Could not save changes. Please try again.');
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

      <div className="memorial-card-photo">
        <div className="photo-preview">
          {photoUrl ? (
            <img src={photoUrl} alt={name || 'Memorial photo'} />
          ) : (
            <div className="photo-placeholder" aria-hidden="true">
              {(name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="photo-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoPick}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-secondary photo-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploadingâ¦' : photoUrl ? 'Replace photo' : 'Add a photo'}
          </button>
          {photoUrl && !uploading && (
            <button
              type="button"
              className="photo-remove-btn"
              onClick={handleRemovePhoto}
            >
              Remove
            </button>
          )}
          <p className="photo-hint">JPG, PNG, or WebP Â· up to 5 MB</p>
        </div>
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
          placeholder="A line they used to say, a memory, a blessing â whatever feels right."
        />

        {errorMsg && <p className="wizard-error">{errorMsg}</p>}

        {savedAt && !errorMsg && (
          <div className="memorial-card-saved-banner" role="status">
            <span className="check" aria-hidden="true">â</span>
            <span>Changes saved.</span>
          </div>
        )}

        <div className="memorial-card-actions">
          <button
            type="submit"
            className="btn-cta"
            disabled={submitting || !dirty}
          >
            {submitting ? 'Savingâ¦' : 'Save changes'}
          </button>
        </div>
      </form>
    </article>
  );
}
