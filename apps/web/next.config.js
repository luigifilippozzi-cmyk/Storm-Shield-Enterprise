/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone output is for Docker/CI Linux deployments only
  // Vercel has its own build process; Windows lacks symlink support
  ...(process.env.VERCEL || process.platform === 'win32'
    ? {}
    : { output: 'standalone' }),
  transpilePackages: ['@sse/shared-types', '@sse/shared-utils'],
};

module.exports = nextConfig;
