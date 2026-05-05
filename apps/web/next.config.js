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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    // health/ready are excluded from the backend global prefix — strip /api/vN to reach them
    const apiBase = apiUrl.replace(/\/api\/v\d+\/?$/, '');
    if (apiBase === apiUrl && process.env.NEXT_PUBLIC_API_URL) {
      // URL missing /api/vN suffix — health/ready rewrites will be misconfigured
      console.error(
        `[SSE] NEXT_PUBLIC_API_URL "${apiUrl}" does not end in /api/v<N>.\n` +
          `Expected: http://host/api/v1  Got: ${apiUrl}\n` +
          `Health/ready proxy rewrites will be misconfigured.`,
      );
    }
    return [
      { source: '/api/health', destination: `${apiBase}/health` },
      { source: '/api/ready', destination: `${apiBase}/ready` },
      // wildcard: note that /api/docs* proxies to /api/v1/docs* which 404s on backend
      // (Swagger is served at /docs, outside the global prefix) — intentionally not reachable via proxy
      { source: '/api/:path*', destination: `${apiUrl}/:path*` },
    ];
  },
};

module.exports = nextConfig;
