import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fotos até 4 MB cada; limite alinhado ao teto prático da Vercel (~4,5 MB por request).
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
