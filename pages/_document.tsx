// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 템플릿 CSS 로딩 */}
        <link rel="shortcut icon" href="/assets/images/favicon.png" />
        <link rel="stylesheet" href="/assets/vendors/mdi/css/materialdesignicons.min.css" />
        <link rel="stylesheet" href="/assets/vendors/ti-icons/css/themify-icons.css" />
        <link rel="stylesheet" href="/assets/vendors/css/vendor.bundle.base.css" />
        <link rel="stylesheet" href="/assets/vendors/font-awesome/css/font-awesome.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
