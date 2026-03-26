// 주문 목록 검색 구분 타입입니다.
export type OrderSearchGb = 'ordNo' | 'goodsId';

// 주문 목록 기간 구분 타입입니다.
export type OrderDateGb = 'ORDER_DT' | 'PAY_DT';

// 주문 목록 페이지 기본 크기입니다.
export const ORDER_LIST_PAGE_SIZE = 20;

// 주문 목록 검색 조건을 정의합니다.
export interface OrderSearchParams {
  // 검색 구분입니다.
  searchGb: OrderSearchGb;
  // 검색 값입니다.
  searchValue: string;
  // 기간 구분입니다.
  dateGb: OrderDateGb;
  // 조회 시작일입니다.
  searchStartDt: string;
  // 조회 종료일입니다.
  searchEndDt: string;
  // 주문상세 상태 코드입니다.
  ordDtlStatCd: string;
  // 클레임상세 상태 코드입니다.
  chgDtlStatCd: string;
}

// 주문 목록 응답 행 정보를 정의합니다.
export interface OrderListRow {
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 주문일시입니다.
  orderDt: string;
  // 주문상세 상태 코드입니다.
  ordDtlStatCd: string;
  // 주문상세 상태명입니다.
  ordDtlStatNm: string;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 공급가 금액입니다.
  supplyAmt: number;
  // 판매가 금액입니다.
  saleAmt: number;
  // 실결제가 금액입니다.
  finalPayAmt: number;
  // 상품쿠폰 할인 금액입니다.
  goodsCouponDiscountAmt: number;
  // 장바구니쿠폰 할인 금액입니다.
  cartCouponDiscountAmt: number;
  // 포인트 사용 금액입니다.
  pointUseAmt: number;
  // 배송비 금액입니다.
  deliveryFeeAmt: number;
}

// 주문 목록 응답 구조를 정의합니다.
export interface OrderListResponse {
  // 주문 목록입니다.
  list: OrderListRow[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 주문번호 병합 표시용 그리드 행 타입입니다.
export interface OrderGridRow extends OrderListRow {
  // 주문번호 셀 병합 수입니다.
  ordNoRowSpan: number;
  // 주문번호 표시값입니다.
  ordNoDisplay: string;
}

// 날짜 입력값을 YYYY-MM-DD 형식으로 변환합니다.
export const formatOrderSearchDate = (date: Date): string => {
  // 월과 일을 두 자리 문자열로 맞춥니다.
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 주문 목록 기본 검색 조건을 생성합니다.
export const createDefaultOrderSearchParams = (): OrderSearchParams => {
  // 오늘과 최근 3개월 시작일을 계산합니다.
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 3);

  return {
    searchGb: 'ordNo',
    searchValue: '',
    dateGb: 'ORDER_DT',
    searchStartDt: formatOrderSearchDate(startDate),
    searchEndDt: formatOrderSearchDate(endDate),
    ordDtlStatCd: '',
    chgDtlStatCd: '',
  };
};
