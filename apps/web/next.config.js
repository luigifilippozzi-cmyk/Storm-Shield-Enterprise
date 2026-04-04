/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@sse/shared-types', '@sse/shared-utils'],
};

module.exports = nextConfig;
