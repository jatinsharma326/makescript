import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger request bodies for video file uploads (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Increase API route body size
  serverExternalPackages: [],
};

// Force restart for Tailwind v4
export default nextConfig;
