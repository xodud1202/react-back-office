// utils/serverSideProps.ts
import {GetServerSideProps, GetServerSidePropsContext} from 'next';
import {getCookie} from 'cookies-next';

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
}

// 공통 getServerSideProps 함수
export const getCheckAccessTokenServerSideProps: GetServerSideProps<CheckAccessTokenPageProps> = async (
    ctx: GetServerSidePropsContext
) => {
    const accessToken = (await getCookie('accessToken', ctx) as string) ?? null;
    let data: LoginTokenCheckResponse = {};

    return {
        props: {
            data,
            initialToken: accessToken,
        }
    };
};
