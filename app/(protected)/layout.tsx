import AppProviders from '@/app/providers';
import AdminLayout from '@/components/AdminLayout';
import type { MenuItem } from '@/types/menu';
import { fetchServerList, getRequiredServerSession } from '@/utils/server/auth';

/**
 * 보호된 관리자 화면 공통 레이아웃을 렌더링합니다.
 * @param props 자식 노드입니다.
 * @returns 인증 사용자 기준 관리자 공통 레이아웃입니다.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getRequiredServerSession();
  const menuItems = await fetchServerList<MenuItem>('/api/admin/menu/list');

  return (
    <AppProviders initialUser={session.user}>
      <AdminLayout menuItems={menuItems} user={session.user}>
        {children}
      </AdminLayout>
    </AppProviders>
  );
}
