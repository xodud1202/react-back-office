// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { setRouter } from '../utils/api'
import { setupTokenRefresh } from '../utils/tokenRefresh'

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter()

    useEffect(() => {
        // API 유틸리티에 라우터 설정
        setRouter(router)

        // 토큰 갱신 설정
        setupTokenRefresh()

        // 페이지 로드 시 토큰 확인
        const checkAuth = async () => {
            // 로그인 페이지는 체크하지 않음
            if (router.pathname === '/login') return

            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')

            // 토큰이 없으면 로그인 페이지로 리다이렉트
            if (!accessToken && !refreshToken) {
                router.push('/login')
                return
            }

            // AccessToken이 없고 RefreshToken만 있는 경우 토큰 갱신 시도
            if (!accessToken && refreshToken) {
                try {
                    const requestUri = '/token/backoffice/refresh-token'
                    const requestParam = { refreshToken }

                    const response = await fetch('/api/backend-api', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestUri, requestParam })
                    })

                    if (!response.ok) {
                        router.push('/login')
                        return
                    }

                    const data = await response.json()
                    if (data.result === 'OK') {
                        localStorage.setItem('accessToken', data.accessToken)
                    } else {
                        router.push('/login')
                    }
                } catch (error) {
                    console.error('토큰 갱신 실패:', error)
                    router.push('/login')
                }
            }
        }

        checkAuth()
    }, [router])

    return <Component {...pageProps} />
}

export default MyApp