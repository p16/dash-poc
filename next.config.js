/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to satisfy Next.js 16 requirement
  turbopack: {},

  webpack: (config, { isServer }) => {
    // Exclude test files that might be imported by dependencies
    config.externals = config.externals || [];
    config.externals.push({
      'tap': 'commonjs tap',
    });

    // Copy .txt prompt files to build output
    if (isServer) {
      config.module.rules.push({
        test: /\.txt$/,
        type: 'asset/source',
      });
    }

    return config;
  },
};

module.exports = nextConfig;

