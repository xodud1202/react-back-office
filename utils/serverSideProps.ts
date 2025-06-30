// utils/serverSideProps.ts
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Cookies from 'universal-cookie';

// API 응답 타입 정의
export interface LoginTokenCheckResponse {
    result?: string;
    resultMsg?: string;
    accessToken?: string;
}

// Props 타입 정의
export interface CheckAccessTokenPageProps {
    data: LoginTokenCheckResponse | null;
    initialToken: string | null;
    cookies?: string;
}

// 공통 getServerSideProps 함수
export const getCheckAccessTokenServerSideProps: GetServerSideProps<CheckAccessTokenPageProps> = async (
    ctx: GetServerSidePropsContext
) => {
    const cookieHeader = ctx.req.headers.cookie || '';
    const cookies = new Cookies(cookieHeader);
    const accessToken = cookies.get<string>('accessToken') ?? null;
    const refreshToken = cookies.get<string>('refreshToken') ?? null;
    const loginId = cookies.get<string>('loginId') ?? null;
    let data: LoginTokenCheckResponse = {};

    if (accessToken) {
        const requestParam = {
            accessToken,
            refreshToken,
            loginId,
            method: 'GET',
        };

        // 서버 사이드에서 API 호출 시 절대 URL 필요
        const protocol = ctx.req.headers['x-forwarded-proto'] || 'http';
        const host = ctx.req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const response = await fetch(`${baseUrl}/api/backend-api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestUri: `/token/backoffice/access-token?accessToken=${accessToken}&refreshToken=${refreshToken}&loginId=${loginId}`,
                requestParam: requestParam
            })
        });

        if (response.ok) {
            data = await response.json();
            if (data.result === 'OK') {
                cookies.set('accessToken', data.accessToken, { path: '/' });
            } else {
                cookies.remove('accessToken', { path: '/' });
                cookies.remove('loginId', { path: '/' });
            }
        }
    }

    // 반드시 객체 형태로 반환!
    return {
        props: {
            data,
            initialToken: accessToken,
            cookies: cookieHeader
        }
    };
};