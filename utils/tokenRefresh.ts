// utils/tokenRefresh.ts
let tokenRefreshTimer: NodeJS.Timeout | null = null;

// 사용자 활동 감지 및 토큰 갱신 설정
export function setupTokenRefresh() {
    // 이미 설정되어 있으면 중복 설정 방지
    if (typeof window === 'undefined' || window['tokenRefreshSetup']) return;
    window['tokenRefreshSetup'] = true;

    // 활동 이벤트 목록
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // 각 이벤트에 리스너 추가
    events.forEach(event => {
        document.addEventListener(event, resetTokenTimer, false);
    });

    // 초기 타이머 설정
    resetTokenTimer();
}

// 토큰 타이머 재설정
function resetTokenTimer() {
    // 기존 타이머 제거
    if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);

    // AccessToken 만료 시간보다 약간 짧게 설정 (예: 14분)
    tokenRefreshTimer = setTimeout(refreshTokenSilently, 14 * 60 * 1000);
}

// 백그라운드에서 토큰 갱신
async function refreshTokenSilently() {
    try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        // 현재 페이지 URL 가져오기
        const currentPath = window.location.pathname;

        // 로그인 페이지가 아닌 경우에만 토큰 갱신 시도
        if (currentPath !== '/login') {
            const requestUri = '/backoffice/refresh-token';
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) return;

            const requestParam = { refreshToken };

            const response = await fetch('/api/backend-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestUri, requestParam })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.result === 'OK') {
                    localStorage.setItem('accessToken', data.accessToken);
                    resetTokenTimer(); // 타이머 재설정
                }
            }
        }
    } catch (error) {
        console.error('토큰 갱신 실패:', error);
    }
}