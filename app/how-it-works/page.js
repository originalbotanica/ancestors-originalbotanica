import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'How It Works — Ancestors · Original Botanica',
  description: 'Learn how to light a candle and honor your ancestors on the Original Botanica Ancestor Altar.',
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="how-it-works-page">
        <div className="hiw-hero">
          <h1 className="hiw-title">How It Works</h1>
          <p className="hiw-subtitle">
            A living altar for those who came before us — tended with love, open to all.
          </p>
        </div>

        <div className="hiw-steps">

          <div className="hiw-step">
            <div className="hiw-step-number">1</div>
            <div className="hiw-step-body">
              <h2>Light a Candle</h2>
              <p>
                Click <strong>Light a Candle</strong> and enter the name of your loved one along
                with their birth and passing years. You may also upload a photo so their face
                shines on the altar for all to see.
              </p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-number">2</div>
            <div className="hiw-step-body">
              <h2>Your Candle Joins the Altar</h2>
              <p>
                Once lit, your candle appears on the communal altar alongside those honored by
                others from around the world. The flame burns continuously as a beacon of
                remembrance and love.
              </p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-number">3</div>
            <div className="hiw-step-body">
              <h2>Visit Anytime</h2>
              <p>
                Return to <strong>The Altar</strong> whenever you wish to sit with your ancestors.
                Click any candle to read the tribute and spend a moment in reflection. The altar
                is always open, always lit.
              </p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-step-number">4</div>
            <div className="hiw-step-body">
              <h2>Share the Light</h2>
              <p>
                Each candle has its own page you can share with family and friends — a permanent
                digital memorial where loved ones can gather, remember, and carry the light forward.
              </p>
            </div>
          </div>

        </div>

        <div className="hiw-cta">
          <p className="hiw-cta-text">Ready to honor someone dear to you?</p>
          <a href="/light-a-candle" className="hiw-cta-btn">Light a Candle</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
