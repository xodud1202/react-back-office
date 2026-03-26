import { redirect } from 'next/navigation';
import LoginClientPage from '@/app/(auth)/login/LoginClientPage';
import { getServerSession } from '@/utils/server/auth';

/**
 * 로그인 페이지를 렌더링하되 이미 인증된 사용자는 메인으로 이동시킵니다.
 * @returns 인증 여부에 따른 로그인 화면 또는 리다이렉트입니다.
 */
export default async function LoginRoutePage() {
  const session = await getServerSession();
  if (session) {
    redirect('/main');
  }
  return <LoginClientPage />;
}
