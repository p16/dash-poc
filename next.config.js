/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack in dev to use webpack (Turbopack doesn't support custom loaders yet)
  // Run with: npm run dev (will use webpack)
  // or explicitly: next dev --webpack

  webpack: (config, { isServer }) => {
    // Exclude test files that might be imported by dependencies
    config.externals = config.externals || [];
    config.externals.push({
      'tap': 'commonjs tap',
    });

    // Handle .txt files as raw text strings (both client and server)
    config.module.rules.push({
      test: /\.txt$/,
      type: 'asset/source',
    });

    return config;
  },
};

module.exports = nextConfig;

