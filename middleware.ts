import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const STATIC_FILE_PATTERN = /\.[^/]+$/;

/**
 * 요청 경로가 인증 없이 허용되는 공개 경로인지 확인합니다.
 * @param pathname 현재 요청 경로입니다.
 * @returns 공개 경로 여부입니다.
 */
const isPublicPath = (pathname: string): boolean => PUBLIC_PATHS.some((path) => pathname === path);

/**
 * 관리자 라우트 접근 전 기본 인증 쿠키 존재 여부를 검사하는 엣지 미들웨어입니다.
 * @param request 현재 요청입니다.
 * @returns 리다이렉트 또는 다음 단계 응답입니다.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자산과 API 요청은 인증 미들웨어에서 제외합니다.
  if (
    pathname.startsWith('/api')
    || pathname.startsWith('/_next')
    || pathname.startsWith('/assets')
    || pathname.startsWith('/favicon')
    || STATIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 실제 인증 유지에 사용되는 accessToken/refreshToken 쿠키만 보호 경로 통과 기준으로 사용합니다.
  const hasAuthCookie = Boolean(
    request.cookies.get('accessToken')?.value || request.cookies.get('refreshToken')?.value,
  );
  if (!hasAuthCookie && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * 미들웨어 적용 경로를 정의합니다.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
