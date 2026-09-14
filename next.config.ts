import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/calcnote",
  allowedDevOrigins: ["192.168.3.11"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
