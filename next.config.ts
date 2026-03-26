import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Runner에서 빌드한 서버 산출물만 OCI 서버에 배포할 수 있도록 standalone 출력을 사용합니다.
  output: 'standalone',
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
        source: '/api/last/news/:path*', // 뉴스 파일 API 경로
        destination: 'https://be.xodud1202.kro.kr/api/last/news/:path*', // 크롬 확장프로그램과 동일하게 BE 도메인으로 프록시
      },
      {
        source: '/api/:path*', // 클라이언트에서 요청받을 API 경로
        destination: `${process.env.BACKEND_URL}/:path*`, // 실제 프록시할 서버 주소로 변경
      },
    ];
  },
};

export default nextConfig;
