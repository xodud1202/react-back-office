// /utils/axios/axios.ts

import axios, {AxiosHeaders, AxiosRequestConfig, AxiosResponse} from 'axios';

// 예외 처리할 URL 목록
const EXCLUDE_TOKEN_URLS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: '/api', // 필요에 따라 환경변수로 세팅
  timeout: 10000,
});

// Request Interceptor: 토큰 부착 & 예외 URL 처리
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isExcluded = EXCLUDE_TOKEN_URLS.some(exclude => url.startsWith(exclude));
    if (!isExcluded) {
      const token = localStorage.getItem('accessToken');
      // headers가 없으면 빈 객체 생성 후 할당하기
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      // (최신 axios에서는 headers가 AxiosHeaders 인스턴스인 경우가 있음)
      if (token) {
        // 아래 두가지 방식 중 프로젝트에 맞게 사용
        if (typeof config.headers.set === "function") {
          // AxiosHeaders 클래스일 때
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          // 일반 object일 때
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: 토큰 만료 시 자동 갱신 처리
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    const originalRequest = error.config as AxiosRequestConfig;
    const url = originalRequest.url || '';
    const isExcluded = EXCLUDE_TOKEN_URLS.some(exclude => url.startsWith(exclude));
    // 401 에러 & 예외 URL 제외
    if (!isExcluded && error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const newAccessToken = res.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest); // 재요청
      } catch (refreshError) {
        // refresh 실패 처리 (로그아웃 등)
        // window.location.href = '/login'; 등
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;