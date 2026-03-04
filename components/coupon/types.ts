// 쿠폰 목록 행 정보를 정의합니다.
export interface CouponItem {
  // 쿠폰 번호입니다.
  cpnNo: number;
  // 쿠폰명입니다.
  cpnNm: string;
  // 쿠폰 상태명입니다.
  cpnStatNm: string;
  // 쿠폰 종류명입니다.
  cpnGbNm: string;
  // 쿠폰 타겟명입니다.
  cpnTargetNm: string;
  // 다운로드 시작일시(YYYY-MM-DD HH24)입니다.
  cpnDownStartDt: string;
  // 다운로드 종료일시(YYYY-MM-DD HH24)입니다.
  cpnDownEndDt: string;
  // 고객 다운로드 가능 여부입니다.
  cpnDownAbleYn: string;
  // 상태 중지 일시(YYYY-MM-DD HH24)입니다.
  statStopDt: string;
}

// 쿠폰 조회 조건을 정의합니다.
export interface CouponSearchParams {
  // 검색 구분입니다.
  searchGb: string;
  // 검색어입니다.
  searchValue: string;
  // 기간 검색 구분입니다.
  dateGb: string;
  // 조회 시작일입니다.
  searchStartDt: string;
  // 조회 종료일입니다.
  searchEndDt: string;
  // 쿠폰 상태 코드입니다.
  cpnStatCd: string;
  // 쿠폰 종류 코드입니다.
  cpnGbCd: string;
  // 쿠폰 타겟 코드입니다.
  cpnTargetCd: string;
  // 고객 다운로드 가능 여부입니다.
  cpnDownAbleYn: string;
}

// 쿠폰 목록 응답을 정의합니다.
export interface CouponListResponse {
  // 쿠폰 목록입니다.
  list: CouponItem[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 쿠폰 조회 기본값을 정의합니다.
export const DEFAULT_COUPON_SEARCH_PARAMS: CouponSearchParams = {
  searchGb: 'CPN_NO',
  searchValue: '',
  dateGb: 'REG_DT',
  searchStartDt: '',
  searchEndDt: '',
  cpnStatCd: '',
  cpnGbCd: '',
  cpnTargetCd: '',
  cpnDownAbleYn: '',
};
