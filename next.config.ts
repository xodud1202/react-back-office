import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // 1) 도메인 허용할 때
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.xodud1202.kro.kr',
      },
    ],
  },
};

export default nextConfig;
