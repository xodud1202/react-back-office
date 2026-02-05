// pages/_app.tsx
import '../styles/globals.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-quill-new/dist/quill.snow.css';
import type {AppProps} from 'next/app'
import {useEffect} from 'react';
import {useRouter} from 'next/router'
import {CookiesProvider} from 'react-cookie';
import Cookies from 'universal-cookie';
import AdminLayout from '../components/AdminLayout';
import "@/utils/common";
import Head from "next/head";
import Script from 'next/script';
import {Provider} from 'react-redux';
import {getCookie} from 'cookies-next';
import api, { clearAuthData } from '@/utils/axios/axios';
import {store} from '@/store/setting/store';
import {loginSuccess, logout} from '@/store/loginUser/loginUser';
import type {User} from '@/store/common';

// 공통 앱 레이아웃을 구성합니다.
function MyApp({Component, pageProps}: AppProps & { cookies?: string }) {
  // SSR로부터 받는 쿠키 문자열 초기화
  const cookies = pageProps.cookies ? new Cookies(pageProps.cookies) : undefined

  const router = useRouter()
  const isLayoutNeeded = router.pathname !== '/login';

  // 쿠키 기반으로 로그인 상태를 복원합니다.
  useEffect(() => {
    // accessToken이 있으면 로그인 상태를 복원합니다.
    const accessToken = getCookie('accessToken', { path: '/' });
    const usrNo = getCookie('usrNo', { path: '/' });
    if (typeof accessToken === 'string' && accessToken.trim() !== '' && typeof usrNo === 'string') {
      api.get('/api/backoffice/user/info', { params: { usrNo } })
        .then((response) => {
          const user = response.data as User;
          store.dispatch(loginSuccess(user));
        })
        .catch(() => {
          clearAuthData();
          store.dispatch(logout());
        });
      return;
    }
    // 로그인 상태가 아니면 전역 상태를 초기화합니다.
    store.dispatch(logout());
  }, []);

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
          <AdminLayout>
            <Component {...pageProps} />
          </AdminLayout>
        ) : (
          <Component {...pageProps} />
        )}
      </Provider>
    </CookiesProvider>
  )
}

export default MyApp
