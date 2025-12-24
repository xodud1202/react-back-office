import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 무시하고 진행합니다.
    ignoreDuringBuilds: true,
  },
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
  async rewrites() {
    return [
      {
        source: '/api/:path*', // 클라이언트에서 요청받을 API 경로
        destination: `${process.env.BACKEND_URL}/:path*`, // 실제 프록시할 서버 주소로 변경
      },
    ];
  },
};

export default nextConfig;
