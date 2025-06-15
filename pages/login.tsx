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
    try {
      // Next.js API 라우트로 요청 보내기
      const response = await fetch('/api/backend-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });
      const data = await response.json();

      console.log('data');
      console.log(data.id);

      if (!response.ok) {
        setError(data.message || '로그인에 실패했습니다.')
        return
      }

      // 응답에 포함된 JWT 토큰 받기
      const token = data.token as string
      // 로컬 스토리지에 JWT 저장
      localStorage.setItem('jwt', token)

      // 로그인 성공 후 대시보드로 이동
      await router.replace('/')
    } catch (err) {
      console.error(err)
      setError('네트워크 오류가 발생했습니다.')
    }
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
