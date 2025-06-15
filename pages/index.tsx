// pages/index.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">백오피스 홈</h1>
        <Link
          href="/login"
          className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          로그인하러 가기
        </Link>
      </div>
    </div>
  )
}
