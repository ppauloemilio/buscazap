import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fotos até 5 MB cada; capa + até 5 da galeria no mesmo envio.
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
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
