// pages/_app.tsx
import '../styles/globals.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { setRouter } from '../utils/api'
import { CookiesProvider } from 'react-cookie';
import Cookies from 'universal-cookie';
import AdminLayout from '../components/AdminLayout';

function MyApp({ Component, pageProps }: AppProps & { cookies?: string }) {
    // SSR로부터 받는 쿠키 문자열 초기화
    const cookies = pageProps.cookies ? new Cookies(pageProps.cookies) : undefined

    const router = useRouter()

    useEffect(() => {
        // API 유틸리티에 라우터 설정
        setRouter(router)
    }, [router])

    const isLayoutNeeded = router.pathname !== '/login' && router.pathname !== '/index' && router.pathname !== '/';

    return (
        // SSR 쿠키를 CSR에도 적용
        <CookiesProvider cookies={cookies}>
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