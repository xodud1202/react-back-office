import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pages 라우터 의존성을 서버 번들에 포함하여 Workers 런타임 외부 모듈 로딩 실패를 방지한다.
  bundlePagesRouterDependencies: true,
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
