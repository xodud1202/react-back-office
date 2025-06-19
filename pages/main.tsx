// pages/main.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { setupTokenRefresh } from '../utils/tokenRefresh'

interface UserInfo {
  usrNo: number
  loginId: string
  userNm: string
  usrGradeCd: string
  accessDt: string
  jwtToken: string
}

export default function Main() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null)
  const [remainingTime, setRemainingTime] = useState<string>('')

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

  // 토큰 유효성 검증 및 만료 시간 계산
  function getTokenExpiryDate(token: string): Date | null {
    try {
      const decodedToken = decodeJwtToken(token);
      if (!decodedToken || !decodedToken.exp) return null;

      // exp는 초 단위이므로 1000을 곱해 밀리초로 변환
      return new Date(decodedToken.exp * 1000);
    } catch (error) {
      console.error('토큰 만료 시간 계산 실패:', error);
      return null;
    }
  }

  // 남은 시간 계산 함수
  function calculateRemainingTime(expiryDate: Date): string {
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return '만료됨';

    const diffSec = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;

    return `${minutes}분 ${seconds}초`;
  }

  // 토큰 및 사용자 정보 확인
  useEffect(() => {
    // 서버 사이드 렌더링 시에는 실행하지 않음
    if (typeof window === 'undefined') return;

    // 토큰 갱신 설정
    setupTokenRefresh();

    const checkTokenAndUserInfo = () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userInfoStr = localStorage.getItem('userInfo');

        if (!accessToken || !userInfoStr) {
          // 토큰이나 사용자 정보가 없으면 로그인 페이지로 이동
          router.replace('/login');
          return;
        }

        // 토큰 만료 시간 계산
        const expiry = getTokenExpiryDate(accessToken);
        if (!expiry || expiry <= new Date()) {
          // 토큰이 만료되었으면 로그인 페이지로 이동
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userInfo');
          router.replace('/login');
          return;
        }

        // 사용자 정보 설정
        setUserInfo(JSON.parse(userInfoStr));
        setTokenExpiry(expiry);
      } catch (error) {
        console.error('사용자 정보 확인 중 오류 발생:', error);
        router.replace('/login');
      }
    };

    checkTokenAndUserInfo();
  }, [router]);

  // 남은 시간 업데이트 타이머
  useEffect(() => {
    if (!tokenExpiry) return;

    // 초기 남은 시간 계산
    setRemainingTime(calculateRemainingTime(tokenExpiry));

    // 1초마다 남은 시간 업데이트
    const timer = setInterval(() => {
      const remaining = calculateRemainingTime(tokenExpiry);
      setRemainingTime(remaining);

      // 토큰이 만료되면 로그인 페이지로 이동
      if (remaining === '만료됨') {
        clearInterval(timer);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        router.replace('/login');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tokenExpiry, router]);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    router.replace('/login');
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white shadow rounded text-center">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
          <p>사용자 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">메인 대시보드</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">사용자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">이름</p>
                <p className="text-lg font-medium">{userInfo.userNm}</p>
              </div>
              <div>
                <p className="text-gray-600">계정 ID</p>
                <p className="text-lg font-medium">{userInfo.loginId}</p>
              </div>
              <div>
                <p className="text-gray-600">사용자 등급</p>
                <p className="text-lg font-medium">{userInfo.usrGradeCd}</p>
              </div>
              <div>
                <p className="text-gray-600">마지막 접속 일시</p>
                <p className="text-lg font-medium">
                  {userInfo.accessDt ? new Date(userInfo.accessDt).toLocaleString('ko-KR') : '정보 없음'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">토큰 정보</h2>
            <div>
              <p className="text-gray-600">액세스 토큰 만료까지 남은 시간</p>
              <p className="text-2xl font-bold text-yellow-600">{remainingTime}</p>
              {tokenExpiry && (
                <p className="text-sm text-gray-500 mt-2">
                  만료 일시: {tokenExpiry.toLocaleString('ko-KR')}
                </p>
              )}
            </div>
            <div>
              <button
                onClick={() => console.log('버튼 클릭됨')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                이벤트왜안탐
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}