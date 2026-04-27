import { updateSession } from '@/lib/auth-middleware';

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and common static files.
    // The webhook endpoint is excluded so Stripe's POST body doesn't get touched.
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
