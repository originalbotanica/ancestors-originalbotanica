import Stripe from 'stripe';

// Server-side Stripe client. Use ONLY in API routes and server code — never in browser code.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: false,
});

// Maps tier + interval to the Stripe Price ID we configured in env vars.
export function priceIdFor(tier, interval) {
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key];
}

// Friendly product label for emails / UI based on tier.
export function tierLabel(tier) {
  return tier === 'family' ? 'Family Altar' : 'Memorial Candle';
}
