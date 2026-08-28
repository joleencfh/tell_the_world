import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Next's dev server (HMR/react-refresh) needs 'unsafe-eval'; production
// doesn't, so only relax script-src outside prod.
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

// scripts/seed-mock-data.ts (dev/demo data only) generates avatars from
// dicebear.com; real avatars only ever come from Supabase storage uploads
// (app/profile/[id]/actions.ts) or are null, so prod doesn't need this host.
const imgSrc =
  process.env.NODE_ENV === "production"
    ? `img-src 'self' data: ${supabaseUrl}`
    : `img-src 'self' data: ${supabaseUrl} https://api.dicebear.com`;

// 'unsafe-inline' on script/style is a known weak spot (Next's App Router
// injects inline hydration/style tags) — a nonce-based CSP would close it
// but needs per-request headers wired through proxy.ts. This is the
// pragmatic baseline: still blocks framing, object embeds, and requests to
// arbitrary origins, which covers the common URL-based attack classes.
const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  imgSrc,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
};

export default nextConfig;
