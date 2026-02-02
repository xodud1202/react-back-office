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
};

// 리프레시 시에 사용할 loginId를 쿠키에서 찾습니다.
const getLoginIdForRefresh = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const loginId = getCookie('loginId', { path: '/' });
  return typeof loginId === 'string' ? loginId : null;
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

  const loginId = getLoginIdForRefresh();
  const config = loginId ? { params: { loginId } } : undefined;

  refreshPromise = refreshClient
    .get('/token/backoffice/access-token', config)
    .then((response) => {
      const nextToken = response.data?.accessToken;
      if (!nextToken) {
        throw new Error('새로운 Access Token을 받아올 수 없습니다.');
      }
      setAccessToken(nextToken);
      return nextToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// 저장된 토큰 없으면 refresh 를 시도해 토큰을 확보합니다.
export const ensureAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const storedToken = getCookieAccessToken();
  if (storedToken) {
    cachedAccessToken = storedToken;
    return cachedAccessToken;
  }
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
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
