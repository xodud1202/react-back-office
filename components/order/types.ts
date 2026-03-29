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

// 주문 상세 마스터 정보를 정의합니다.
export interface OrderMasterInfo {
  // 주문번호입니다.
  ordNo: string;
  // 주문일시입니다.
  orderDt: string;
  // 결제일시입니다.
  orderConfirmDt: string | null;
  // 주문 고객명(주문자명)입니다.
  custNm: string;
  // 고객 휴대폰번호(받는사람 휴대폰번호 대체)입니다.
  custPhoneNumber: string;
  // 고객 이메일(받는사람 이메일 대체)입니다.
  custEmail: string;
  // 받는사람명입니다.
  rcvNm: string;
  // 받는사람 우편번호입니다.
  rcvPostNo: string;
  // 받는사람 배송 주소 베이스입니다.
  rcvAddrBase: string;
  // 받는사람 배송 상세 주소입니다.
  rcvAddrDtl: string;
  // 배송비 금액입니다.
  ordDelvAmt: number;
  // 배송비 쿠폰 할인 금액입니다.
  delvCpnDcAmt: number;
}

// 주문 상세 행 정보를 정의합니다.
export interface OrderDetailRow {
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 주문수량입니다.
  ordQty: number;
  // 취소수량입니다.
  cncQty: number;
  // 잔여수량입니다.
  rmnQty: number;
  // 공급가 금액입니다.
  supplyAmt: number;
  // 판매가(개당) 금액입니다.
  saleAmt: number;
  // 상품쿠폰 할인 금액입니다.
  goodsCpnDcAmt: number;
  // 장바구니쿠폰 할인 금액입니다.
  cartCpnDcAmt: number;
  // 포인트 사용 금액입니다.
  pointUseAmt: number;
  // 실결제금액입니다.
  finalPayAmt: number;
}

// 주문 상세 조회 응답을 정의합니다.
export interface OrderDetailResponse {
  // 주문 마스터 정보입니다.
  master: OrderMasterInfo;
  // 주문 상세 목록입니다.
  list: OrderDetailRow[];
}

// 관리자 주문취소 상품 아이템을 정의합니다.
export interface AdminOrderCancelDetailItem {
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 주문상세 상태코드입니다. (ORD_DTL_STAT_01/02/03)
  ordDtlStatCd: string;
  // 주문수량입니다.
  ordQty: number;
  // 취소 가능 수량(잔여수량)입니다.
  cancelableQty: number;
  // 공급가입니다.
  supplyAmt: number;
  // 판매가(개당)입니다.
  saleAmt: number;
  // 추가금액입니다.
  addAmt: number;
  // 상품쿠폰 할인 금액입니다.
  goodsCouponDiscountAmt: number;
  // 장바구니쿠폰 할인 금액입니다.
  cartCouponDiscountAmt: number;
  // 포인트 사용 금액입니다.
  pointUseAmt: number;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
}

// 관리자 주문취소 금액 요약을 정의합니다.
export interface AdminOrderCancelAmountSummary {
  // 배송비 금액입니다.
  deliveryFeeAmt: number;
  // 배송비쿠폰 할인 금액입니다.
  deliveryCouponDiscountAmt: number;
}

// 관리자 주문취소 사이트 정보를 정의합니다.
export interface AdminOrderCancelSiteInfo {
  // 기본 배송비입니다.
  deliveryFee: number;
  // 무료배송 기준금액입니다.
  deliveryFeeLimit: number;
}

// 관리자 주문취소 사유 아이템을 정의합니다.
export interface AdminOrderCancelReasonItem {
  // 사유 코드입니다.
  cd: string;
  // 사유 코드명입니다.
  cdNm: string;
}

// 관리자 주문취소 신청 화면 응답을 정의합니다.
export interface AdminOrderCancelPageResponse {
  // 주문 정보입니다.
  order: { ordNo: string; detailList: AdminOrderCancelDetailItem[] } | null;
  // 금액 요약입니다.
  amountSummary: AdminOrderCancelAmountSummary;
  // 사이트 정보입니다.
  siteInfo: AdminOrderCancelSiteInfo;
  // 취소 사유 목록입니다.
  reasonList: AdminOrderCancelReasonItem[];
}

// 관리자 주문취소 환불 예정 금액을 정의합니다.
export interface AdminOrderCancelPreviewAmount {
  // 취소 예정 금액입니다.
  expectedRefundAmt: number;
  // 실결제 상품가입니다.
  paidGoodsAmt: number;
  // 환급 혜택 합계입니다.
  benefitAmt: number;
  // 배송비 조정액입니다.
  shippingAdjustmentAmt: number;
  // 포인트 환급액입니다.
  totalPointRefundAmt: number;
  // 배송비쿠폰 환급액입니다.
  deliveryCouponRefundAmt: number;
}

// 관리자 주문취소 요청 본문을 정의합니다.
export interface AdminOrderCancelRequest {
  // 주문번호입니다.
  ordNo: string;
  // 취소 사유 코드입니다.
  reasonCd: string;
  // 취소 사유 상세입니다.
  reasonDetail: string;
  // 취소 상품 목록입니다.
  cancelItemList: { ordDtlNo: number; cancelQty: number }[];
  // 화면 계산 취소 예정 금액 요약입니다.
  previewAmount: AdminOrderCancelPreviewAmount;
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
