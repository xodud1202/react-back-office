import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@/store/common';

interface ServerAuthContext {
  accessToken: string | null;
  usrNo: string | null;
  cookieHeader: string;
}

interface RefreshTokenResponse {
  accessToken?: string;
  usrNo?: string | number;
}

interface ServerSession {
  accessToken: string;
  usrNo: string;
  user: User;
}

/**
 * 백엔드 기본 URL을 계산합니다.
 * @returns 서버 호출에 사용할 백엔드 URL입니다.
 */
const getBackendUrl = async (): Promise<string> => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  return host ? `${protocol}://${host}` : '';
};

/**
 * 현재 요청의 쿠키를 문자열 헤더 형식으로 직렬화합니다.
 * @returns 백엔드 전달용 Cookie 헤더 문자열입니다.
 */
const getCookieHeader = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
};

/**
 * accessToken이 없을 때 refresh 토큰 기반 재발급을 시도합니다.
 * @param cookieHeader 현재 요청 쿠키 헤더입니다.
 * @returns 재발급된 accessToken 및 사용자 번호입니다.
 */
const refreshServerAccessToken = async (cookieHeader: string): Promise<RefreshTokenResponse | null> => {
  if (!cookieHeader) {
    return null;
  }

  const backendUrl = await getBackendUrl();
  if (!backendUrl) {
    return null;
  }

  try {
    const response = await fetch(`${backendUrl}/api/token/backoffice/access-token`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as RefreshTokenResponse;
  } catch {
    return null;
  }
};

/**
 * 서버 요청에서 사용할 인증 컨텍스트를 구성합니다.
 * @returns accessToken, 사용자 번호, 쿠키 헤더입니다.
 */
const getServerAuthContext = async (): Promise<ServerAuthContext> => {
  const cookieStore = await cookies();
  const cookieHeader = await getCookieHeader();
  const accessToken = cookieStore.get('accessToken')?.value ?? null;
  const usrNo = cookieStore.get('usrNo')?.value ?? null;

  // accessToken이 없으면 refresh 토큰 기반 재발급을 시도합니다.
  if (!accessToken) {
    const refreshed = await refreshServerAccessToken(cookieHeader);
    if (refreshed?.accessToken) {
      return {
        accessToken: refreshed.accessToken,
        usrNo: refreshed.usrNo ? String(refreshed.usrNo) : usrNo,
        cookieHeader,
      };
    }
  }

  return {
    accessToken,
    usrNo,
    cookieHeader,
  };
};

/**
 * 서버에서 인증 헤더를 포함한 백엔드 요청을 수행합니다.
 * @param path `/api` 기준 백엔드 경로입니다.
 * @returns fetch 응답입니다.
 */
const fetchServerApi = async (path: string): Promise<Response | null> => {
  const backendUrl = await getBackendUrl();
  if (!backendUrl) {
    return null;
  }

  const authContext = await getServerAuthContext();
  const requestHeaders: Record<string, string> = {};

  // refresh 토큰 쿠키를 포함해 백엔드 인증 체인을 유지합니다.
  if (authContext.cookieHeader) {
    requestHeaders.Cookie = authContext.cookieHeader;
  }
  if (authContext.accessToken) {
    requestHeaders.Authorization = `Bearer ${authContext.accessToken}`;
  }

  try {
    return await fetch(`${backendUrl}${path}`, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store',
    });
  } catch {
    return null;
  }
};

/**
 * 서버에서 배열 응답을 공통 조회합니다.
 * @param path `/api` 기준 백엔드 경로입니다.
 * @returns 배열 응답이며 실패 시 빈 배열입니다.
 */
export const fetchServerList = async <T,>(path: string): Promise<T[]> => {
  const response = await fetchServerApi(path);
  if (!response?.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data as T[] : [];
};

/**
 * 서버에서 단건 JSON 응답을 공통 조회합니다.
 * @param path `/api` 기준 백엔드 경로입니다.
 * @returns 단건 응답이며 실패 시 null입니다.
 */
export const fetchServerObject = async <T,>(path: string): Promise<T | null> => {
  const response = await fetchServerApi(path);
  if (!response?.ok) {
    return null;
  }
  return (await response.json()) as T;
};

/**
 * 현재 요청의 로그인 세션을 조회합니다.
 * @returns 유효한 세션 정보이며 실패 시 null입니다.
 */
export const getServerSession = async (): Promise<ServerSession | null> => {
  const authContext = await getServerAuthContext();
  if (!authContext.accessToken || !authContext.usrNo) {
    return null;
  }

  const user = await fetchServerObject<User>(`/api/backoffice/user/info?usrNo=${encodeURIComponent(authContext.usrNo)}`);
  if (!user) {
    return null;
  }

  return {
    accessToken: authContext.accessToken,
    usrNo: authContext.usrNo,
    user,
  };
};

/**
 * 보호된 화면에서 반드시 필요한 로그인 세션을 조회합니다.
 * @returns 유효한 서버 세션입니다.
 */
export const getRequiredServerSession = async (): Promise<ServerSession> => {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
};
