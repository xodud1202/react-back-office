// 배송 시작 관리 검색 가능 주문상세 상태 코드입니다.
export type OrderStartDeliveryStatusCode = 'ORD_DTL_STAT_03' | 'ORD_DTL_STAT_04' | 'ORD_DTL_STAT_05';

// 배송 시작 관리 검색 조건을 정의합니다.
export interface OrderStartDeliverySearchParams {
  // 주문상세 상태 코드입니다.
  ordDtlStatCd: OrderStartDeliveryStatusCode;
}

// 배송 시작 관리 목록 행 정보를 정의합니다.
export interface OrderStartDeliveryRow {
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 상품명입니다.
  goodsNm: string;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 배송업체 코드입니다.
  delvCompCd: string;
  // 배송업체명입니다.
  delvCompNm: string;
  // 송장번호입니다.
  invoiceNo: string;
  // 결제일시입니다.
  payDt: string;
  // 주문상세 상태 코드입니다.
  ordDtlStatCd: OrderStartDeliveryStatusCode;
  // 주문상세 상태명입니다.
  ordDtlStatNm: string;
}

// 배송 시작 관리 목록 응답 구조를 정의합니다.
export interface OrderStartDeliveryListResponse {
  // 배송 시작 관리 목록입니다.
  list: OrderStartDeliveryRow[];
  // 전체 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 배송 준비중 변경 대상 행 정보를 정의합니다.
export interface AdminOrderStartDeliveryPrepareItemRequest {
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 배송업체 코드입니다.
  delvCompCd: string;
  // 송장번호입니다.
  invoiceNo: string;
}

// 배송 상태 변경 대상 행 키 정보를 정의합니다.
export interface AdminOrderStartDeliveryStatusItemRequest {
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
}

// 배송 준비중 변경 요청을 정의합니다.
export interface AdminOrderStartDeliveryPrepareRequest {
  // 처리 대상 상품 목록입니다.
  itemList: AdminOrderStartDeliveryPrepareItemRequest[];
}

// 배송 상태 변경 요청을 정의합니다.
export interface AdminOrderStartDeliveryStatusRequest {
  // 처리 대상 상품 키 목록입니다.
  itemList: AdminOrderStartDeliveryStatusItemRequest[];
}

// 배송 상태 변경 응답을 정의합니다.
export interface AdminOrderStartDeliveryStatusResponse {
  // 변경된 건수입니다.
  updatedCount: number;
}
