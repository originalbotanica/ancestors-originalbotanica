'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RITUAL_LINES = [
  { delay: 800,  key: false, text: 'Take a few quiet moments to connect with your loved one.' },
  { delay: 2800, key: false, text: 'Breathe deeply — in through your nose, out through your mouth.' },
  { delay: 4800, key: false, text: 'Let the outside world soften.' },
  { delay: 7000, key: false, text: 'Think of the person you’re honoring.' },
  { delay: 9000, key: true,  text: 'Picture their face, their voice, a memory that makes you smile.' },
  { delay: 11500, key: false, text: 'When you’re ready, light your candle with intention.' },
  { delay: 13500, key: true,  text: 'As the flame appears, silently say their name.' },
  { delay: 15500, key: false, text: null },
];

const LAST_LINE_DELAY = 15500;
const BTN_DELAY = LAST_LINE_DELAY + 2200;

export default function CeremonyClient({ memorial }) {
  const router = useRouter();
  const [introVisible, setIntroVisible]     = useState(false);
  const [visibleLines, setVisibleLines]     = useState([]);
  const [btnVisible, setBtnVisible]         = useState(false);
  const [lighting, setLighting]             = useState(false);
  const [isLit, setIsLit]                   = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [altarLoading, setAltarLoading]     = useState(false);

  const sceneRef = useRef(null);

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setIntroVisible(true), 400));
    RITUAL_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
      }, line.delay));
    });
    timers.push(setTimeout(() => setBtnVisible(true), BTN_DELAY));
    return () => timers.forEach(clearTimeout);
  }, []);

  function lightCandle() {
    if (lighting || isLit) return;
    setLighting(true);
    if (sceneRef.current) {
      sceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setIsLit(true), 750);
    setTimeout(() => setConfirmVisible(true), 3400);
  }

  function visitAltar() {
    if (altarLoading) return;
    setAltarLoading(true);
    setTimeout(() => router.push('/candle/' + memorial.hash), 3500);
  }

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

      <main className="ceremony-main">

        <div
          ref={sceneRef}
          className={`ceremony-candle-scene${isLit ? ' is-lit' : ''}`}
        >
          <div className="ceremony-candle-glow" />
          <div className={`candle-wrapper${isLit ? ' is-lit' : ''}`}>
            <div className="flame-overlay">
              <div className="flame-halo" />
              <div className="flame-outer" />
              <div className="flame-mid" />
              <div className="flame-inner" />
              <div className="flame-tip" />
              <div className="flame-blue" />
            </div>
            <img
              src="/white-candle.png"
              alt="Candle"
              className="ceremony-candle-img"
            />
          </div>
        </div>

        <div className="ceremony-ritual">
          <p className={`ceremony-intro${introVisible ? ' visible' : ''}`}>
            A moment of intention
          </p>

          {RITUAL_LINES.map((line, i) => {
            const visible = visibleLines.includes(i);
            const cls = `ceremony-line${line.key ? ' key' : ''}${visible ? ' visible' : ''}`;

            if (line.text === null) {
              return (
                <p key={i} className={cls}>
                  Offer a few words from your heart — a thank you, a wish, a prayer,
                  or simply <em>&ldquo;I miss you.&rdquo;</em>
                </p>
              );
            }
            return (
              <p key={i} className={cls}>
                {line.text}
              </p>
            );
          })}
        </div>

        <div className={`ceremony-btn-wrap${btnVisible ? ' visible' : ''}`}>
          <button
            className="ceremony-light-btn"
            onClick={lightCandle}
            disabled={lighting}
          >
            {lighting ? 'Lighting…' : 'Light the Candle'}
          </button>
          <span className="ceremony-btn-note">
            Your candle has been waiting for this moment.
          </span>
        </div>

      </main>

      <div className={`ceremony-confirmation${confirmVisible ? ' visible' : ''}`}>

        <div className="ceremony-candle-scene is-lit" style={{ marginBottom: '32px' }}>
          <div className="ceremony-candle-glow" />
          <div className="candle-wrapper is-lit">
            <div className="flame-overlay">
              <div className="flame-halo" />
              <div className="flame-outer" />
              <div className="flame-mid" />
              <div className="flame-inner" />
              <div className="flame-tip" />
              <div className="flame-blue" />
            </div>
            <img
              src="/white-candle.png"
              alt="Candle"
              className="ceremony-candle-img"
            />
          </div>
        </div>

        <p className="ceremony-confirm-name">{memorial.name}</p>
        <div className="ceremony-confirm-divider" />
        <p className="ceremony-confirm-line">
          Their candle is lit. They are remembered.<br />
          Sit with the flame for as long as you need.
        </p>
        <p className="ceremony-confirm-sub">
          Feel the connection that still surrounds you.
        </p>

        <button
          onClick={visitAltar}
          disabled={altarLoading}
          className="ceremony-visit-btn"
        >
          {altarLoading ? 'Opening your altar…' : 'Visit their altar'}
        </button>
      </div>
    </>
  );
}
