import {NextRouter} from 'next/router';

let router: NextRouter;

export const setRouter = (nextRouter: NextRouter) => {
    router = nextRouter;
};

export async function apiRequest(url: string, options: RequestInit = {}) {
    // AccessToken 가져오기
    const accessToken = localStorage.getItem('accessToken');

    // 헤더에 토큰 추가
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        ...options.headers
    };

    // API 요청
    let response = await fetch(url, { ...options, headers });

    // 401 에러(인증 실패)인 경우 토큰 갱신 시도
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();

        // 토큰 갱신에 성공한 경우 원래 요청 재시도
        if (refreshed) {
            const newAccessToken = localStorage.getItem('accessToken');
            headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, { ...options, headers });
        } else {
            // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userInfo');
            if (router) router.push('/login');
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
    }

    return response;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');

    // RefreshToken이 없으면 갱신 불가
    if (!refreshToken) return false;

    try {
        const requestUri = '/backoffice/refresh-token';
        const requestParam = { refreshToken };

        const response = await fetch('/api/backend-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestUri, requestParam })
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (data.result === 'OK') {
            localStorage.setItem('accessToken', data.accessToken);
            return true;
        }

        return false;
    } catch (error) {
        console.error('토큰 갱신 실패:', error);
        return false;
    }
}