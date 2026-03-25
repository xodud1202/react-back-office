'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/setting/store';
import { loginSuccess, logout } from '@/store/loginUser/loginUser';
import type { User } from '@/store/common';

interface AppProvidersProps {
  children: React.ReactNode;
  initialUser: User | null;
}

/**
 * 서버에서 계산한 로그인 사용자 상태를 클라이언트 전역 스토어에 동기화합니다.
 * @param props 초기 사용자 정보와 자식 노드입니다.
 * @returns Redux Provider와 인증 동기화를 포함한 래퍼입니다.
 */
export default function AppProviders({ children, initialUser }: AppProvidersProps) {
  useEffect(() => {
    // 서버 인증 결과를 클라이언트 전역 스토어와 일치시킵니다.
    if (initialUser) {
      store.dispatch(loginSuccess(initialUser));
      return;
    }
    store.dispatch(logout());
  }, [initialUser]);

  return <Provider store={store}>{children}</Provider>;
}
