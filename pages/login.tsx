import {useEffect, useState} from 'react'
import Image from 'next/image'
import {useRouter} from 'next/router'

export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 토큰 체크 및 리다이렉트 로직
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

    // 토큰 체크 및 리다이렉트
    const checkTokenAndRedirect = async () => {
      try {
        // 이제 안전하게 localStorage에 접근 가능
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')

        console.log('로그인 페이지 토큰 체크:');
        console.log('accessToken:', accessToken ? '존재함' : '없음');
        console.log('refreshToken:', refreshToken ? '존재함' : '없음');

        // accessToken이 있고 유효한 경우 메인 페이지로 리다이렉트
        if (accessToken && isTokenValid(accessToken)) {
          router.replace('/main')
          return
        }

        // accessToken이 없거나 만료됐지만 refreshToken이 있는 경우 토큰 갱신 시도
        if (refreshToken) {
          const requestUri = '/token/backoffice/refresh-token'
          const requestParam = { refreshToken }

          const response = await fetch('/api/backend-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestUri, requestParam })
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

        // 토큰이 없거나 갱신에 실패한 경우 로그인 페이지에 머무름
        // 이미 로그인 페이지이므로 추가 작업 필요 없음
      } catch (error) {
        console.error('토큰 검증 중 오류 발생:', error)
        // 오류 발생 시 로그인 페이지에 머무름
      }
    }

    // 페이지 로드 시 토큰 체크 실행
    checkTokenAndRedirect()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const requestUri = '/backoffice/login';
    const requestParam = {
      loginId: id,
      pwd: password,
      rememberMe: rememberMe
    };

    const header = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({requestUri, requestParam})
    };

    // 로그인 처리
    const res = await fetch('/api/backend-api', header);
    const body = await res.json();

    if (!res.ok) {
      setError(body.resultMsg || '로그인 실패')
      return;
    }

    // Access Token 저장
    localStorage.setItem('accessToken', body.accessToken);
    localStorage.setItem('userInfo', JSON.stringify(body.userInfo));

    // 로그인 유지를 선택한 경우 Refresh Token 저장
    if (rememberMe && body.refreshToken) {
      localStorage.setItem('refreshToken', body.refreshToken);
    }

    console.log('localStorage.getItem()');
    console.log(localStorage.getItem('accessToken'));
    console.log(localStorage.getItem('refreshToken'));
    console.log(localStorage.getItem('userInfo'));

    await router.replace('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        {/* 로고 */}
        <div className="flex justify-center">
          <Image
            src="/images/common/project-logo-512x125.png"
            alt="Project Logo"
            width={256}
            height={62.5}
            className="object-contain"
          />
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">
                ID
              </label>
              <input
                id="id"
                name="id"
                type="id"
                required
                value={id}
                onChange={e => setId(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="LOGIN ID"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          {/* 에러 메시지를 여기에 배치 */}
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                비밀번호를 잊으셨나요?
              </a>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-blue">로그인</button>
          </div>
        </form>
      </div>
    </div>
  )
}