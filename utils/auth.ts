import { getCookie } from 'cookies-next';
import { store } from '@/store/setting/store';

// 로그인 사용자 번호를 쿠키에서 조회합니다.
export const getLoginUsrNo = (): number | null => {
  const cookieValue = getCookie('usrNo', { path: '/' });
  if (typeof cookieValue === 'string' && cookieValue.trim() !== '') {
    const parsed = Number(cookieValue);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

// 로그인 사용자 번호를 확인하고 없으면 로그인 페이지로 이동합니다.
export const requireLoginUsrNo = (onFail?: (message: string) => void): number | null => {
  const stateUsrNo = store.getState().auth?.user?.usrNo;
  const usrNo = typeof stateUsrNo === 'number' && !Number.isNaN(stateUsrNo) ? stateUsrNo : getLoginUsrNo();
  if (usrNo != null) {
    return usrNo;
  }
  const message = '로그인 사용자 정보를 확인할 수 없습니다.';
  if (onFail) {
    onFail(message);
  } else if (typeof window !== 'undefined') {
    alert(message);
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return null;
};
