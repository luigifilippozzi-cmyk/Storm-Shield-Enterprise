/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sse/shared-types', '@sse/shared-utils'],
};

module.exports = nextConfig;
