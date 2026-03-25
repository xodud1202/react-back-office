import type { Metadata } from 'next';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-quill-new/dist/quill.snow.css';
import '@/styles/globals.css';

/**
 * 앱 전체 메타데이터를 정의합니다.
 */
export const metadata: Metadata = {
  title: 'Back-office',
  description: '백오피스',
  icons: {
    icon: 'https://image.xodud1202.kro.kr/publist/HDD1/Media/nas/image/common/xodud1202_icon_102x102.png',
  },
};

/**
 * App Router 기준 루트 레이아웃을 렌더링합니다.
 * @param props 자식 노드를 포함한 루트 레이아웃 속성입니다.
 * @returns 전역 스타일과 HTML 골격을 포함한 루트 레이아웃입니다.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        {/* 템플릿 CSS를 App Router 루트에서 공통 로드합니다. */}
        <link rel="stylesheet" href="/assets/vendors/mdi/css/materialdesignicons.min.css" />
        <link rel="stylesheet" href="/assets/vendors/ti-icons/css/themify-icons.css" />
        <link rel="stylesheet" href="/assets/vendors/css/vendor.bundle.base.css" />
        <link rel="stylesheet" href="/assets/vendors/font-awesome/css/font-awesome.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
