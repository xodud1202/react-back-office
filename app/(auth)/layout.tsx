import AppProviders from '@/app/providers';

/**
 * 인증 화면 전용 레이아웃을 렌더링합니다.
 * @param props 자식 노드입니다.
 * @returns 로그인 화면용 Provider 래퍼입니다.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppProviders initialUser={null}>{children}</AppProviders>;
}
