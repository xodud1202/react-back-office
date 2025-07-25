// pages/main.tsx
import {useEffect} from 'react'
import {useRouter} from 'next/router'

export default function Main() {
  const router = useRouter()

  // 토큰 및 사용자 정보 확인
  useEffect(() => {
    // 서버 사이드 렌더링 시에는 실행하지 않음
    if (typeof window === 'undefined') return;
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">메인 대시보드</h1>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">사용자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">이름</p>
                <p className="text-lg font-medium"></p>
              </div>
              <div>
                <p className="text-gray-600">계정 ID</p>
                <p className="text-lg font-medium"></p>
              </div>
              <div>
                <p className="text-gray-600">사용자 등급</p>
                <p className="text-lg font-medium"></p>
              </div>
              <div>
                <p className="text-gray-600">마지막 접속 일시</p>
                <p className="text-lg font-medium">
                  {/*{userInfo.accessDt ? new Date(userInfo.accessDt).toLocaleString('ko-KR') : '정보 없음'}*/}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">토큰 정보</h2>
            <div>
              <p className="text-gray-600">액세스 토큰 만료까지 남은 시간</p>
              <p className="text-2xl font-bold text-yellow-600">{}</p>
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