import { redirect } from 'next/navigation';
import { getServerSession } from '@/utils/server/auth';

/**
 * 루트 경로 진입 시 인증 상태에 따라 적절한 화면으로 이동합니다.
 * @returns 리다이렉트만 수행하므로 렌더링 결과는 없습니다.
 */
export default async function HomePage() {
  const session = await getServerSession();
  redirect(session ? '/main' : '/login');
}
