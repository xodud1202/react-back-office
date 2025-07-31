// pages/_app.tsx
import '../styles/globals.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type {AppProps} from 'next/app'
import {useRouter} from 'next/router'
import {CookiesProvider} from 'react-cookie';
import Cookies from 'universal-cookie';
import AdminLayout from '../components/AdminLayout';
import "../utils/common.ts";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps & { cookies?: string }) {
    // SSR로부터 받는 쿠키 문자열 초기화
    const cookies = pageProps.cookies ? new Cookies(pageProps.cookies) : undefined

    const router = useRouter()

    const isLayoutNeeded = router.pathname === '/main';

    return (
        // SSR 쿠키를 CSR에도 적용
        <CookiesProvider cookies={cookies}>
            {/* ✅ 공통 Head 설정 */}
            <Head>
                <title>Back-office</title>
                <meta name="description" content="백오피스" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            {isLayoutNeeded ? (
                <AdminLayout>
                    <Component {...pageProps} />
                </AdminLayout>
            ) : (
                <Component {...pageProps} />
            )}
        </CookiesProvider>
    )
}

export default MyApp