const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.cashfree.com http://localhost:* ws://localhost:*",
      "media-src 'self' blob: https:",
      ...(isDev ? [] : ['upgrade-insecure-requests']),
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
};

module.exports = nextConfig;
