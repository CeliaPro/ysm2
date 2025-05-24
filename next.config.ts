import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Ensure resolve.fallback exists
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
    };
    return config;
  },
};

export default nextConfig;
