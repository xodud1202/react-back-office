import type { GetServerSidePropsContext } from 'next';
import { getCookie } from 'cookies-next';

interface SSRRequestConfig {
  backendUrl: string;
  headers: Record<string, string>;
}

// SSR에서 공통 요청 헤더와 백엔드 URL을 구성합니다.
export const buildSSRRequestConfig = (ctx: GetServerSidePropsContext): SSRRequestConfig => {
  const host = ctx.req.headers.host;
  const protocol = (ctx.req.headers['x-forwarded-proto'] as string) || 'http';
  const backendUrl = process.env.BACKEND_URL || (host ? `${protocol}://${host}` : '');
  const accessToken = (getCookie('accessToken', ctx) as string) ?? '';
  const cookieHeader = ctx.req.headers.cookie;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return { backendUrl, headers };
};

// SSR에서 공통 API를 조회해 배열 형태로 반환합니다.
export const fetchSSRList = async <T,>(ctx: GetServerSidePropsContext, url: string): Promise<T[]> => {
  const { backendUrl, headers } = buildSSRRequestConfig(ctx);
  if (!backendUrl) {
    return [];
  }
  try {
    const response = await fetch(`${backendUrl}${url}`, { headers });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};
