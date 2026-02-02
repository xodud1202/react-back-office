import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ensureAccessToken } from '@/utils/axios/axios'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    ensureAccessToken()
      .then((token) => {
        if (token) {
          router.replace('/main')
        } else {
          router.replace('/login')
        }
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow rounded text-center">
        <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
        <p>잠시만 기다려 주세요.</p>
      </div>
    </div>
  )
}
