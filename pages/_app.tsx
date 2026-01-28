// pages/_app.tsx
import '/styles/globals.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-quill-new/dist/quill.snow.css';
import type {AppContext, AppProps} from 'next/app'
import App from 'next/app';
import {useRouter} from 'next/router'
import {CookiesProvider} from 'react-cookie';
import Cookies from 'universal-cookie';
import AdminLayout from '../components/AdminLayout';
import "@/utils/common";
import Head from "next/head";
import Script from 'next/script';
import {Provider} from 'react-redux';
import {store} from '@/store/setting/store';
import { MenuItem } from '@/types/menu';
import { getCookie } from 'cookies-next';

let cachedMenuItems: MenuItem[] | null = null;
let cachedMenuToken: string | null = null;

function MyApp({Component, pageProps}: AppProps & { cookies?: string; menuItems?: MenuItem[] }) {
  // SSR로부터 받는 쿠키 문자열 초기화
  const cookies = pageProps.cookies ? new Cookies(pageProps.cookies) : undefined

  const router = useRouter()

  const isLayoutNeeded = router.pathname !== '/login';

  return (
    // SSR 쿠키를 CSR에도 적용
    <CookiesProvider cookies={cookies}>
      <Provider store={store}>
        {/* ✅ 공통 Head 설정 */}
        <Head>
          <title>Back-office</title>
          <meta name="description" content="백오피스"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
        </Head>
        {/* 템플릿 JS 로딩 (jQuery 의존 스크립트는 vendor 로딩 이후에 주입) */}
        <Script
          src="/assets/vendors/js/vendor.bundle.base.js"
          strategy="beforeInteractive"
          onLoad={() => {
            const scriptList = [
              '/assets/js/jquery.cookie.js',
              '/assets/js/off-canvas.js',
              '/assets/js/misc.js',
              '/assets/js/settings.js',
              '/assets/js/todolist.js',
              '/assets/vendors/chart.js/chart.umd.js',
              '/assets/js/chart.js',
            ];

            scriptList.forEach((src) => {
              if (document.querySelector(`script[src="${src}"]`)) {
                return;
              }
              const script = document.createElement('script');
              script.src = src;
              script.async = false;
              document.body.appendChild(script);
            });
          }}
        />

        {isLayoutNeeded ? (
          <AdminLayout menuItems={pageProps.menuItems}>
            <Component {...pageProps} />
          </AdminLayout>
        ) : (
          <Component {...pageProps} />
        )}
      </Provider>
    </CookiesProvider>
  )
}

// SSR/CSR 모두에서 최초 1회 메뉴를 가져오고 캐시합니다.
MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const { ctx } = appContext;
  const isServer = Boolean(ctx.req);
  const accessToken = (await getCookie('accessToken', ctx)) as string | undefined;
  let menuItems: MenuItem[] = [];

  // CSR에서는 메뉴를 다시 요청하지 않습니다.
  if (!isServer) {
    return {
      ...appProps,
      pageProps: {
        ...appProps.pageProps,
        menuItems: cachedMenuItems ?? appProps.pageProps.menuItems ?? [],
      },
    };
  }

  // 서버에서만 메뉴를 조회합니다.
  if (!accessToken) {
    cachedMenuItems = null;
    cachedMenuToken = null;
    return {
      ...appProps,
      pageProps: {
        ...appProps.pageProps,
        menuItems,
      },
    };
  }

  try {
    const baseUrl = process.env.BACKEND_URL || '';
    const requestUrl = `${baseUrl}/api/admin/menu/list`;
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      menuItems = await response.json();
      cachedMenuItems = menuItems;
      cachedMenuToken = accessToken;
    }
  } catch (error) {
    console.error('메뉴 조회 실패:', error);
  }

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      menuItems,
    },
  };
};

export default MyApp
