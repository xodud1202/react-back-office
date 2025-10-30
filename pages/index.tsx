// pages/index.tsx
import {useRouter} from 'next/router'
import {useEffect} from "react";

import {CheckAccessTokenPageProps, getCheckAccessTokenServerSideProps} from '@/utils/serverSideProps'

export const getServerSideProps = getCheckAccessTokenServerSideProps;

// 화면 생성
export default function Home({ data }: CheckAccessTokenPageProps) {
  const router = useRouter()

  useEffect(() => {
    console.log('data:', data);
    if (data && data.result === 'OK') {
      router.replace('/main')
    } else {
      localStorage.removeItem('refreshToken')
      router.replace('/login')
    }
  }, [data, router]) // 의존성 배열 설정 필수

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white shadow rounded text-center">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
          <p>잠시만 기다려 주세요.</p>
        </div>
      </div>
  )
}