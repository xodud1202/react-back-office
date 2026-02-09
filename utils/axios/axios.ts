import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';

const EXCLUDE_TOKEN_URLS = [
  '/api/backoffice/login',
  '/api/token/backoffice/access-token',
  '/api/backoffice/logout',
];

// 브라우저에 저장할 accessToken 쿠키 설정
const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 60, // 30 minutes
};

// 브라우저에 저장할 사용자 식별 쿠키 설정
const USER_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 60, // 60 days
};

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let cachedAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

// 로컬 쿠키에서 accessToken을 꺼내 옵니다.
const getCookieAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const cookieValue = getCookie('accessToken', { path: '/' });
  return typeof cookieValue === 'string' ? cookieValue : null;
};

// axios 인스턴스가 사용할 accessToken을 갱신하고 쿠키에도 반영합니다.
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    setCookie('accessToken', token, COOKIE_OPTIONS);
  } else {
    deleteCookie('accessToken', { path: '/' });
  }
};

// 모든 인증 정보를 지우고 쿠키를 제거합니다.
export const clearAuthData = () => {
  setAccessToken(null);
  refreshPromise = null;
  if (typeof window === 'undefined') {
    return;
  }
  deleteCookie('loginId', { path: '/' });
  deleteCookie('userNm', { path: '/' });
  deleteCookie('usrNo', { path: '/' });
  deleteCookie('usrGradeCd', { path: '/' });
};

// 요청에 Authorization 헤더를 붙이는 헬퍼
const attachAuthHeader = (config: AxiosRequestConfig, token: string) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (typeof (config.headers as any).set === 'function') {
    (config.headers as any).set('Authorization', `Bearer ${token}`);
  } else {
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
};

// refresh 토큰을 사용하여 accessToken을 갱신합니다.
export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  // 저장된 accessToken이 있으면 서버에서 만료/정합성 검증에 활용합니다.
  const storedAccessToken = cachedAccessToken ?? getCookieAccessToken();
  const config = storedAccessToken
    ? {
        headers: {
          Authorization: `Bearer ${storedAccessToken}`,
        },
      }
    : undefined;

  refreshPromise = refreshClient
    .get('/token/backoffice/access-token', config)
    .then((response) => {
      const nextToken = response.data?.accessToken;
      if (!nextToken) {
        throw new Error('새로운 Access Token을 받아올 수 없습니다.');
      }
      setAccessToken(nextToken);
      // 서버가 내려준 사용자 번호를 쿠키에 동기화합니다.
      const usrNo = response.data?.usrNo;
      if (usrNo !== undefined && usrNo !== null && `${usrNo}`.trim() !== '') {
        setCookie('usrNo', `${usrNo}`, USER_COOKIE_OPTIONS);
      }
      return nextToken;
    })
    .catch((error) => {
      const status = error?.response?.status;
      // refresh가 401/403으로 실패하면 로그인 화면으로 이동합니다.
      if (status === 401 || status === 403) {
        clearAuthData();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// 저장된 토큰 없으면 refresh 를 시도해 토큰을 확보합니다.
export const ensureAccessToken = async (): Promise<string | null> => {
  // 메모리 캐시 토큰이 있으면 우선 사용합니다.
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  // 브라우저 쿠키에 저장된 accessToken이 있으면 우선 사용합니다.
  const storedToken = getCookieAccessToken();
  if (storedToken) {
    cachedAccessToken = storedToken;
    return cachedAccessToken;
  }
  // accessToken이 없을 때만 refresh 토큰으로 재발급을 시도합니다.
  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
};

api.interceptors.request.use(
  async (config) => {
    const url = config.url || '';
    const isExcluded = EXCLUDE_TOKEN_URLS.some((exclude) => url.startsWith(exclude));
    if (!isExcluded) {
      const token = cachedAccessToken ?? (await ensureAccessToken());
      if (token) {
        attachAuthHeader(config, token);
      }
    }
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url || '';
    const isExcluded = EXCLUDE_TOKEN_URLS.some((exclude) => url.startsWith(exclude));
    if (!isExcluded && error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          attachAuthHeader(originalRequest, token);
          return api(originalRequest);
        }
        throw new Error('Access Token을 갱신할 수 없습니다.');
      } catch (refreshError) {
        clearAuthData();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
