// 반품 회수 관리에서 검색 가능한 반품 상세 상태 코드입니다.
export type OrderReturnManageStatusCode = 'CHG_DTL_STAT_11' | 'CHG_DTL_STAT_12' | 'CHG_DTL_STAT_13';

// 반품 회수 관리 검색 조건을 정의합니다.
export interface OrderReturnManageSearchParams {
  // 반품 상세 상태 코드입니다.
  chgDtlStatCd: OrderReturnManageStatusCode;
}

// 반품 회수 관리 목록 행 정보를 정의합니다.
export interface OrderReturnManageRow {
  // 클레임번호입니다.
  clmNo: string;
  // 주문번호입니다.
  ordNo: string;
  // 주문상세번호입니다.
  ordDtlNo: number;
  // 상품코드입니다.
  goodsId: string;
  // 사이즈코드입니다.
  sizeId: string;
  // 수량입니다.
  qty: number;
  // 상품명입니다.
  goodsNm: string;
  // 회수 택배사 코드입니다.
  delvCompCd: string;
  // 회수 택배사명입니다.
  delvCompNm: string;
  // 회수 송장번호입니다.
  invoiceNo: string;
  // 클레임 신청 일시입니다.
  chgDt: string;
  // 반품 상세 상태 코드입니다.
  chgDtlStatCd: OrderReturnManageStatusCode;
  // 반품 상세 상태명입니다.
  chgDtlStatNm: string;
}

// 반품 회수 관리 그리드 병합 표시용 행 정보를 정의합니다.
export interface OrderReturnManageGridRow extends OrderReturnManageRow {
  // 같은 클레임번호 묶음의 첫 행 여부입니다.
  claimGroupFirstRowYn: boolean;
  // 같은 클레임번호 묶음의 병합 행 수입니다.
  claimGroupRowSpan: number;
  // 병합 셀에 표시할 클레임번호입니다.
  clmNoDisplay: string;
}

// 반품 회수 관리 목록 응답 구조를 정의합니다.
export interface OrderReturnManageListResponse {
  // 반품 회수 관리 목록입니다.
  list: OrderReturnManageRow[];
  // 전체 클레임 건수입니다.
  totalCount: number;
  // 현재 페이지입니다.
  page: number;
  // 페이지 크기입니다.
  pageSize: number;
}

// 반품 회수 신청 저장 대상 1건을 정의합니다.
export interface AdminOrderReturnPickupRequestItem {
  // 클레임번호입니다.
  clmNo: string;
  // 회수 택배사 코드입니다.
  delvCompCd: string;
  // 회수 송장번호입니다.
  invoiceNo: string;
}

// 반품 회수 신청 저장 요청을 정의합니다.
export interface AdminOrderReturnPickupRequest {
  // 처리 대상 클레임 목록입니다.
  itemList: AdminOrderReturnPickupRequestItem[];
}

// 반품 회수중 처리 대상 1건을 정의합니다.
export interface AdminOrderReturnPickupStartItem {
  // 클레임번호입니다.
  clmNo: string;
}

// 반품 회수중 처리 요청을 정의합니다.
export interface AdminOrderReturnPickupStartRequest {
  // 처리 대상 클레임 목록입니다.
  itemList: AdminOrderReturnPickupStartItem[];
}

// 반품 회수 관리 상태 변경 응답을 정의합니다.
export interface AdminOrderReturnManageStatusResponse {
  // 변경된 클레임 건수입니다.
  updatedCount: number;
}
