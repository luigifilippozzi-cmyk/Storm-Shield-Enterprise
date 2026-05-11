/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone output is for Docker/CI Linux deployments only
  // Vercel has its own build process; Windows lacks symlink support
  ...(process.env.VERCEL || process.platform === 'win32'
    ? {}
    : { output: 'standalone' }),
  transpilePackages: ['@sse/shared-types', '@sse/shared-utils'],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // On Vercel (staging/production), NEXT_PUBLIC_API_URL must be set explicitly.
    // If missing, rewrites would silently fall back to localhost (unreachable from Vercel)
    // and all /api/* routes would return 404. Fail fast instead.
    if (!apiUrl && process.env.VERCEL) {
      throw new Error(
        '[SSE] NEXT_PUBLIC_API_URL is not set in the Vercel environment.\n' +
          'Go to Vercel dashboard → Settings → Environment Variables and add:\n' +
          '  NEXT_PUBLIC_API_URL = https://sse-api-staging.fly.dev/api/v1  (staging)\n' +
          '  NEXT_PUBLIC_API_URL = https://api.stormshield.app/api/v1      (production)',
      );
    }
    const resolvedUrl = apiUrl || 'http://localhost:3001/api/v1';
    // health/ready are excluded from the backend global prefix — strip /api/vN to reach them
    const apiBase = resolvedUrl.replace(/\/api\/v\d+\/?$/, '');
    if (apiBase === resolvedUrl && apiUrl) {
      // URL missing /api/vN suffix — health/ready rewrites will be misconfigured
      console.error(
        `[SSE] NEXT_PUBLIC_API_URL "${resolvedUrl}" does not end in /api/v<N>.\n` +
          `Expected: http://host/api/v1  Got: ${resolvedUrl}\n` +
          `Health/ready proxy rewrites will be misconfigured.`,
      );
    }
    return [
      { source: '/api/health', destination: `${apiBase}/health` },
      { source: '/api/ready', destination: `${apiBase}/ready` },
      // wildcard: /api/docs* proxies to /api/v1/docs* which 404s on backend
      // (Swagger is served at /docs, outside the global prefix) — intentionally not reachable via proxy
      { source: '/api/:path*', destination: `${resolvedUrl}/:path*` },
    ];
  },
};

module.exports = nextConfig;
