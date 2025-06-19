// pages/index.tsx
import {useEffect} from 'react'
import {useRouter} from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 서버 사이드 렌더링 시에는 실행하지 않음
    if (typeof window === 'undefined') return

    // JWT 토큰 디코딩 함수
    function decodeJwtToken(token: string) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (error) {
        console.error('JWT 토큰 디코딩 실패:', error);
        return null;
      }
    }

    // JWT 토큰 유효성 검증 함수
    function isTokenValid(token: string) {
      try {
        const decodedToken = decodeJwtToken(token);
        if (!decodedToken) return false;

        // 토큰의 만료 시간(exp)과 현재 시간 비교
        const currentTime = Date.now() / 1000;
        return decodedToken.exp > currentTime;
      } catch (error) {
        console.error('토큰 유효성 검증 실패:', error);
        return false;
      }
    }

    // 수정된 checkTokenAndRedirect 함수
    const checkTokenAndRedirect = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')

        // accessToken이 있고 유효한 경우
        if (accessToken && isTokenValid(accessToken)) {
          router.replace('/main')
          return
        }

        // accessToken이 없거나 만료된 경우, refreshToken으로 갱신 시도
        if (refreshToken) {
          const requestUri = '/token/backoffice/refresh-token'
          const requestParam = {refreshToken}

          const response = await fetch('/api/backend-api', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({requestUri, requestParam})
          })

          if (response.ok) {
            const data = await response.json()
            if (data.result === 'OK' && data.accessToken) {
              // 새로운 accessToken 저장
              localStorage.setItem('accessToken', data.accessToken)
              router.replace('/main')
              return
            }
          }
        }

        // 토큰이 없거나 갱신에 실패한 경우 로그인 페이지로 이동
        router.replace('/login')
      } catch (error) {
        console.error('토큰 검증 중 오류 발생:', error)
        router.replace('/login')
      }
    }

    checkTokenAndRedirect()
  }, [router])

  // 리다이렉션 중에 표시할 로딩 상태
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow rounded text-center">
        <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
        <p>잠시만 기다려 주세요.</p>
      </div>
    </div>
  )
}