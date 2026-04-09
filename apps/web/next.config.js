/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // standalone output is for Docker deployments only; Vercel has its own build process
    ...(process.env.VERCEL ? {} : { output: 'standalone' }),
    transpilePackages: ['@sse/shared-types', '@sse/shared-utils'],
};

module.exports = nextConfig;
