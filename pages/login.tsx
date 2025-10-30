import {useEffect, useState} from 'react'
import Image from 'next/image'
import {useRouter} from 'next/router'
import api from '@/utils/axios/axios';
import Cookies from 'universal-cookie'
import { useAppDispatch, useAppSelector } from '@/utils/hooks/redux';
import { loginSuccess, logout } from '@/store/loginUser/loginUser';
import {CheckAccessTokenPageProps, getCheckAccessTokenServerSideProps} from "../utils/serverSideProps";

export const getServerSideProps = getCheckAccessTokenServerSideProps;

export default function Login({ data }: CheckAccessTokenPageProps) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 토큰 체크 및 리다이렉트 로직
  useEffect(() => {
    if (data && data.result === 'OK') {
      router.replace('/main')
    } else {
      // 로그인이 안되어있다는 말은, REFRESH_TOKEN을 삭제해야한다는 말과 동일함.
      const cookies = new Cookies();
      cookies.remove('loginId', { path: '/' });
      cookies.remove('usrNm', { path: '/' });
      cookies.remove('refreshToken', { path: '/' });
      cookies.remove('accessToken', { path: '/' });
    }
  }, [data, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // const requestUri = '/backoffice/login';

    //
    // const header = {
    //   method: 'POST',
    //   headers: {'Content-Type': 'application/json'},
    //   body: JSON.stringify({requestUri, requestParam})
    // };
    //
    // // 로그인 처리
    // const res = await fetch('/api/backend-api', header);
    // const body = await res.json();
    //
    // if (!res.ok) {
    //   setError(body.resultMsg || '로그인 실패')
    //   return;
    // }

    const requestParam = {
      method: 'POST',
      loginId: id,
      pwd: password,
      rememberMe: rememberMe
    };

    const response = await api.post('/api/backoffice/login', requestParam);
    const body = response.data;

    // 쿠키 인스턴스 생성
    const cookies = new Cookies();

    // 쿠키 옵션 설정
    const isSecure = process.env.IS_SECURE === 'TRUE';
    const cookieOptions = {
      path: '/',
      secure: isSecure,
      sameSite: 'strict' as const, // CSRF 방지
      maxAge: 30 * 60 // 30분 (초 단위)
    };

    cookies.set('accessToken', body.accessToken, cookieOptions);
    console.log('accessToken:', body.accessToken);

    // 로그인 정보 및 refreshToken은 30일 처리 > accessToken 만료시 삭제함.

    const userData = {
      usrNo: body.userInfo.usrNo,
      userNm: body.userInfo.usrNm,
      loginId: body.userInfo.loginId,
      hPhoneNo: body.userInfo.hPhoneNo,
      email: body.userInfo.email,
      usrGradeCd: body.userInfo.usrGradeCd,
      usrStatCd: body.userInfo.usrStatCd
    };

    dispatch(loginSuccess(userData));

    // cookies.set('loginId', body.userInfo.loginId, cookieOptions);
    // cookies.set('usrNm', body.userInfo.usrNm, cookieOptions);

    // 로그인 유지를 선택한 경우 Refresh Token 저장
    if (rememberMe && body.refreshToken) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30;   // 30일
      cookies.set('refreshToken', body.refreshToken, cookieOptions);
    }

    console.log('loginSuccess:', body.userInfo);

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

          {/* 에러 메시지 */}
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