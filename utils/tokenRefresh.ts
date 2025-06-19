// utils/tokenRefresh.ts
let tokenRefreshTimer: NodeJS.Timeout | null = null;

declare global {
  interface Window {
    tokenRefreshSetup?: boolean;
  }
}

// JWT 토큰 디코딩 함수
function decodeJwtToken(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 토큰 디코딩 실패:', error);
    return null;
  }
}

// JWT 토큰 유효성 검증 함수
function isTokenValid(token: string) {
  try {
    const decodedToken = decodeJwtToken(token);
    if (!decodedToken) return false;

    // 토큰의 만료 시간(exp)과 현재 시간 비교
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  } catch (error) {
    console.error('토큰 유효성 검증 실패:', error);
    return false;
  }
}

// 로그인 페이지로 리다이렉트 함수
function redirectToLogin() {
  // localStorage 정보 삭제
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');

  // 로그인 페이지로 이동
  window.location.href = '/login';
}

// 토큰 갱신 함수 - 액세스 토큰 유효 여부와 상관없이 항상 새로운 토큰 발급
export async function refreshToken() {
  try {
    // 현재 페이지 URL 가져오기
    const currentPath = window.location.pathname;

    // 로그인 페이지에서는 토큰 체크 안함
    if (currentPath === '/login') return;

    const refreshToken = localStorage.getItem('refreshToken');

    // 리프레시 토큰이 없으면 로그인 페이지로 이동
    if (!refreshToken) {
      redirectToLogin();
      return;
    }

    // 리프레시 토큰으로 새 액세스 토큰 발급 시도
    const requestUri = '/token/backoffice/refresh-token';
    const requestParam = {refreshToken};

    const response = await fetch('/api/backend-api', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({requestUri, requestParam})
    });

    // 응답 처리
    if (response.ok) {
      const data = await response.json();
      if (data.result === 'OK') {
        localStorage.setItem('accessToken', data.accessToken);
        resetTokenTimer();

        // 토큰 갱신 이벤트 발생 (UI 업데이트 등에 사용 가능)
        window.dispatchEvent(new CustomEvent('tokenRefreshed', {
          detail: {accessToken: data.accessToken}
        }));

        return true;
      }
    }

    // 응답이 403 또는 401인 경우 (리프레시 토큰 만료 등)
    if (response.status === 403 || response.status === 401) {
      redirectToLogin();
      return false;
    }

    // 기타 오류 처리
    console.error('토큰 갱신 실패:', await response.text());
    return false;
  } catch (error) {
    console.error('토큰 갱신 중 오류 발생:', error);
    return false;
  }
}

// 사용자 활동 감지 및 토큰 갱신 설정
export function setupTokenRefresh() {
  // 이미 설정되어 있으면 중복 설정 방지
  if (typeof window === 'undefined' || window.tokenRefreshSetup) return;
  window.tokenRefreshSetup = true;

  // 클릭 이벤트 핸들러 (a 태그, button 태그, React Link 컴포넌트)
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const clickedElement = target.closest('a, button');

    if (clickedElement) {
      // 클릭 시 즉시 토큰 갱신 (액세스 토큰 유효 여부와 상관없이)
      refreshToken();
    }
  }, false);

  // input과 select 태그의 blur 이벤트 핸들러
  document.addEventListener('blur', (event) => {
    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
      refreshToken();
    }
  }, true); // 캡처링 단계에서 이벤트 처리

  // 초기 토큰 갱신 및 타이머 설정
  refreshToken();
}

// 토큰 타이머 재설정
function resetTokenTimer() {
  // 기존 타이머 제거
  if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);

  // AccessToken 만료 시간보다 약간 짧게 설정 (예: 25분)
  tokenRefreshTimer = setTimeout(refreshToken, 25 * 60 * 1000);
}