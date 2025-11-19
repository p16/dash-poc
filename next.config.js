/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to satisfy Next.js 16 requirement
  turbopack: {},

  webpack: (config) => {
    // Exclude test files that might be imported by dependencies
    config.externals = config.externals || [];
    config.externals.push({
      'tap': 'commonjs tap',
    });

    return config;
  },
};

module.exports = nextConfig;

