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

// 쿠폰 상세 정보를 정의합니다.
export interface CouponDetail {
  // 쿠폰 번호입니다.
  cpnNo: number;
  // 쿠폰명입니다.
  cpnNm: string;
  // 쿠폰 상태 코드입니다.
  cpnStatCd: string;
  // 쿠폰 종류 코드입니다.
  cpnGbCd: string;
  // 쿠폰 타겟 코드입니다.
  cpnTargetCd: string;
  // 쿠폰 할인 구분 코드입니다.
  cpnDcGbCd: string;
  // 쿠폰 할인 값입니다.
  cpnDcVal: number;
  // 다운로드 시작일시입니다.
  cpnDownStartDt?: string | null;
  // 다운로드 종료일시입니다.
  cpnDownEndDt?: string | null;
  // 사용기간 구분 코드입니다.
  cpnUseDtGb: string;
  // 다운로드 후 사용 가능 일수입니다.
  cpnUsableDt?: number | null;
  // 사용 시작일시입니다.
  cpnUseStartDt?: string | null;
  // 사용 종료일시입니다.
  cpnUseEndDt?: string | null;
  // 고객 다운로드 가능 여부입니다.
  cpnDownAbleYn: string;
  // 상태 중지 일시입니다.
  statStopDt?: string | null;
}

// 쿠폰 대상 행 정보를 정의합니다.
export interface CouponTargetRow {
  // 대상 구분 코드입니다.
  targetGbCd?: string;
  // 대상 값입니다.
  targetValue: string;
  // 대상 표시명입니다.
  targetNm?: string;
  // 브랜드 번호입니다.
  brandNo?: number;
  // 브랜드명입니다.
  brandNm?: string;
  // 상품코드입니다.
  goodsId?: string;
  // 상품명입니다.
  goodsNm?: string;
  // ERP 품번코드입니다.
  erpStyleCd?: string;
  // 기획전 번호입니다.
  exhibitionNo?: number;
  // 기획전명입니다.
  exhibitionNm?: string;
  // 카테고리 ID입니다.
  categoryId?: string;
  // 카테고리명입니다.
  categoryNm?: string;
  // 카테고리 레벨입니다.
  categoryLevel?: number;
}

// 쿠폰 대상 조회 응답을 정의합니다.
export interface CouponTargetListResponse {
  // 쿠폰 타겟 코드입니다.
  cpnTargetCd: string;
  // 적용 대상 목록입니다.
  applyList: CouponTargetRow[];
  // 제외 대상 목록입니다.
  excludeList: CouponTargetRow[];
}

// 쿠폰 저장 대상 행 정보를 정의합니다.
export interface CouponTargetSaveRow {
  // 대상 구분 코드입니다.
  targetGbCd?: string;
  // 대상 값입니다.
  targetValue: string;
}

// 쿠폰 저장 요청 본문을 정의합니다.
export interface CouponSavePayload {
  // 쿠폰 번호입니다.
  cpnNo?: number;
  // 쿠폰명입니다.
  cpnNm: string;
  // 쿠폰 상태 코드입니다.
  cpnStatCd: string;
  // 쿠폰 종류 코드입니다.
  cpnGbCd: string;
  // 쿠폰 타겟 코드입니다.
  cpnTargetCd: string;
  // 쿠폰 할인 구분 코드입니다.
  cpnDcGbCd: string;
  // 쿠폰 할인 값입니다.
  cpnDcVal: number;
  // 다운로드 시작일시입니다.
  cpnDownStartDt: string;
  // 다운로드 종료일시입니다.
  cpnDownEndDt: string;
  // 사용기간 구분 코드입니다.
  cpnUseDtGb: string;
  // 다운로드 후 사용 가능 일수입니다.
  cpnUsableDt?: number;
  // 사용 시작일시입니다.
  cpnUseStartDt?: string;
  // 사용 종료일시입니다.
  cpnUseEndDt?: string;
  // 고객 다운로드 가능 여부입니다.
  cpnDownAbleYn: string;
  // 상태 중지 일시입니다.
  statStopDt?: string;
  // 등록자 번호입니다.
  regNo?: number;
  // 수정자 번호입니다.
  udtNo?: number;
  // 적용 대상 목록입니다.
  applyTargets: CouponTargetSaveRow[];
  // 제외 대상 목록입니다.
  excludeTargets: CouponTargetSaveRow[];
}

// 쿠폰 저장 응답을 정의합니다.
export interface CouponSaveResponse {
  // 저장된 쿠폰 번호입니다.
  cpnNo: number;
  // 저장 대상 건수입니다.
  savedTargetCount: number;
  // 등록 여부입니다.
  isCreate: boolean;
}

// 쿠폰 대상 엑셀 파싱 응답을 정의합니다.
export interface CouponTargetExcelParseResponse {
  // 유효 대상 목록입니다.
  list: CouponTargetRow[];
  // 업로드 반영 건수입니다.
  uploadedCount: number;
  // 업로드 요청 건수입니다.
  requestedCount: number;
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

// 쿠폰 타겟 코드 상수를 정의합니다.
export const COUPON_TARGET_CODE = {
  // 전체 타겟 코드입니다.
  ALL: 'CPN_TARGET_99',
  // 상품 타겟 코드입니다.
  GOODS: 'CPN_TARGET_01',
  // 브랜드 타겟 코드입니다.
  BRAND: 'CPN_TARGET_04',
  // 기획전 타겟 코드입니다.
  EXHIBITION: 'CPN_TARGET_02',
  // 카테고리 타겟 코드입니다.
  CATEGORY: 'CPN_TARGET_03',
} as const;

// 쿠폰 사용기간 구분 코드 상수를 정의합니다.
export const COUPON_USE_DT_GB_CODE = {
  // 다운로드 후 기간 코드입니다.
  PERIOD: 'CPN_USE_DT_01',
  // 사용 일시 코드입니다.
  DATETIME: 'CPN_USE_DT_02',
} as const;

// 쿠폰 할인 구분 코드 상수를 정의합니다.
export const COUPON_DC_GB_CODE = {
  // 할인금액 코드입니다.
  AMOUNT: 'CPN_DC_GB_01',
  // 할인율 코드입니다.
  RATE: 'CPN_DC_GB_02',
} as const;
