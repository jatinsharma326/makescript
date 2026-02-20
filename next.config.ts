import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable StrictMode to prevent Remotion Player from double-mounting
  // video elements (which causes double audio playback)
  reactStrictMode: false,
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
