/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nexus/types'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
