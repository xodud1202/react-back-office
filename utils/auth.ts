import { getCookie } from 'cookies-next';

// 로그인 사용자 번호를 쿠키에서 조회합니다.
export const getLoginUsrNo = (): number | null => {
  const cookieValue = getCookie('usrNo', { path: '/' });
  if (typeof cookieValue === 'string' && cookieValue.trim() !== '') {
    const parsed = Number(cookieValue);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};
