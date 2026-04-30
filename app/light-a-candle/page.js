'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteFooter from '../components/SiteFooter';

const TIERS = [
  {
    id: 'memorial',
    name: 'Memorial Candle',
    monthly: '9.95',
    yearly: '89.95',
    description:
      'One perpetual candle for one loved one. Photo, dates, dedication, and quiet remembrances on the days that matter.',
  },
  {
    id: 'family',
    name: 'Family Altar',
    monthly: '19.95',
    yearly: '189.95',
    description:
      'A family altar of your own. Up to seven loved ones, each with their own candle, photo, and remembrances — all tended together.',
  },
];

export default function LightACandlePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [tierLocked, setTierLocked] = useState(false);

  const [lovedOneName, setLovedOneName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [dedication, setDedication] = useState('');
  const [tier, setTier] = useState('memorial');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Prevent browser from navigating to files dragged onto the page
  useEffect(() => {
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

    useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);

      // Read pre-selected plan from URL (?plan=family or ?plan=memorial)
      const planParam = params.get('plan');
      if (planParam === 'family' || planParam === 'memorial') {
        setTier(planParam);
        setTierLocked(true);
      }

      // Handle return from Stripe checkout
      if (params.get('canceled') === '1') {
        setErrorMsg('Checkout was cancelled. Your candle is waiting — try again whenever you are ready.');
        const saved = sessionStorage.getItem('lac_form');
        if (saved) {
          try {
            const f = JSON.parse(saved);
            setLovedOneName(f.lovedOneName || '');
            setBirthDate(f.birthDate || '');
            setDeathDate(f.deathDate || '');
            setDedication(f.dedication || '');
            setTier(f.tier || 'memorial');
            setBillingInterval(f.billingInterval || 'monthly');
            setCustomerName(f.customerName || '');
            setEmail(f.email || '');
            if (f.tierLocked) setTierLocked(true);
            setStep(4);
          } catch {}
        }
      } else {
        // Fresh start — clear any stale saved form data
        sessionStorage.removeItem('lac_form');
      }
    }
  }, []);

  function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Photos must be JPG, PNG, or WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Photos must be under 5 MB.');
      return;
    }
    setErrorMsg('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePhotoRemove() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  function next() {
    setErrorMsg('');
    if (step === 1 && !lovedOneName.trim()) {
      setErrorMsg('Please tell us their name.');
      return;
    }
    // Skip step 3 (choose remembrance) if plan was pre-selected
    const nextStep = (step === 2 && tierLocked) ? 4 : step + 1;
    if (step < 4) setStep(nextStep);
  }

  function back() {
    setErrorMsg('');
    // Skip step 3 going backwards if plan was pre-selected
    const prevStep = (step === 4 && tierLocked) ? 2 : step - 1;
    if (step > 1) setStep(prevStep);
  }

  async function handleSubmit() {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Please tell us your name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/light-a-candle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lovedOneName: lovedOneName.trim(),
          birthDate: birthDate || null,
          deathDate: deathDate || null,
          dedication: dedication.trim() || null,
          tier,
          billingInterval,
          customerName: customerName.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        if (photoFile && data.hash) {
          try {
            const fd = new FormData();
            fd.append('hash', data.hash);
            fd.append('file', photoFile);
            await fetch('/api/upload-memorial-photo', { method: 'POST', body: fd });
          } catch {
            // Non-fatal — user can add from account later.
          }
        }
        // Save form state so we can restore it if the user comes back from Stripe
        sessionStorage.setItem('lac_form', JSON.stringify({
          lovedOneName: lovedOneName.trim(),
          birthDate,
          deathDate,
          dedication: dedication.trim(),
          tier,
          billingInterval,
          customerName: customerName.trim(),
          email: email.trim(),
          tierLocked,
        }));
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const selectedTier = TIERS.find((t) => t.id === tier);
  const price = billingInterval === 'monthly' ? selectedTier.monthly : selectedTier.yearly;
  const period = billingInterval === 'monthly' ? '/ MONTH' : '/ YEAR';

  const totalSteps = tierLocked ? 3 : 4;
  const displayStep = tierLocked && step === 4 ? 3 : step;

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-logo-link" aria-label="Home">
          <div className="brand-logo">
            <img src="/logo-original-botanica.svg" alt="Original Botanica" />
            <div className="tag">Ancestor Altar</div>
          </div>
        </Link>
      </header>

      <main className="wizard-main">
        <div className="wizard">
          <div className="wizard-progress" aria-label={`Step ${displayStep} of ${totalSteps}`}>
            {[1, 2, 3, 4].filter((n) => !tierLocked || n !== 3).map((n) => (
              <div key={n} className={`dot ${n <= step ? 'active' : ''}`} />
            ))}
          </div>

          {step === 1 && (
            <>
              <h2>Who are you remembering?</h2>
              <p className="wizard-sub">This is the name that will appear beneath their candle.</p>
              <label htmlFor="lovedOneName">Their full name</label>
              <input
                id="lovedOneName"
                type="text"
                placeholder="e.g., Maria Elena Reyes"
                value={lovedOneName}
                onChange={(e) => setLovedOneName(e.target.value)}
                autoFocus
              />
              <label htmlFor="birthDate">
                Birthday <span className="optional">(optional)</span>
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <label htmlFor="deathDate">
                Date of passing <span className="optional">(optional)</span>
              </label>
              <input
                id="deathDate"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2>Add a photo and a few words</h2>
              <p className="wizard-sub">Both are optional. Both can be added or changed later.</p>

              <label>A photo of them <span className="optional">(optional)</span></label>
              {photoPreview ? (
                <div className="photo-preview-wrap">
                  <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                  <button type="button" className="photo-remove-btn" onClick={handlePhotoRemove}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className="photo-pick-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoPick}
                    className="photo-file-input"
                  />
                  <span>Choose a photo</span>
                  <small>JPG, PNG, or WebP up to 5 MB</small>
                </label>
              )}

              <label htmlFor="dedication">A dedication, prayer, or memory</label>
              <textarea
                id="dedication"
                placeholder="Anything you'd like to share. A line they used to say, a memory, a blessing — whatever feels right."
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                rows={5}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2>Choose your remembrance</h2>
              <p className="wizard-sub">You can change or cancel anytime.</p>

              <div className="tier-toggle">
                <button
                  type="button"
                  className={billingInterval === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={billingInterval === 'yearly' ? 'active' : ''}
                  onClick={() => setBillingInterval('yearly')}
                >
                  Yearly — Save 25%
                </button>
              </div>

              <div className="tiers">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tier ${tier === t.id ? 'selected' : ''}`}
                    onClick={() => setTier(t.id)}
                  >
                    <div className="tier-name">{t.name}</div>
                    <div className="tier-price">
                      <span>${billingInterval === 'monthly' ? t.monthly : t.yearly}</span>
                      <small> {billingInterval === 'monthly' ? '/ MONTH' : '/ YEAR'}</small>
                    </div>
                    <div className="tier-desc">{t.description}</div>
                  </button>
                ))}
              </div>

              <p className="wizard-note">
                After step 4, you will be sent to Stripe's secure checkout to enter your payment details. You can change tier or cancel anytime from your account.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Create your account</h2>
              <p className="wizard-sub">So you can return anytime to visit, edit, or share their candle.</p>

              <label htmlFor="customerName">Your name</label>
              <input
                id="customerName"
                type="text"
                placeholder="e.g., Jason Reyes"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoFocus
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <p className="wizard-note">
                Selected: <strong>{selectedTier.name}</strong> ${price} {period.toLowerCase()}.
                When you click below, you will be sent to a secure Stripe checkout page to enter your payment details.
              </p>
            </>
          )}

          {errorMsg && <p className="wizard-error">{errorMsg}</p>}

          <div className="wizard-nav">
            {step > 1 ? (
              <button type="button" className="btn-secondary" onClick={back} disabled={submitting}>
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button type="button" className="btn-cta" onClick={next}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn-cta"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Lighting the candle...' : 'Light the Candle'}
              </button>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
