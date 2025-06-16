import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/backend-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password })
    })
    const body = await res.json()

    if (!res.ok) {
      setError(body.message || '로그인 실패')
      return
    }

    const token = body.token as string
    localStorage.setItem('jwt', token)

    // 이후 axios 나 fetch 로 API 호출 시:
    // Authorization: `Bearer ${localStorage.getItem('jwt')}` 헤더를 붙이세요.

    await router.replace('/')
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
              <input id="remember_me" name="remember_me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
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
            <button
              type="submit"
              className="btn btn-blue"
            >로그인</button>
          </div>
        </form>
      </div>
    </div>
  )
}
